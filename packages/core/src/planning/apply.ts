import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { resolveInsideRoot } from "../filesystem/paths.js";
import {
  createPackageManagerAdapter,
  type CommandRunner,
  type PackageManagerAdapter
} from "../package-managers/index.js";
import type { Diagnostic } from "../types/common.js";
import type { ChangePlan } from "./change-plan.js";
import type { Operation } from "./operations.js";
import { validateChangePlan } from "./validation.js";

export interface OperationApplyResult {
  operationId: string;
  skipped: boolean;
  message: string;
}

export interface ApplyChangePlanOptions {
  dryRun?: boolean;
  transactional?: boolean;
  commandRunner?: CommandRunner;
  packageManagerAdapters?: PackageManagerAdapter[];
}

export interface ApplyChangePlanResult {
  applied: OperationApplyResult[];
  diagnostics: Diagnostic[];
  transaction?: ApplyTransactionSummary;
}

export interface ApplyTransactionSummary {
  id: string;
  rolledBack: boolean;
  snapshots: FileSnapshotSummary[];
  dependencies: DependencySnapshotSummary[];
}

export interface FileSnapshotSummary {
  path: string;
  existed: boolean;
  beforeHash?: string;
  afterHash?: string;
}

export interface DependencySnapshotSummary {
  name: string;
  packageManager: string;
  wasInstalled: boolean;
  installedByAvis: boolean;
  rolledBack: boolean;
}

export class ApplyChangePlanError extends Error {
  readonly applied: OperationApplyResult[];
  readonly diagnostics: Diagnostic[];
  readonly transaction: ApplyTransactionSummary;

  constructor(
    message: string,
    applied: OperationApplyResult[],
    diagnostics: Diagnostic[],
    transaction: ApplyTransactionSummary
  ) {
    super(message);
    this.name = "ApplyChangePlanError";
    this.applied = applied;
    this.diagnostics = diagnostics;
    this.transaction = transaction;
  }
}

interface FileSnapshot {
  path: string;
  absolutePath: string;
  existed: boolean;
  contents?: string;
  beforeHash?: string;
  afterHash?: string;
}

interface DependencySnapshot {
  name: string;
  packageManager: string;
  wasInstalled: boolean;
  installedByAvis: boolean;
  rolledBack: boolean;
}

export async function applyChangePlan(
  plan: ChangePlan,
  options: ApplyChangePlanOptions = {}
): Promise<ApplyChangePlanResult> {
  const validation = validateChangePlan(plan);
  if (!validation.valid) {
    return {
      applied: [],
      diagnostics: validation.diagnostics
    };
  }

  const applied: OperationApplyResult[] = [];
  const transactional = options.transactional ?? true;
  const snapshots =
    !options.dryRun && transactional ? await snapshotWritableFiles(plan) : new Map<string, FileSnapshot>();
  const dependencySnapshots =
    !options.dryRun && transactional
      ? await snapshotDependencyAdds(plan, options)
      : new Map<string, DependencySnapshot>();
  const transaction: ApplyTransactionSummary | undefined =
    !options.dryRun && transactional
      ? {
          id: createTransactionId(plan),
          rolledBack: false,
          snapshots: [],
          dependencies: []
        }
      : undefined;

  try {
    for (const operation of plan.operations) {
      const result = await applyOperation(plan, operation, options);
      applied.push(result);
      await markSnapshotAfterApply(operation, snapshots);
      markDependencySnapshotAfterApply(plan, operation, dependencySnapshots, result);
    }
  } catch (error) {
    if (transaction) {
      const rollbackDiagnostics = [
        ...await rollbackDependencies(plan, dependencySnapshots, options),
        ...await rollbackWritableFiles(snapshots)
      ];
      transaction.rolledBack = true;
      transaction.snapshots = summarizeSnapshots(snapshots);
      transaction.dependencies = summarizeDependencySnapshots(dependencySnapshots);
      throw new ApplyChangePlanError(
        error instanceof Error ? error.message : String(error),
        applied,
        [...validation.diagnostics, ...rollbackDiagnostics],
        transaction
      );
    }

    throw error;
  }

  if (transaction) {
    transaction.snapshots = summarizeSnapshots(snapshots);
    transaction.dependencies = summarizeDependencySnapshots(dependencySnapshots);
  }

  return {
    applied,
    diagnostics: validation.diagnostics,
    transaction
  };
}

