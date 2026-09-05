import type {
  CapabilityId,
  EcosystemId,
  FrameworkId,
  ProjectTypeId
} from "../types/ids.js";

export type FrameworkSupportTier = "tier-1" | "tier-2" | "tier-3";

export interface FrameworkDefinition {
  id: FrameworkId;
  name: string;
  ecosystem: EcosystemId;
  supportTier: FrameworkSupportTier;
  defaultProjectType: ProjectTypeId;
  relevantCapabilities: CapabilityId[];
}
