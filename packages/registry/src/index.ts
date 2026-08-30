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

export type RegistrySearchResultKind = "capability" | "integration" | "stack";

export interface RegistrySearchResult {
  kind: RegistrySearchResultKind;
  id: string;
  name: string;
  description?: string;
  score: number;
}

export interface StackManifest {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
  integrations?: string[];
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export class IntegrationRegistry {
  readonly capabilities: Capability[];
  readonly integrations: AvisIntegration[];
  readonly stacks: StackManifest[];

  constructor(options: {
    capabilities: Capability[];
    integrations: AvisIntegration[];
    stacks?: StackManifest[];
  }) {
    this.capabilities = [...options.capabilities];
    this.integrations = [...options.integrations];
    this.stacks = [...(options.stacks ?? [])];
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

  findStackById(id: string): StackManifest | undefined {
    return this.stacks.find((stack) => stack.id === id);
  }

  search(query: string): RegistrySearchResult[] {
    const normalizedQuery = normalizeIdentifier(query);
    if (!normalizedQuery) {
      return [];
    }

    const results: RegistrySearchResult[] = [
      ...this.capabilities.flatMap((capability) => {
        const score = scoreSearchCandidate(normalizedQuery, [
          capability.id,
          capability.name,
          capability.description,
          ...(capability.aliases ?? [])
        ]);

        return score > 0
          ? [
              {
                kind: "capability" as const,
                id: capability.id,
                name: capability.name,
                description: capability.description,
                score
              }
            ]
          : [];
      }),
      ...this.integrations.flatMap((integration) => {
        const score = scoreSearchCandidate(normalizedQuery, [
          integration.manifest.id,
          integration.manifest.name,
          integration.manifest.description,
          integration.manifest.capability,
          ...(integration.manifest.configures ?? []),
          ...(integration.manifest.dependencies?.map((dependency) => dependency.name) ?? [])
        ]);

        return score > 0
          ? [
              {
                kind: "integration" as const,
                id: integration.manifest.id,
                name: integration.manifest.name,
                description: integration.manifest.description,
                score
              }
            ]
          : [];
      }),
      ...this.stacks.flatMap((stack) => {
        const score = scoreSearchCandidate(normalizedQuery, [
          stack.id,
          stack.name,
          stack.description,
          ...(stack.capabilities ?? []),
          ...(stack.integrations ?? [])
        ]);

        return score > 0
          ? [
              {
                kind: "stack" as const,
                id: stack.id,
                name: stack.name,
                description: stack.description,
                score
              }
            ]
          : [];
      })
    ];

    return results.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
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

  resolveStack(
    stackId: string,
    context: ProjectContext
  ): { integrations: AvisIntegration[]; diagnostics: string[] } | undefined {
    const stack = this.findStackById(stackId);
    if (!stack) {
      return undefined;
    }

    const integrations: AvisIntegration[] = [];
    const diagnostics: string[] = [];
    const selectedIds = new Set<string>();

    for (const capabilityId of stack.capabilities ?? []) {
      const recommendations = this.recommendIntegrationsForCapability(
        capabilityId,
        context
      );
      const recommended = recommendations[0]?.integration;
      if (!recommended) {
        diagnostics.push(`No compatible integration found for capability ${capabilityId}.`);
        continue;
      }

      if (!selectedIds.has(recommended.manifest.id)) {
        integrations.push(recommended);
        selectedIds.add(recommended.manifest.id);
      }
    }

    for (const integrationId of stack.integrations ?? []) {
      const integration = this.findIntegrationById(integrationId);
      if (!integration) {
        diagnostics.push(`Unknown integration ${integrationId}.`);
        continue;
      }

      const compatibility = integration.isCompatible(context);
      if (!compatibility.supported) {
        diagnostics.push(compatibility.reason);
        continue;
      }

      if (!selectedIds.has(integration.manifest.id)) {
        integrations.push(integration);
        selectedIds.add(integration.manifest.id);
      }
    }

    diagnostics.push(...this.detectIntegrationConflicts(integrations));

    return { integrations, diagnostics };
  }

  detectIntegrationConflicts(integrations: AvisIntegration[]): string[] {
    const diagnostics: string[] = [];
    const integrationsByCapability = new Map<string, AvisIntegration[]>();

    for (const integration of integrations) {
      const group = integrationsByCapability.get(integration.manifest.capability) ?? [];
      group.push(integration);
      integrationsByCapability.set(integration.manifest.capability, group);
    }

    for (const [capabilityId, group] of integrationsByCapability) {
      const capability = this.findCapabilityByQuery(capabilityId);
      if (!capability?.exclusive || group.length < 2) {
        continue;
      }

      diagnostics.push(
        `Capability ${capability.id} is exclusive, but stack selects ${group
          .map((integration) => integration.manifest.id)
          .join(", ")}.`
      );
    }

    return diagnostics;
  }

  async findInstalledCapabilityConflicts(
    selectedIntegration: AvisIntegration,
    context: ProjectContext
  ): Promise<string[]> {
    const capability = this.findCapabilityByQuery(selectedIntegration.manifest.capability);
    if (!capability?.exclusive) {
      return [];
    }

    const alternatives = this.findCompatibleIntegrationsForCapability(
      capability.id,
      context
    ).filter(
      (integration) =>
        integration.manifest.id !== selectedIntegration.manifest.id && integration.verify
    );
    const conflicts: string[] = [];

    for (const integration of alternatives) {
      const verification = await integration.verify?.(context);
      if (!verification || verification.health === "not-installed") {
        continue;
      }

      conflicts.push(
        `Detected existing ${capability.id} integration ${integration.manifest.id} with health ${verification.health}. Adding ${selectedIntegration.manifest.id} may duplicate project architecture.`
      );
    }

    return conflicts;
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
    `${formatStatusLabel(integration.manifest.status)} integration`,
    `${formatTrustLabel(integration.manifest.trust)} trust`
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

function formatTrustLabel(trust: AvisIntegrationManifest["trust"]): string {
  switch (trust) {
    case "official":
      return "official";
    case "verified":
      return "verified";
    case "community":
      return "community";
    case "experimental":
      return "experimental";
  }
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-").replace(/\s+/g, "-");
}

function scoreSearchCandidate(
  normalizedQuery: string,
  values: Array<string | undefined>
): number {
  let score = 0;
  const queryTokens = tokenizeIdentifier(normalizedQuery);

  for (const value of values) {
    if (!value) {
      continue;
    }

    const normalizedValue = normalizeIdentifier(value);
    const valueTokens = tokenizeIdentifier(normalizedValue);
    if (normalizedValue === normalizedQuery) {
      score = Math.max(score, 100);
    } else if (normalizedValue.startsWith(normalizedQuery)) {
      score = Math.max(score, 75);
    } else if (normalizedValue.includes(normalizedQuery)) {
      score = Math.max(score, 50);
    } else if (
      queryTokens.length > 1 &&
      queryTokens.every((queryToken) =>
        valueTokens.some((valueToken) => tokensMatch(queryToken, valueToken))
      )
    ) {
      score = Math.max(score, 35);
    }
  }

  return score;
}

function tokenizeIdentifier(value: string): string[] {
  return normalizeIdentifier(value).split("-").filter(Boolean);
}

function tokensMatch(queryToken: string, valueToken: string): boolean {
  return (
    queryToken === valueToken ||
    queryToken.startsWith(valueToken) ||
    valueToken.startsWith(queryToken)
  );
}

export function createIntegrationRegistry(options: {
  capabilities: Capability[];
  integrations: AvisIntegration[];
  stacks?: StackManifest[];
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

  if (!["official", "verified", "community", "experimental"].includes(manifest.trust)) {
    errors.push("Integration trust level is invalid.");
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

  if (
    (manifest.integrations?.length ?? 0) === 0 &&
    (manifest.capabilities?.length ?? 0) === 0
  ) {
    errors.push("Stack must include at least one integration or capability.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function formatSupportGroupLabel(group: IntegrationSupportGroup): string {
  return group.framework ? `${group.ecosystem}/${group.framework}` : group.ecosystem;
}