async function applyOperation(
  plan: ChangePlan,
  operation: Operation,
  options: ApplyChangePlanOptions
): Promise<OperationApplyResult> {
  if (options.dryRun) {
    return {
      operationId: operation.id,
      skipped: true,
      message: `Dry run: ${operation.description}`
    };
  }

  switch (operation.type) {
    case "dependency.add":
      return applyDependencyAdd(plan, operation, options);

    case "dependency.remove":
      throw new Error("dependency.remove is not implemented yet.");

    case "file.create":
      return applyFileCreate(plan, operation);

    case "json.merge":
      return applyJsonMerge(plan, operation);

    case "text.patch":
      return applyTextPatch(plan, operation);

    case "env.ensure":
      return applyEnvEnsure(plan, operation);
  }
}

async function applyDependencyAdd(
  plan: ChangePlan,
  operation: Extract<Operation, { type: "dependency.add" }>,
  options: ApplyChangePlanOptions
): Promise<OperationApplyResult> {
  const packageManagerId = operation.packageManager ?? plan.target.packageManager?.id;
  if (!packageManagerId) {
    throw new Error("Cannot add dependencies without a detected package manager.");
  }

  const adapter =
    options.packageManagerAdapters?.find((candidate) => candidate.id === packageManagerId) ??
    createPackageManagerAdapter(packageManagerId);

  const command = adapter.buildAddCommand(plan.target, {
    packages: operation.packages,
    dependencyType: operation.dependencyType
  });

  if (!options.commandRunner) {
    throw new Error("Cannot add dependencies without a command runner.");
  }

  await options.commandRunner(command);

  return {
    operationId: operation.id,
    skipped: false,
    message: `Installed ${operation.packages.map((pkg) => pkg.name).join(", ")}.`
  };
}

async function applyFileCreate(
  plan: ChangePlan,
  operation: Extract<Operation, { type: "file.create" }>
): Promise<OperationApplyResult> {
  const absolutePath = resolveInsideRoot(plan.target.targetRoot, operation.path);

  try {
    const existingContents = await readFile(absolutePath, "utf8");
    if (operation.overwrite === "if-identical" && existingContents === operation.contents) {
      return {
        operationId: operation.id,
        skipped: true,
        message: `${operation.path} already exists.`
      };
    }

    throw new Error(`Refusing to overwrite existing file: ${operation.path}`);
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, operation.contents, "utf8");

  return {
    operationId: operation.id,
    skipped: false,
    message: `Created ${operation.path}.`
  };
}

