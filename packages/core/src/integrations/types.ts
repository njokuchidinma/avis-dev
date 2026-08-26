import type { ChangePlan } from "../planning/change-plan.js";
import type {
  CapabilityId,
  EcosystemId,
  FrameworkId,
  IntegrationId
} from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";

export interface Capability {
  id: CapabilityId;
  name: string;
  description?: string;
}

export interface IntegrationSupport {
  ecosystems: EcosystemId[];
  frameworks?: FrameworkId[];
}

export type CompatibilityResult =
  | {
      supported: true;
    }
  | {
      supported: false;
      reason: string;
    };

export interface IntegrationPlanRequest {
  context: ProjectContext;
}

export interface AvisIntegration {
  id: IntegrationId;
  name: string;
  capability: CapabilityId;
  supports: IntegrationSupport;
  isCompatible(context: ProjectContext): CompatibilityResult;
  plan(request: IntegrationPlanRequest): Promise<ChangePlan>;
  verify?(context: ProjectContext): Promise<VerificationResult>;
}
