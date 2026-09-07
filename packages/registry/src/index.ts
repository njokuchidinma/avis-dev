import type {
  AvisIntegrationManifest,
  AvisIntegration,
  Capability,
  CapabilityId,
  EcosystemId,
  FrameworkDefinition,
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

export interface NativeCapabilitySupport {
  capability: Capability;
  framework: FrameworkId;
  description: string;
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

export interface RegistryCatalogValidationOptions {
  capabilities: Capability[];
  integrations: AvisIntegration[];
  knownEcosystemIds?: readonly string[];
  knownFrameworkIds?: readonly string[];
  knownPackageManagerIds?: readonly string[];
  knownProjectTypeIds?: readonly string[];
  detectableFrameworkIds?: readonly string[];
  frameworkDefinitions?: readonly FrameworkDefinition[];
  managedIntegrationFixtureIds?: readonly string[];
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

  findAvailableCapabilities(context: ProjectContext): Capability[] {
    return this.capabilities.filter((capability) => {
      return this.findCompatibleIntegrationsForCapability(
        capability.id,
        context
      ).length > 0;
    });
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
    const defaultRecommendation = capability
      ? resolveDefaultIntegrationId(capability, context)
      : undefined;

    return integrations
      .map((integration) => ({
        integration,
        recommended: integration.manifest.id === defaultRecommendation?.integrationId,
        reasons: getRecommendationReasons(integration, context, defaultRecommendation)
      }))
      .sort(compareRecommendations);
  }

  findNativeCapabilitySupport(
    capabilityId: string,
    context: ProjectContext
  ): NativeCapabilitySupport | undefined {
    const capability = this.findCapabilityByQuery(capabilityId);
    if (!capability) {
      return undefined;
    }

    const frameworks = context.frameworks ?? (context.framework ? [context.framework] : []);
    for (const framework of frameworks) {
      const description = capability.nativeFrameworkSupport?.[framework.id];
      if (description) {
        return {
          capability,
          framework: framework.id,
          description
        };
      }
    }

    return undefined;
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
  defaultRecommendation: DefaultIntegrationResolution | undefined
): string[] {
  const reasons = [
    `compatible with ${context.framework?.id ?? context.ecosystem}`,
    `${formatStatusLabel(integration.manifest.status)} integration`,
    `${formatTrustLabel(integration.manifest.trust)} trust`,
    `${formatSetupMaturityLabel(integration.manifest.setupMaturity)} setup maturity`
  ];

  if (integration.manifest.id === defaultRecommendation?.integrationId) {
    reasons.unshift(`default recommendation for this ${defaultRecommendation.scope}`);
  }

  if (integration.manifest.source?.owner === "avis") {
    reasons.push("maintained by Avis");
  }

  if (integration.manifest.dependencies && integration.manifest.dependencies.length > 0) {
    reasons.push("adds a native project dependency");
  }

  return reasons;
}

interface DefaultIntegrationResolution {
  integrationId: string;
  scope: "framework" | "project type" | "ecosystem";
}

function resolveDefaultIntegrationId(
  capability: Capability,
  context: ProjectContext
): DefaultIntegrationResolution | undefined {
  const frameworks = context.frameworks ?? (context.framework ? [context.framework] : []);
  for (const framework of frameworks) {
    const integrationId = capability.defaultFrameworkIntegrations?.[framework.id];
    if (integrationId) {
      return {
        integrationId,
        scope: "framework"
      };
    }
  }

  const projectTypes = context.projectTypes ?? (context.projectType ? [context.projectType] : []);
  for (const projectType of projectTypes) {
    const integrationId = capability.defaultProjectTypeIntegrations?.[projectType.id];
    if (integrationId) {
      return {
        integrationId,
        scope: "project type"
      };
    }
  }

  const integrationId = capability.defaultIntegrations?.[context.ecosystem];
  return integrationId
    ? {
        integrationId,
        scope: "ecosystem"
      }
    : undefined;
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
    case "local":
      return "local";
    case "experimental":
      return "experimental";
  }
}

function formatSetupMaturityLabel(
  maturity: AvisIntegrationManifest["setupMaturity"]
): string {
  switch (maturity) {
    case "install":
      return "install";
    case "configure":
      return "configure";
    case "managed":
      return "managed";
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
    (queryToken.length >= 4 &&
      valueToken.length >= 4 &&
      (queryToken.startsWith(valueToken) || valueToken.startsWith(queryToken)))
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

  if (!["official", "verified", "community", "local", "experimental"].includes(manifest.trust)) {
    errors.push("Integration trust level is invalid.");
  }

  if (!["install", "configure", "managed"].includes(manifest.setupMaturity)) {
    errors.push("Integration setup maturity is invalid.");
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

export function validateRegistryCatalog(
  options: RegistryCatalogValidationOptions
): ManifestValidationResult {
  const errors: string[] = [];
  const capabilityIds = new Set(options.capabilities.map((capability) => capability.id));
  const integrationIds = new Set(
    options.integrations.map((integration) => integration.manifest.id)
  );
  const knownEcosystemIds = options.knownEcosystemIds
    ? new Set(options.knownEcosystemIds)
    : undefined;
  const knownFrameworkIds = options.knownFrameworkIds
    ? new Set(options.knownFrameworkIds)
    : undefined;
  const knownPackageManagerIds = options.knownPackageManagerIds
    ? new Set(options.knownPackageManagerIds)
    : undefined;
  const knownProjectTypeIds = options.knownProjectTypeIds
    ? new Set(options.knownProjectTypeIds)
    : undefined;
  const frameworkDefinitionsById = options.frameworkDefinitions
    ? new Map(options.frameworkDefinitions.map((framework) => [framework.id, framework]))
    : undefined;
  const managedIntegrationFixtureIds = options.managedIntegrationFixtureIds
    ? new Set(options.managedIntegrationFixtureIds)
    : undefined;

  if (options.frameworkDefinitions) {
    const seenFrameworkIds = new Set<string>();

    for (const framework of options.frameworkDefinitions) {
      if (seenFrameworkIds.has(framework.id)) {
        errors.push(`Framework catalog contains duplicate framework ${framework.id}.`);
      }
      seenFrameworkIds.add(framework.id);

      if (knownFrameworkIds && !knownFrameworkIds.has(framework.id)) {
        errors.push(`Framework catalog defines unknown framework ${framework.id}.`);
      }

      if (knownEcosystemIds && !knownEcosystemIds.has(framework.ecosystem)) {
        errors.push(
          `Framework ${framework.id} references unknown ecosystem ${framework.ecosystem}.`
        );
      }

      if (
        knownProjectTypeIds &&
        !knownProjectTypeIds.has(framework.defaultProjectType)
      ) {
        errors.push(
          `Framework ${framework.id} references unknown project type ${framework.defaultProjectType}.`
        );
      }

      for (const capabilityId of framework.relevantCapabilities) {
        if (!capabilityIds.has(capabilityId)) {
          errors.push(
            `Framework ${framework.id} references unknown capability ${capabilityId}.`
          );
        }
      }
    }
  }

  for (const capability of options.capabilities) {
    for (const [ecosystem, integrationId] of Object.entries(capability.defaultIntegrations ?? {})) {
      if (knownEcosystemIds && !knownEcosystemIds.has(ecosystem)) {
        errors.push(`Capability ${capability.id} has unknown default ecosystem ${ecosystem}.`);
      }

      if (!integrationId) {
        continue;
      }

      if (!integrationIds.has(integrationId)) {
        errors.push(
          `Capability ${capability.id} defaults to unknown integration ${integrationId}.`
        );
        continue;
      }

      const integration = options.integrations.find(
        (candidate) => candidate.manifest.id === integrationId
      );
      if (integration?.manifest.capability !== capability.id) {
        errors.push(
          `Capability ${capability.id} defaults to ${integrationId}, but that integration provides ${integration?.manifest.capability ?? "unknown"}.`
        );
      }

      if (!integration?.manifest.supports.ecosystems.includes(ecosystem)) {
        errors.push(
          `Capability ${capability.id} defaults to ${integrationId}, but it does not support ${ecosystem}.`
        );
      }
    }

    for (const [framework, integrationId] of Object.entries(
      capability.defaultFrameworkIntegrations ?? {}
    )) {
      if (knownFrameworkIds && !knownFrameworkIds.has(framework)) {
        errors.push(`Capability ${capability.id} has unknown default framework ${framework}.`);
      }

      if (!integrationId) {
        continue;
      }

      const integration = options.integrations.find(
        (candidate) => candidate.manifest.id === integrationId
      );
      if (!integration) {
        errors.push(
          `Capability ${capability.id} defaults to unknown integration ${integrationId} for framework ${framework}.`
        );
        continue;
      }

      if (integration.manifest.capability !== capability.id) {
        errors.push(
          `Capability ${capability.id} defaults to ${integrationId} for framework ${framework}, but that integration provides ${integration.manifest.capability}.`
        );
      }

      if (
        integration.manifest.supports.frameworks &&
        !integration.manifest.supports.frameworks.includes(framework)
      ) {
        errors.push(
          `Capability ${capability.id} defaults to ${integrationId}, but it does not support framework ${framework}.`
        );
      }

      const frameworkDefinition = frameworkDefinitionsById?.get(framework);
      if (
        frameworkDefinition &&
        !integration.manifest.supports.ecosystems.includes(frameworkDefinition.ecosystem)
      ) {
        errors.push(
          `Capability ${capability.id} defaults to ${integrationId} for framework ${framework}, but that integration does not support ${frameworkDefinition.ecosystem}.`
        );
      }
    }

    for (const [projectType, integrationId] of Object.entries(
      capability.defaultProjectTypeIntegrations ?? {}
    )) {
      if (knownProjectTypeIds && !knownProjectTypeIds.has(projectType)) {
        errors.push(`Capability ${capability.id} has unknown default project type ${projectType}.`);
      }

      if (!integrationId) {
        continue;
      }

      const integration = options.integrations.find(
        (candidate) => candidate.manifest.id === integrationId
      );
      if (!integration) {
        errors.push(
          `Capability ${capability.id} defaults to unknown integration ${integrationId} for project type ${projectType}.`
        );
        continue;
      }

      if (integration.manifest.capability !== capability.id) {
        errors.push(
          `Capability ${capability.id} defaults to ${integrationId} for project type ${projectType}, but that integration provides ${integration.manifest.capability}.`
        );
      }
    }

    if (knownFrameworkIds) {
      for (const framework of Object.keys(capability.nativeFrameworkSupport ?? {})) {
        if (!knownFrameworkIds.has(framework)) {
          errors.push(`Capability ${capability.id} has unknown native framework ${framework}.`);
        }
      }
    }
  }

  for (const integration of options.integrations) {
    const manifestValidation = validateIntegrationManifest(integration.manifest);
    errors.push(
      ...manifestValidation.errors.map(
        (error) => `${integration.manifest.id || "unknown integration"}: ${error}`
      )
    );

    if (!capabilityIds.has(integration.manifest.capability)) {
      errors.push(
        `Integration ${integration.manifest.id} references unknown capability ${integration.manifest.capability}.`
      );
    }

    if (integration.manifest.setupMaturity === "managed") {
      if (!integration.verify) {
        errors.push(
          `Integration ${integration.manifest.id} is managed but does not expose a verifier.`
        );
      }

      if (integration.manifest.repair !== "plan") {
        errors.push(
          `Integration ${integration.manifest.id} is managed but does not declare repair plan support.`
        );
      }

      if (
        !integration.manifest.configures?.some(
          (configuredItem) => configuredItem !== "runtime dependency"
        )
      ) {
        errors.push(
          `Integration ${integration.manifest.id} is managed but does not declare non-dependency configuration behavior.`
        );
      }

      if (
        managedIntegrationFixtureIds &&
        !managedIntegrationFixtureIds.has(integration.manifest.id)
      ) {
        errors.push(
          `Integration ${integration.manifest.id} is managed but is missing release fixture coverage.`
        );
      }
    }

    if (knownEcosystemIds) {
      for (const ecosystem of integration.manifest.supports.ecosystems) {
        if (!knownEcosystemIds.has(ecosystem)) {
          errors.push(
            `Integration ${integration.manifest.id} supports unknown ecosystem ${ecosystem}.`
          );
        }
      }
    }

    if (knownFrameworkIds) {
      for (const framework of integration.manifest.supports.frameworks ?? []) {
        if (!knownFrameworkIds.has(framework)) {
          errors.push(
            `Integration ${integration.manifest.id} supports unknown framework ${framework}.`
          );
        }
      }
    }

    if (knownPackageManagerIds) {
      for (const packageManager of integration.manifest.supports.packageManagers ?? []) {
        if (!knownPackageManagerIds.has(packageManager)) {
          errors.push(
            `Integration ${integration.manifest.id} supports unknown package manager ${packageManager}.`
          );
        }
      }
    }
  }

  if (options.detectableFrameworkIds && knownFrameworkIds) {
    for (const framework of options.detectableFrameworkIds) {
      if (!knownFrameworkIds.has(framework)) {
        errors.push(`Detectable framework ${framework} is missing from the framework catalog.`);
      }

      if (frameworkDefinitionsById && !frameworkDefinitionsById.has(framework)) {
        errors.push(`Detectable framework ${framework} is missing from the framework catalog.`);
      }
    }
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
