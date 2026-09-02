import type { ChangePlan } from "../planning/change-plan.js";
import type { Operation } from "../planning/operations.js";
import type { IntegrationHealth, VerificationCheck } from "../verification/types.js";

export interface LocalIntegrationRegistration {
  path: string;
  addedAt: string;
}

export interface LocalIntegrationRegistryFile {
  schemaVersion: 1;
  integrations: LocalIntegrationRegistration[];
}

export interface LocalIntegrationPlanTemplate {
  title?: string;
  operations: Operation[];
}

export interface LocalIntegrationVerifyTemplate {
  health: IntegrationHealth;
  checks: VerificationCheck[];
}

export type LocalIntegrationChangePlan = Omit<ChangePlan, "target">;
