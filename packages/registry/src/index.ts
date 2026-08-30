import type {
  AvisIntegrationManifest,
  AvisIntegration,
  Capability,
  CapabilityId,
  EcosystemId,
  FrameworkId,
  ProjectContext
} from "@avis/core";

export interface IntegrationSupportGroup {
  ecosystem: EcosystemId;
  framework?: FrameworkId;
  integrations: AvisIntegration[];
}

export interface IntegrationRecommendation {
  integration: AvisIntegration;
  recommended: boolean;
  reasons: string[];
}

export interface StackManifest {
  id: string;
  name: string;
  integrations: string[];
  description?: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export class IntegrationRegistry {
  readonly capabilities: Capability[];
  readonly integrations: AvisIntegration[];

  constructor(options: {
    capabilities: Capability[];
    integrations: AvisIntegration[];
  }) {
    this.capabilities = [...options.capabilities];
    this.integrations = [...options.integrations];
  }

  findCapabilityById(id: string): Capability | undefined {
    return this.capabilities.find((capability) => capability.id === id);
  }

  findCapabilityByQuery(query: string): Capability | undefined {
    const normalizedQuery = normalizeIdentifier(query);
    return this.capabilities.find((capability) => {
      const candidates = [capability.id, capability.name, ...(capability.aliases ?? [])];
      return candidates.some((candidate) => normalizeIdentifier(candidate) === normalizedQuery);
    });
  }

  findIntegrationById(id: string): AvisIntegration | undefined {
    return this.integrations.find((integration) => integration.manifest.id === id);
  }

  findCompatibleIntegrations(context: ProjectContext): AvisIntegration[] {
    return this.integrations.filter(
      (integration) => integration.isCompatible(context).supported
    );
  }

  findCompatibleIntegrationsForCapability(
    capabilityId: string,
    context: ProjectContext
  ): AvisIntegration[] {
    return this.findCompatibleIntegrations(context).filter(
      (integration) => integration.manifest.capability === capabilityId
    );
  }

  recommendIntegrationsForCapability(
    capabilityId: string,
    context: ProjectContext
  ): IntegrationRecommendation[] {
    const capability = this.findCapabilityByQuery(capabilityId);
    const integrations = this.findCompatibleIntegrationsForCapability(
      capability?.id ?? capabilityId,
      context
    );
    const defaultIntegrationId = context.ecosystem
      ? capability?.defaultIntegrations?.[context.ecosystem]
      : undefined;

    return integrations
      .map((integration) => ({
        integration,
        recommended: integration.manifest.id === defaultIntegrationId,
        reasons: getRecommendationReasons(integration, context, defaultIntegrationId)
      }))
      .sort(compareRecommendations);
  }

  getSupportGroups(): IntegrationSupportGroup[] {
    const groups = new Map<string, IntegrationSupportGroup>();

    for (const integration of this.integrations) {
      for (const ecosystem of integration.manifest.supports.ecosystems) {
        const frameworks = integration.manifest.supports.frameworks ?? [undefined];

        for (const framework of frameworks) {
          const key = `${ecosystem}:${framework ?? ""}`;
          const existing =
            groups.get(key) ??
            {
              ecosystem,
              framework,
              integrations: []
            };

          existing.integrations.push(integration);
          groups.set(key, existing);
        }
      }
    }

    return Array.from(groups.values()).sort((left, right) =>
      formatSupportGroupLabel(left).localeCompare(formatSupportGroupLabel(right))
    );
  }
}

function getRecommendationReasons(
  integration: AvisIntegration,
  context: ProjectContext,
  defaultIntegrationId: string | undefined
): string[] {
  const reasons = [
    `compatible with ${context.framework?.id ?? context.ecosystem}`,
    `${formatStatusLabel(integration.manifest.status)} integration`
  ];

  if (integration.manifest.id === defaultIntegrationId) {
    reasons.unshift("default recommendation for this ecosystem");
  }

  if (integration.manifest.source?.owner === "avis") {
    reasons.push("maintained by Avis");
  }

  if (integration.manifest.dependencies && integration.manifest.dependencies.length > 0) {
    reasons.push("adds a native project dependency");
  }

  return reasons;
}

function compareRecommendations(
  left: IntegrationRecommendation,
  right: IntegrationRecommendation
): number {
  if (left.recommended !== right.recommended) {
    return left.recommended ? -1 : 1;
  }

  const statusRank = { stable: 0, experimental: 1, deprecated: 2 };
  const statusDifference =
    statusRank[left.integration.manifest.status] -
    statusRank[right.integration.manifest.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return left.integration.manifest.name.localeCompare(right.integration.manifest.name);
}

function formatStatusLabel(status: AvisIntegrationManifest["status"]): string {
  switch (status) {
    case "stable":
      return "stable";
    case "experimental":
      return "experimental";
    case "deprecated":
      return "deprecated";
  }
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-").replace(/\s+/g, "-");
}

export function createIntegrationRegistry(options: {
  capabilities: Capability[];
  integrations: AvisIntegration[];
}): IntegrationRegistry {
  return new IntegrationRegistry(options);
}

export function validateIntegrationManifest(
  manifest: AvisIntegrationManifest
): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest.id.trim()) {
    errors.push("Integration id is required.");
  }

  if (!manifest.name.trim()) {
    errors.push("Integration name is required.");
  }

  if (!manifest.capability.trim()) {
    errors.push("Integration capability is required.");
  }

  if (!manifest.description.trim()) {
    errors.push("Integration description is required.");
  }

  if (!manifest.version.trim()) {
    errors.push("Integration version is required.");
  }

  if (!["experimental", "stable", "deprecated"].includes(manifest.status)) {
    errors.push("Integration status is invalid.");
  }

  if (manifest.supports.ecosystems.length === 0) {
    errors.push("Integration must support at least one ecosystem.");
  }

  if (
    manifest.supports.packageManagers &&
    manifest.supports.packageManagers.length === 0
  ) {
    errors.push("Integration package manager support cannot be empty when provided.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateStackManifest(manifest: StackManifest): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest.id.trim()) {
    errors.push("Stack id is required.");
  }

  if (!manifest.name.trim()) {
    errors.push("Stack name is required.");
  }

  if (manifest.integrations.length === 0) {
    errors.push("Stack must include at least one integration.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function formatSupportGroupLabel(group: IntegrationSupportGroup): string {
  return group.framework ? `${group.ecosystem}/${group.framework}` : group.ecosystem;
}
