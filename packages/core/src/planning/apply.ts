import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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
  commandRunner?: CommandRunner;
  packageManagerAdapters?: PackageManagerAdapter[];
}

export interface ApplyChangePlanResult {
  applied: OperationApplyResult[];
  diagnostics: Diagnostic[];
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

  for (const operation of plan.operations) {
    applied.push(await applyOperation(plan, operation, options));
  }

  return {
    applied,
    diagnostics: validation.diagnostics
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