async function applyJsonMerge(
  plan: ChangePlan,
  operation: Extract<Operation, { type: "json.merge" }>
): Promise<OperationApplyResult> {
  const absolutePath = resolveInsideRoot(plan.target.targetRoot, operation.path);
  const existing = JSON.parse(await readFile(absolutePath, "utf8")) as Record<string, unknown>;
  const merged = deepMerge(existing, operation.value);

  await writeFile(absolutePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  return {
    operationId: operation.id,
    skipped: false,
    message: `Updated ${operation.path}.`
  };
}

async function applyTextPatch(
  plan: ChangePlan,
  operation: Extract<Operation, { type: "text.patch" }>
): Promise<OperationApplyResult> {
  const absolutePath = resolveInsideRoot(plan.target.targetRoot, operation.path);
  const contents = await readFile(absolutePath, "utf8");

  if (!contents.includes(operation.search)) {
    throw new Error(`Patch search text was not found in ${operation.path}.`);
  }

  const updated = contents.replace(operation.search, operation.replace);
  if (updated === contents) {
    return {
      operationId: operation.id,
      skipped: true,
      message: `${operation.path} already matches patch.`
    };
  }

  await writeFile(absolutePath, updated, "utf8");

  return {
    operationId: operation.id,
    skipped: false,
    message: `Patched ${operation.path}.`
  };
}

async function applyEnvEnsure(
  plan: ChangePlan,
  operation: Extract<Operation, { type: "env.ensure" }>
): Promise<OperationApplyResult> {
  const absolutePath = resolveInsideRoot(plan.target.targetRoot, operation.path);
  let contents = "";

  try {
    contents = await readFile(absolutePath, "utf8");
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }
  }

  const existingKeys = new Set(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")[0])
      .filter(Boolean)
  );

  const missingLines = Object.entries(operation.variables)
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, value]) => `${key}=${value}`);

  if (missingLines.length === 0) {
    return {
      operationId: operation.id,
      skipped: true,
      message: `${operation.path} already contains required variables.`
    };
  }

  const prefix = contents.length > 0 && !contents.endsWith("\n") ? "\n" : "";
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${contents}${prefix}${missingLines.join("\n")}\n`, "utf8");

  return {
    operationId: operation.id,
    skipped: false,
    message: `Updated ${operation.path}.`
  };
}

function deepMerge(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...left };

  for (const [key, rightValue] of Object.entries(right)) {
    const leftValue = result[key];

    if (isPlainObject(leftValue) && isPlainObject(rightValue)) {
      result[key] = deepMerge(leftValue, rightValue);
    } else {
      result[key] = rightValue;
    }
  }

  return result;
}

async function snapshotWritableFiles(plan: ChangePlan): Promise<Map<string, FileSnapshot>> {
  const snapshots = new Map<string, FileSnapshot>();

  for (const operation of plan.operations) {
    if (!writesPath(operation)) {
      continue;
    }

    if (snapshots.has(operation.path)) {
      continue;
    }

    const absolutePath = resolveInsideRoot(plan.target.targetRoot, operation.path);
    try {
      const contents = await readFile(absolutePath, "utf8");
      snapshots.set(operation.path, {
        path: operation.path,
        absolutePath,
        existed: true,
        contents,
        beforeHash: sha256(contents)
      });
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw error;
      }

      snapshots.set(operation.path, {
        path: operation.path,
        absolutePath,
        existed: false
      });
    }
  }

  return snapshots;
}

async function markSnapshotAfterApply(
  operation: Operation,
  snapshots: Map<string, FileSnapshot>
): Promise<void> {
  if (!writesPath(operation)) {
    return;
  }

  const snapshot = snapshots.get(operation.path);
  if (!snapshot) {
    return;
  }

  try {
    const contents = await readFile(snapshot.absolutePath, "utf8");
    snapshot.afterHash = sha256(contents);
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }
  }
}

async function rollbackWritableFiles(
  snapshots: Map<string, FileSnapshot>
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  for (const snapshot of Array.from(snapshots.values()).reverse()) {
    if (!snapshot.afterHash) {
      continue;
    }

    const currentContents = await readOptionalTextFile(snapshot.absolutePath);
    const currentHash = currentContents === undefined ? undefined : sha256(currentContents);
    if (currentHash !== snapshot.afterHash) {
      diagnostics.push({
        severity: "warning",
        message: `Skipped rollback for ${snapshot.path} because it changed after Avis wrote it.`
      });
      continue;
    }

    if (snapshot.existed) {
      await writeFile(snapshot.absolutePath, snapshot.contents ?? "", "utf8");
      diagnostics.push({
        severity: "info",
        message: `Rolled back ${snapshot.path} to its previous contents.`
      });
    } else {
      await rm(snapshot.absolutePath, { force: true });
      diagnostics.push({
        severity: "info",
        message: `Removed ${snapshot.path} created by the failed apply.`
      });
    }
  }

  return diagnostics;
}

async function snapshotDependencyAdds(
  plan: ChangePlan,
  options: ApplyChangePlanOptions
): Promise<Map<string, DependencySnapshot>> {
  const snapshots = new Map<string, DependencySnapshot>();

  for (const operation of plan.operations) {
    if (operation.type !== "dependency.add") {
      continue;
    }

    const packageManagerId = operation.packageManager ?? plan.target.packageManager?.id;
    if (!packageManagerId) {
      continue;
    }

    const adapter =
      options.packageManagerAdapters?.find((candidate) => candidate.id === packageManagerId) ??
      createPackageManagerAdapter(packageManagerId);

    await Promise.all(
      operation.packages.map(async (packageSpec) => {
        const key = dependencySnapshotKey(packageManagerId, packageSpec.name);
        if (snapshots.has(key)) {
          return;
        }

        snapshots.set(key, {
          name: packageSpec.name,
          packageManager: packageManagerId,
          wasInstalled: await adapter.isDependencyInstalled(plan.target, packageSpec.name),
          installedByAvis: false,
          rolledBack: false
        });
      })
    );
  }

  return snapshots;
}

function markDependencySnapshotAfterApply(
  plan: ChangePlan,
  operation: Operation,
  snapshots: Map<string, DependencySnapshot>,
  result: OperationApplyResult
): void {
  if (operation.type !== "dependency.add" || result.skipped) {
    return;
  }

  const packageManagerId = operation.packageManager ?? plan.target.packageManager?.id;
  if (!packageManagerId) {
    return;
  }

  for (const packageSpec of operation.packages) {
    const snapshot = snapshots.get(dependencySnapshotKey(packageManagerId, packageSpec.name));
    if (snapshot && !snapshot.wasInstalled) {
      snapshot.installedByAvis = true;
    }
  }
}

async function rollbackDependencies(
  plan: ChangePlan,
  snapshots: Map<string, DependencySnapshot>,
  options: ApplyChangePlanOptions
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  if (!options.commandRunner) {
    return diagnostics;
  }

  const rollbackGroups = new Map<string, string[]>();
  for (const snapshot of snapshots.values()) {
    if (!snapshot.installedByAvis || snapshot.wasInstalled || snapshot.rolledBack) {
      continue;
    }

    const group = rollbackGroups.get(snapshot.packageManager) ?? [];
    group.push(snapshot.name);
    rollbackGroups.set(snapshot.packageManager, group);
  }

  for (const [packageManagerId, packages] of rollbackGroups) {
    const adapter =
      options.packageManagerAdapters?.find((candidate) => candidate.id === packageManagerId) ??
      createPackageManagerAdapter(packageManagerId);

    if (!adapter.buildRemoveCommand) {
      diagnostics.push({
        severity: "warning",
        message: `Skipped dependency rollback for ${packages.join(", ")} because ${packageManagerId} does not expose a remove command.`
      });
      continue;
    }

    try {
      await options.commandRunner(
        adapter.buildRemoveCommand(plan.target, {
          packages
        })
      );
      for (const packageName of packages) {
        const snapshot = snapshots.get(dependencySnapshotKey(packageManagerId, packageName));
        if (snapshot) {
          snapshot.rolledBack = true;
        }
      }
      diagnostics.push({
        severity: "info",
        message: `Rolled back dependencies from ${packageManagerId}: ${packages.join(", ")}.`
      });
    } catch (error) {
      diagnostics.push({
        severity: "warning",
        message: `Dependency rollback failed for ${packages.join(", ")}: ${
          error instanceof Error ? error.message : String(error)
        }`
      });
    }
  }

  return diagnostics;
}

async function readOptionalTextFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

function summarizeSnapshots(snapshots: Map<string, FileSnapshot>): FileSnapshotSummary[] {
  return Array.from(snapshots.values())
    .map((snapshot) => ({
      path: snapshot.path,
      existed: snapshot.existed,
      beforeHash: snapshot.beforeHash,
      afterHash: snapshot.afterHash
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function summarizeDependencySnapshots(
  snapshots: Map<string, DependencySnapshot>
): DependencySnapshotSummary[] {
  return Array.from(snapshots.values())
    .map((snapshot) => ({
      name: snapshot.name,
      packageManager: snapshot.packageManager,
      wasInstalled: snapshot.wasInstalled,
      installedByAvis: snapshot.installedByAvis,
      rolledBack: snapshot.rolledBack
    }))
    .sort((left, right) =>
      left.packageManager.localeCompare(right.packageManager) || left.name.localeCompare(right.name)
    );
}

function dependencySnapshotKey(packageManagerId: string, packageName: string): string {
  return `${packageManagerId}:${packageName}`;
}

function createTransactionId(plan: ChangePlan): string {
  return sha256(`${plan.integrationId}:${Date.now()}:${Math.random()}`).slice(0, 16);
}

function writesPath(operation: Operation): operation is Extract<
  Operation,
  { type: "file.create" | "json.merge" | "text.patch" | "env.ensure" }
> {
  return (
    operation.type === "file.create" ||
    operation.type === "json.merge" ||
    operation.type === "text.patch" ||
    operation.type === "env.ensure"
  );
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
