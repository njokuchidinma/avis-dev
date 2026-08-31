import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveInsideRoot } from "../filesystem/paths.js";
import type { AvisIntegration } from "../integrations/types.js";
import type { ChangePlan } from "../planning/change-plan.js";
import type { Operation } from "../planning/operations.js";

export interface AvisStateFileRecord {
  path: string;
  createdByAvis: boolean;
  modifiedByAvis: boolean;
  hash?: string;
  lastOperationId: string;
}

export interface AvisStateDependencyRecord {
  name: string;
  packageManager?: string;
  dependencyType: string;
  lastOperationId: string;
}

export interface AvisStateIntegrationRecord {
  integrationVersion: string;
  appliedAt: string;
  files: AvisStateFileRecord[];
  dependencies: AvisStateDependencyRecord[];
}

export interface AvisProjectState {
  schemaVersion: 1;
  integrations: Record<string, AvisStateIntegrationRecord>;
}

const statePath = ".avis/state.json";

export async function readAvisProjectState(root: string): Promise<AvisProjectState> {
  try {
    const contents = await readFile(path.join(root, statePath), "utf8");
    return normalizeState(JSON.parse(contents) as Partial<AvisProjectState>);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return createEmptyState();
    }

    throw error;
  }
}

export async function writeAvisProjectState(
  root: string,
  state: AvisProjectState
): Promise<void> {
  const absoluteStatePath = resolveInsideRoot(root, statePath);
  await mkdir(path.dirname(absoluteStatePath), { recursive: true });
  await writeFile(absoluteStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function recordAppliedIntegrationPlan(
  plan: ChangePlan,
  integration: AvisIntegration,
  appliedAt = new Date().toISOString()
): Promise<AvisProjectState> {
  const state = await readAvisProjectState(plan.target.targetRoot);
  const existing = state.integrations[integration.manifest.id];
  const files = new Map<string, AvisStateFileRecord>(
    existing?.files.map((file) => [file.path, file]) ?? []
  );
  const dependencies = new Map<string, AvisStateDependencyRecord>(
    existing?.dependencies.map((dependency) => [dependency.name, dependency]) ?? []
  );

  for (const operation of plan.operations) {
    if (operation.type === "dependency.add") {
      for (const packageSpec of operation.packages) {
        dependencies.set(packageSpec.name, {
          name: packageSpec.name,
          packageManager: operation.packageManager,
          dependencyType: operation.dependencyType,
          lastOperationId: operation.id
        });
      }
      continue;
    }

    if (writesPath(operation)) {
      files.set(operation.path, {
        path: operation.path,
        createdByAvis: operation.type === "file.create",
        modifiedByAvis: operation.type !== "file.create",
        hash: await hashFileIfPresent(plan.target.targetRoot, operation.path),
        lastOperationId: operation.id
      });
    }
  }

  state.integrations[integration.manifest.id] = {
    integrationVersion: integration.manifest.version,
    appliedAt,
    files: Array.from(files.values()).sort((left, right) =>
      left.path.localeCompare(right.path)
    ),
    dependencies: Array.from(dependencies.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    )
  };

  await writeAvisProjectState(plan.target.targetRoot, state);
  return state;
}

export async function getAvisStatePath(root: string): Promise<string> {
  return resolveInsideRoot(root, statePath);
}

function createEmptyState(): AvisProjectState {
  return {
    schemaVersion: 1,
    integrations: {}
  };
}

function normalizeState(state: Partial<AvisProjectState>): AvisProjectState {
  return {
    schemaVersion: 1,
    integrations: state.integrations ?? {}
  };
}

async function hashFileIfPresent(
  root: string,
  relativePath: string
): Promise<string | undefined> {
  try {
    const contents = await readFile(resolveInsideRoot(root, relativePath));
    return createHash("sha256").update(contents).digest("hex");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
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

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
