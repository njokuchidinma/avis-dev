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
