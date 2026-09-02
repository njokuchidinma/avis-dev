import type { ChangePlan } from "../planning/change-plan.js";
import type {
  CapabilityId,
  EcosystemId,
  FrameworkId,
  IntegrationId,
  PackageManagerId
} from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";

export interface Capability {
  id: CapabilityId;
  name: string;
  description?: string;
  aliases?: string[];
  defaultIntegrations?: Partial<Record<EcosystemId, IntegrationId>>;
  exclusive?: boolean;
}

export interface IntegrationSupport {
  ecosystems: EcosystemId[];
  frameworks?: FrameworkId[];
  frameworkVersionConstraints?: Partial<Record<FrameworkId, string>>;
  packageManagers?: PackageManagerId[];
}

export type IntegrationStatus = "experimental" | "stable" | "deprecated";
export type IntegrationTrustLevel =
  | "official"
  | "verified"
  | "community"
  | "local"
  | "experimental";

export interface IntegrationDependencyRequirement {
  name: string;
  type: "runtime" | "development";
  optional?: boolean;
}

export interface IntegrationDocumentation {
  homepage?: string;
  quickstart?: string;
}

export interface IntegrationConfigurationOption {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
}

export interface IntegrationSource {
  owner: "avis" | "community" | "local";
  repository?: string;
  path?: string;
}

export interface AvisIntegrationManifest {
  id: IntegrationId;
  name: string;
  description: string;
  capability: CapabilityId;
  version: string;
  status: IntegrationStatus;
  trust: IntegrationTrustLevel;
  supports: IntegrationSupport;
  dependencies?: IntegrationDependencyRequirement[];
  configurationOptions?: IntegrationConfigurationOption[];
  configures?: string[];
  repair?: "unsupported" | "plan";
  documentation?: IntegrationDocumentation;
  source?: IntegrationSource;
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
  manifest: AvisIntegrationManifest;
  isCompatible(context: ProjectContext): CompatibilityResult;
  plan(request: IntegrationPlanRequest): Promise<ChangePlan>;
  verify?(context: ProjectContext): Promise<VerificationResult>;
}
