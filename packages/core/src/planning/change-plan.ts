import type { IntegrationId } from "../types/ids.js";
import type { Diagnostic } from "../types/common.js";
import type { ProjectContext } from "../types/project-context.js";
import type { Operation } from "./operations.js";

export interface ChangePlan {
  id: string;
  title: string;
  integrationId: IntegrationId;
  target: ProjectContext;
  operations: Operation[];
  diagnostics: Diagnostic[];
}

export function isEmptyChangePlan(plan: ChangePlan): boolean {
  return plan.operations.length === 0;
}
