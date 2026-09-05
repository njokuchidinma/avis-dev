import {
  mkdir,
  readFile,
  realpath,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { resolveInsideRoot } from "../filesystem/paths.js";
import type {
  AvisIntegration,
  AvisIntegrationManifest,
  CompatibilityResult
} from "../integrations/types.js";
import type { ChangePlan } from "../planning/change-plan.js";
import type { Operation } from "../planning/operations.js";
import type { Diagnostic } from "../types/common.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type {
  LocalIntegrationPlanTemplate,
  LocalIntegrationRegistryFile,
  LocalIntegrationVerifyTemplate
} from "./types.js";

export const localIntegrationRegistryPath = ".avis/integrations.json";
export const localIntegrationManifestFile = "avis.integration.json";
export const localIntegrationPlanFile = "plan.json";
export const localIntegrationVerifyFile = "verify.json";

export interface LoadLocalIntegrationsResult {
  integrations: AvisIntegration[];
  diagnostics: Diagnostic[];
}

export async function readLocalIntegrationRegistry(
  projectRoot: string
): Promise<LocalIntegrationRegistryFile> {
  try {
    const contents = await readFile(
      resolveInsideRoot(projectRoot, localIntegrationRegistryPath),
      "utf8"
    );
    return normalizeLocalIntegrationRegistry(JSON.parse(contents) as unknown);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return {
        schemaVersion: 1,
        integrations: []
      };
    }

    throw error;
  }
}

export async function registerLocalIntegration(
  projectRoot: string,
  integrationPath: string,
  addedAt = new Date().toISOString()
): Promise<LocalIntegrationRegistryFile> {
  const localRoot = await resolveLocalIntegrationRoot(projectRoot, integrationPath);
  await readLocalIntegrationManifest(localRoot);
  await readLocalIntegrationPlan(localRoot);

  const registry = await readLocalIntegrationRegistry(projectRoot);
  const relativePath = path.relative(await realpath(projectRoot), localRoot);
  const existing = registry.integrations.find((entry) => entry.path === relativePath);

  if (!existing) {
    registry.integrations.push({
      path: relativePath,
      addedAt
    });
    registry.integrations.sort((left, right) => left.path.localeCompare(right.path));
  }

  await writeLocalIntegrationRegistry(projectRoot, registry);
  return registry;
}

export async function loadLocalIntegrations(
  projectRoot: string
): Promise<LoadLocalIntegrationsResult> {
  const registry = await readLocalIntegrationRegistry(projectRoot);
  const integrations: AvisIntegration[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const entry of registry.integrations) {
    try {
      const localRoot = await resolveLocalIntegrationRoot(projectRoot, entry.path);
      integrations.push(await loadLocalIntegration(localRoot));
    } catch (error) {
      diagnostics.push({
        severity: "warning",
        message: `Skipped local integration ${entry.path}: ${formatError(error)}`
      });
    }
  }

  return { integrations, diagnostics };
}

export async function loadLocalIntegration(
  integrationRoot: string
): Promise<AvisIntegration> {
  const manifest = await readLocalIntegrationManifest(integrationRoot);

  return {
    manifest,
    isCompatible: (context) => isLocalIntegrationCompatible(manifest, context),
    plan: async ({ context }): Promise<ChangePlan> => {
      const compatibility = isLocalIntegrationCompatible(manifest, context);
      if (!compatibility.supported) {
        return {
          id: manifest.id,
          title: `Add ${manifest.name}`,
          integrationId: manifest.id,
          target: context,
          operations: [],
          diagnostics: [
            {
              severity: "error",
              message: compatibility.reason
            }
          ]
        };
      }

      const template = await readLocalIntegrationPlan(integrationRoot);
      return {
        id: manifest.id,
        title: template.title ?? `Add ${manifest.name}`,
        integrationId: manifest.id,
        target: context,
        operations: template.operations,
        diagnostics: []
      };
    },
    verify: async (): Promise<VerificationResult> => {
      const template = await readLocalIntegrationVerify(integrationRoot);

      return {
        integrationId: manifest.id,
        health: template.health,
        checks: template.checks,
        diagnostics: []
      };
    }
  };
}

