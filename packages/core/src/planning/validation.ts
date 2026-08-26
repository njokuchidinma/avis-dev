import type { Diagnostic } from "../types/common.js";
import { isSafeRelativePath } from "../filesystem/paths.js";
import type { ChangePlan } from "./change-plan.js";
import type { Operation } from "./operations.js";

export interface PlanValidationResult {
  valid: boolean;
  diagnostics: Diagnostic[];
}

export function validateChangePlan(plan: ChangePlan): PlanValidationResult {
  const diagnostics: Diagnostic[] = [];

  if (!plan.id.trim()) {
    diagnostics.push(errorDiagnostic("ChangePlan id is required."));
  }

  if (!plan.title.trim()) {
    diagnostics.push(errorDiagnostic("ChangePlan title is required."));
  }

  if (!plan.integrationId.trim()) {
    diagnostics.push(errorDiagnostic("ChangePlan integrationId is required."));
  }

  const operationIds = new Set<string>();

  for (const operation of plan.operations) {
    if (!operation.id.trim()) {
      diagnostics.push(errorDiagnostic("Operation id is required."));
    }

    if (operationIds.has(operation.id)) {
      diagnostics.push(errorDiagnostic(`Duplicate operation id: ${operation.id}.`));
    }

    operationIds.add(operation.id);
    diagnostics.push(...validateOperation(operation));
  }

  return {
    valid: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    diagnostics: [...plan.diagnostics, ...diagnostics]
  };
}

function validateOperation(operation: Operation): Diagnostic[] {
  switch (operation.type) {
    case "dependency.add":
      return operation.packages.length === 0
        ? [errorDiagnostic(`Operation ${operation.id} must add at least one package.`)]
        : operation.packages
            .filter((pkg) => !pkg.name.trim())
            .map(() =>
              errorDiagnostic(`Operation ${operation.id} contains an empty package name.`)
            );

    case "dependency.remove":
      return operation.packages.length === 0
        ? [errorDiagnostic(`Operation ${operation.id} must remove at least one package.`)]
        : operation.packages
            .filter((packageName) => !packageName.trim())
            .map(() =>
              errorDiagnostic(`Operation ${operation.id} contains an empty package name.`)
            );

    case "file.create":
    case "json.merge":
    case "text.patch":
    case "env.ensure":
      return isSafeRelativePath(operation.path)
        ? []
        : [
            errorDiagnostic(
              `Operation ${operation.id} uses an unsafe path: ${operation.path}.`
            )
          ];

    default: {
      const exhaustiveCheck: never = operation;
      return [errorDiagnostic(`Unsupported operation: ${JSON.stringify(exhaustiveCheck)}.`)];
    }
  }
}

function errorDiagnostic(message: string): Diagnostic {
  return {
    severity: "error",
    message
  };
}
