import type { Diagnostic } from "../types/common.js";
import type { ProjectContext } from "../types/project-context.js";
import type { ChangePlan } from "./change-plan.js";
import type { Operation } from "./operations.js";

export interface ComposeChangePlansOptions {
  id: string;
  title: string;
  integrationId: string;
  target: ProjectContext;
}

export function composeChangePlans(
  plans: ChangePlan[],
  options: ComposeChangePlansOptions
): ChangePlan {
  const diagnostics = [
    ...plans.flatMap((plan) => plan.diagnostics),
    ...detectPlanConflicts(plans)
  ];

  return {
    id: options.id,
    title: options.title,
    integrationId: options.integrationId,
    target: options.target,
    operations: mergeOperations(plans.flatMap((plan) => plan.operations)),
    diagnostics
  };
}

export function detectPlanConflicts(plans: ChangePlan[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const operationIds = new Map<string, string>();
  const pathWriters = new Map<string, Operation>();

  for (const plan of plans) {
    for (const operation of plan.operations) {
      const existingPlanId = operationIds.get(operation.id);
      if (existingPlanId) {
        diagnostics.push({
          severity: "error",
          message: `Operation id ${operation.id} is used by both ${existingPlanId} and ${plan.id}.`
        });
      }
      operationIds.set(operation.id, plan.id);

      if (!writesPath(operation)) {
        continue;
      }

      const existingWriter = pathWriters.get(operation.path);
      if (!existingWriter) {
        pathWriters.set(operation.path, operation);
        continue;
      }

      if (!areCompatiblePathWrites(existingWriter, operation)) {
        diagnostics.push({
          severity: "error",
          message: `Conflicting operations target ${operation.path}: ${existingWriter.id} and ${operation.id}.`
        });
      }
    }
  }

  return diagnostics;
}

function mergeOperations(operations: Operation[]): Operation[] {
  const merged: Operation[] = [];
  const dependencyAdds = new Map<string, Extract<Operation, { type: "dependency.add" }>>();

  for (const operation of operations) {
    if (operation.type !== "dependency.add") {
      merged.push(operation);
      continue;
    }

    const key = `${operation.packageManager ?? ""}:${operation.dependencyType}`;
    const existing = dependencyAdds.get(key);
    if (!existing) {
      dependencyAdds.set(key, { ...operation, packages: [...operation.packages] });
      continue;
    }

    const existingPackageNames = new Set(existing.packages.map((pkg) => pkg.name));
    for (const packageSpec of operation.packages) {
      if (!existingPackageNames.has(packageSpec.name)) {
        existing.packages.push(packageSpec);
        existingPackageNames.add(packageSpec.name);
      }
    }

    existing.description = `Install ${existing.packages
      .map((packageSpec) => packageSpec.name)
      .join(", ")}.`;
  }

  return [...dependencyAdds.values(), ...merged];
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

function areCompatiblePathWrites(left: Operation, right: Operation): boolean {
  if (left.type === "env.ensure" && right.type === "env.ensure") {
    return true;
  }

  if (left.type === "json.merge" && right.type === "json.merge") {
    return true;
  }

  if (left.type === "file.create" && right.type === "file.create") {
    return left.contents === right.contents && left.overwrite === right.overwrite;
  }

  return false;
}