async function writeLocalIntegrationRegistry(
  projectRoot: string,
  registry: LocalIntegrationRegistryFile
): Promise<void> {
  const absolutePath = resolveInsideRoot(projectRoot, localIntegrationRegistryPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function resolveLocalIntegrationRoot(
  projectRoot: string,
  integrationPath: string
): Promise<string> {
  const projectRealPath = await realpath(projectRoot);
  const localPath = path.extname(integrationPath)
    ? path.dirname(integrationPath)
    : integrationPath;
  const candidate = resolveInsideRoot(projectRealPath, localPath);
  const candidateRealPath = await realpath(candidate);
  const relativeToProject = path.relative(projectRealPath, candidateRealPath);

  if (
    relativeToProject === ".." ||
    relativeToProject.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToProject)
  ) {
    throw new Error("Local integrations must live inside the project root.");
  }

  const stats = await stat(candidateRealPath);
  if (!stats.isDirectory()) {
    throw new Error("Local integration path must be a directory.");
  }

  return candidateRealPath;
}

async function readLocalIntegrationManifest(
  integrationRoot: string
): Promise<AvisIntegrationManifest> {
  const manifestPath = path.join(integrationRoot, localIntegrationManifestFile);
  const parsed = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  const manifest = parseLocalIntegrationManifest(parsed);

  return {
    ...manifest,
    trust: "local",
    source: {
      ...manifest.source,
      owner: "local",
      path: integrationRoot
    }
  };
}

async function readLocalIntegrationPlan(
  integrationRoot: string
): Promise<LocalIntegrationPlanTemplate> {
  const parsed = JSON.parse(
    await readFile(path.join(integrationRoot, localIntegrationPlanFile), "utf8")
  ) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("plan.json must contain an object.");
  }

  const operations = parsed.operations;
  if (!Array.isArray(operations) || !operations.every(isOperation)) {
    throw new Error("plan.json must contain an operations array.");
  }

  return {
    title: typeof parsed.title === "string" ? parsed.title : undefined,
    operations
  };
}

async function readLocalIntegrationVerify(
  integrationRoot: string
): Promise<LocalIntegrationVerifyTemplate> {
  try {
    const parsed = JSON.parse(
      await readFile(path.join(integrationRoot, localIntegrationVerifyFile), "utf8")
    ) as unknown;

    if (!isRecord(parsed) || !isIntegrationHealth(parsed.health)) {
      throw new Error("verify.json must include a valid health value.");
    }

    if (!Array.isArray(parsed.checks) || !parsed.checks.every(isVerificationCheck)) {
      throw new Error("verify.json must contain a checks array.");
    }

    return {
      health: parsed.health,
      checks: parsed.checks
    };
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }

    return {
      health: "unknown",
      checks: [
        {
          id: "local-integration-verification",
          label: "local integration verification",
          status: "skipped",
          message: "No verify.json was provided by this local integration."
        }
      ]
    };
  }
}

function parseLocalIntegrationManifest(value: unknown): AvisIntegrationManifest {
  if (!isRecord(value)) {
    throw new Error("avis.integration.json must contain an object.");
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.description) ||
    !isNonEmptyString(value.capability) ||
    !isNonEmptyString(value.version)
  ) {
    throw new Error("avis.integration.json is missing required manifest fields.");
  }

  if (!isIntegrationStatus(value.status)) {
    throw new Error("avis.integration.json has an invalid status.");
  }

  if (!isIntegrationSupport(value.supports)) {
    throw new Error("avis.integration.json has invalid support metadata.");
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    capability: value.capability,
    version: value.version,
    status: value.status,
    trust: "local",
    supports: value.supports,
    dependencies: isDependencyRequirements(value.dependencies)
      ? value.dependencies
      : undefined,
    configurationOptions: isConfigurationOptions(value.configurationOptions)
      ? value.configurationOptions
      : undefined,
    configures: isStringArray(value.configures) ? value.configures : undefined,
    repair: value.repair === "plan" || value.repair === "unsupported"
      ? value.repair
      : undefined,
    documentation: isDocumentation(value.documentation)
      ? value.documentation
      : undefined,
    source: isSource(value.source) ? value.source : undefined
  };
}

function isLocalIntegrationCompatible(
  manifest: AvisIntegrationManifest,
  context: ProjectContext
): CompatibilityResult {
  if (!manifest.supports.ecosystems.includes(context.ecosystem)) {
    return {
      supported: false,
      reason: `${manifest.name} does not support ${context.ecosystem} projects.`
    };
  }

  const supportedFrameworks = manifest.supports.frameworks;
  if (supportedFrameworks && supportedFrameworks.length > 0) {
    const contextFrameworks = context.frameworks ?? (context.framework ? [context.framework] : []);
    if (!contextFrameworks.some((framework) => supportedFrameworks.includes(framework.id))) {
      return {
        supported: false,
        reason: `${manifest.name} does not support the detected framework.`
      };
    }
  }

  const supportedPackageManagers = manifest.supports.packageManagers;
  if (supportedPackageManagers && supportedPackageManagers.length > 0) {
    const contextPackageManagers =
      context.packageManagers ?? (context.packageManager ? [context.packageManager] : []);
    if (
      !contextPackageManagers.some((packageManager) =>
        supportedPackageManagers.includes(packageManager.id)
      )
    ) {
      return {
        supported: false,
        reason: `${manifest.name} does not support the detected package manager.`
      };
    }
  }

  return { supported: true };
}

function normalizeLocalIntegrationRegistry(
  value: unknown
): LocalIntegrationRegistryFile {
  if (!isRecord(value) || !Array.isArray(value.integrations)) {
    return {
      schemaVersion: 1,
      integrations: []
    };
  }

  return {
    schemaVersion: 1,
    integrations: value.integrations
      .filter(isLocalIntegrationRegistration)
      .map((entry) => ({
        path: entry.path,
        addedAt: entry.addedAt
      }))
  };
}

function isLocalIntegrationRegistration(
  value: unknown
): value is { path: string; addedAt: string } {
  return (
    isRecord(value) &&
    isNonEmptyString(value.path) &&
    isNonEmptyString(value.addedAt)
  );
}

function isIntegrationSupport(value: unknown): value is AvisIntegrationManifest["supports"] {
  return (
    isRecord(value) &&
    isStringArray(value.ecosystems) &&
    value.ecosystems.length > 0 &&
    (value.frameworks === undefined || isStringArray(value.frameworks)) &&
    (value.packageManagers === undefined || isStringArray(value.packageManagers))
  );
}

function isDependencyRequirements(
  value: unknown
): value is NonNullable<AvisIntegrationManifest["dependencies"]> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        isNonEmptyString(entry.name) &&
        (entry.type === "runtime" || entry.type === "development") &&
        (entry.optional === undefined || typeof entry.optional === "boolean")
    )
  );
}

function isConfigurationOptions(
  value: unknown
): value is NonNullable<AvisIntegrationManifest["configurationOptions"]> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        isNonEmptyString(entry.id) &&
        isNonEmptyString(entry.label) &&
        (entry.description === undefined || typeof entry.description === "string") &&
        (entry.required === undefined || typeof entry.required === "boolean") &&
        (entry.defaultValue === undefined ||
          typeof entry.defaultValue === "string" ||
          typeof entry.defaultValue === "number" ||
          typeof entry.defaultValue === "boolean")
    )
  );
}

function isDocumentation(
  value: unknown
): value is NonNullable<AvisIntegrationManifest["documentation"]> {
  return (
    value === undefined ||
    (isRecord(value) &&
      (value.homepage === undefined || typeof value.homepage === "string") &&
      (value.quickstart === undefined || typeof value.quickstart === "string"))
  );
}

function isSource(value: unknown): value is NonNullable<AvisIntegrationManifest["source"]> {
  return (
    value === undefined ||
    (isRecord(value) &&
      (value.owner === "avis" || value.owner === "community" || value.owner === "local") &&
      (value.repository === undefined || typeof value.repository === "string") &&
      (value.path === undefined || typeof value.path === "string"))
  );
}

function isOperation(value: unknown): value is Operation {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.description)) {
    return false;
  }

  switch (value.type) {
    case "dependency.add":
      return (
        Array.isArray(value.packages) &&
        value.packages.every(isDependencySpec) &&
        isDependencyType(value.dependencyType) &&
        (value.packageManager === undefined || typeof value.packageManager === "string")
      );
    case "dependency.remove":
      return (
        isStringArray(value.packages) &&
        (value.packageManager === undefined || typeof value.packageManager === "string")
      );
    case "file.create":
      return (
        isNonEmptyString(value.path) &&
        typeof value.contents === "string" &&
        (value.overwrite === "never" || value.overwrite === "if-identical")
      );
    case "json.merge":
      return isNonEmptyString(value.path) && isRecord(value.value);
    case "text.patch":
      return (
        isNonEmptyString(value.path) &&
        typeof value.search === "string" &&
        typeof value.replace === "string"
      );
    case "env.ensure":
      return isNonEmptyString(value.path) && isStringRecord(value.variables);
    default:
      return false;
  }
}

function isDependencySpec(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.name) &&
    (value.version === undefined || typeof value.version === "string") &&
    (value.features === undefined || isStringArray(value.features))
  );
}

function isVerificationCheck(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    (value.status === "pass" ||
      value.status === "warning" ||
      value.status === "fail" ||
      value.status === "skipped") &&
    (value.message === undefined || typeof value.message === "string") &&
    (value.remediation === undefined || typeof value.remediation === "string")
  );
}

function isIntegrationStatus(value: unknown): value is AvisIntegrationManifest["status"] {
  return value === "experimental" || value === "stable" || value === "deprecated";
}

function isIntegrationHealth(value: unknown): value is VerificationResult["health"] {
  return (
    value === "not-installed" ||
    value === "healthy" ||
    value === "partial" ||
    value === "broken" ||
    value === "unknown"
  );
}

function isDependencyType(value: unknown): boolean {
  return value === "runtime" || value === "development" || value === "optional";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
