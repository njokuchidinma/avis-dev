import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  realpath,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { resolveInsideRoot } from "../filesystem/paths.js";
import type { AvisIntegrationManifest } from "../integrations/types.js";
import type { Operation } from "../planning/operations.js";
import { validateChangePlan } from "../planning/validation.js";
import type { ProjectContext } from "../types/project-context.js";
import {
  localIntegrationManifestFile,
  localIntegrationPlanFile,
  localIntegrationRegistryPath,
  localIntegrationVerifyFile,
  registerLocalIntegration
} from "./local.js";
import type {
  LocalIntegrationPlanTemplate,
  PackagedIntegration,
  PackagedIntegrationFile,
  PublishReviewFinding,
  PublishSecurityReview
} from "./types.js";

export const packagedIntegrationFormat = "avis.integration.package.v1" as const;
export const packagedIntegrationExtension = ".avis-integration.json";
export const installedPackagedIntegrationsRoot = ".avis/packaged-integrations";

export interface PackageLocalIntegrationOptions {
  outputPath?: string;
  packagedAt?: string;
}

export interface PackageLocalIntegrationResult {
  packagePath: string;
  packagedIntegration: PackagedIntegration;
}

export async function packageLocalIntegration(
  projectRoot: string,
  integrationPath: string,
  options: PackageLocalIntegrationOptions = {}
): Promise<PackageLocalIntegrationResult> {
  const integrationRoot = await resolveIntegrationRoot(projectRoot, integrationPath);
  const packageCandidate = await createPackagedIntegration(
    integrationRoot,
    options.packagedAt ?? new Date().toISOString()
  );

  if (!packageCandidate.securityReview.passed) {
    throw new Error("Integration package failed security review.");
  }

  const outputPath =
    options.outputPath ??
    `.avis/packages/${packageCandidate.manifest.id}-${packageCandidate.manifest.version}${packagedIntegrationExtension}`;
  const absoluteOutputPath = resolveInsideRoot(projectRoot, outputPath);
  await mkdir(path.dirname(absoluteOutputPath), { recursive: true });
  await writeFile(
    absoluteOutputPath,
    `${JSON.stringify(packageCandidate, null, 2)}\n`,
    "utf8"
  );

  return {
    packagePath: outputPath,
    packagedIntegration: packageCandidate
  };
}

export async function inspectPackagedIntegration(
  projectRoot: string,
  packagePath: string
): Promise<PackagedIntegration> {
  const packageCandidate = await readPackagedIntegration(projectRoot, packagePath);
  const expectedDigest = createPackageDigest(packageCandidate);
  const integrityFindings = getFileIntegrityFindings(packageCandidate);

  if (
    packageCandidate.integrity.digest !== expectedDigest ||
    integrityFindings.length > 0
  ) {
    return {
      ...packageCandidate,
      securityReview: {
        passed: false,
        findings: [
          ...packageCandidate.securityReview.findings,
          ...integrityFindings,
          {
            severity: "error",
            message: "Package integrity digest does not match package contents."
          }
        ]
      }
    };
  }

  return packageCandidate;
}

export async function installPackagedIntegration(
  projectRoot: string,
  packagePath: string
): Promise<string> {
  const packageCandidate = await inspectPackagedIntegration(projectRoot, packagePath);
  if (!packageCandidate.securityReview.passed) {
    throw new Error("Refusing to install a package that failed security review.");
  }

  const installPath = `${installedPackagedIntegrationsRoot}/${packageCandidate.manifest.id}`;
  const absoluteInstallPath = resolveInsideRoot(projectRoot, installPath);
  await mkdir(absoluteInstallPath, { recursive: true });
  await writeFile(
    path.join(absoluteInstallPath, localIntegrationManifestFile),
    packageCandidate.files.manifest.contents,
    "utf8"
  );
  await writeFile(
    path.join(absoluteInstallPath, localIntegrationPlanFile),
    packageCandidate.files.plan.contents,
    "utf8"
  );

  if (packageCandidate.files.verify) {
    await writeFile(
      path.join(absoluteInstallPath, localIntegrationVerifyFile),
      packageCandidate.files.verify.contents,
      "utf8"
    );
  }

  await registerLocalIntegration(projectRoot, installPath);
  return installPath;
}

async function createPackagedIntegration(
  integrationRoot: string,
  packagedAt: string
): Promise<PackagedIntegration> {
  const manifestFile = await readPackageFile(
    integrationRoot,
    localIntegrationManifestFile
  );
  const planFile = await readPackageFile(integrationRoot, localIntegrationPlanFile);
  const verifyFile = await readOptionalPackageFile(
    integrationRoot,
    localIntegrationVerifyFile
  );
  const manifest = parseManifest(manifestFile.contents);
  const plan = parsePlan(planFile.contents);
  const securityReview = reviewIntegrationForPublishing(manifest, plan, verifyFile);
  const packagedManifest: AvisIntegrationManifest = {
    ...manifest,
    trust: "community",
    source: {
      ...manifest.source,
      owner: "community"
    }
  };
  const packageWithoutIntegrity = {
    format: packagedIntegrationFormat,
    manifest: packagedManifest,
    files: {
      manifest: manifestFile,
      plan: planFile,
      ...(verifyFile ? { verify: verifyFile } : {})
    },
    integrity: {
      algorithm: "sha256" as const,
      digest: ""
    },
    securityReview,
    packagedAt
  };

  return {
    ...packageWithoutIntegrity,
    integrity: {
      algorithm: "sha256",
      digest: createPackageDigest(packageWithoutIntegrity)
    }
  };
}

function reviewIntegrationForPublishing(
  manifest: AvisIntegrationManifest,
  plan: LocalIntegrationPlanTemplate,
  verifyFile: PackagedIntegrationFile | undefined
): PublishSecurityReview {
  const findings: PublishReviewFinding[] = [];
  const validation = validateChangePlan({
    id: manifest.id,
    title: `Review ${manifest.name}`,
    integrationId: manifest.id,
    target: createReviewContext(),
    operations: plan.operations,
    diagnostics: []
  });

  for (const diagnostic of validation.diagnostics) {
    findings.push({
      severity: diagnostic.severity === "error" ? "error" : "warning",
      message: diagnostic.message
    });
  }

  if (manifest.trust === "official" || manifest.trust === "verified") {
    findings.push({
      severity: "warning",
      message: "Publishing will ignore self-claimed official or verified trust."
    });
  }

  if (!verifyFile) {
    findings.push({
      severity: "warning",
      message: "No verify.json was included; reviewers cannot validate health checks."
    });
  }

  for (const operation of plan.operations) {
    findings.push(...reviewOperation(operation));
  }

  return {
    passed: findings.every((finding) => finding.severity !== "error"),
    findings
  };
}

function reviewOperation(operation: Operation): PublishReviewFinding[] {
  switch (operation.type) {
    case "dependency.add":
      return [
        {
          severity: "info",
          message: `Adds dependencies: ${operation.packages
            .map((packageSpec) => packageSpec.name)
            .join(", ")}.`
        }
      ];
    case "dependency.remove":
      return [
        {
          severity: "warning",
          message: "Removes dependencies and should receive reviewer attention."
        }
      ];
    case "text.patch":
      return [
        {
          severity: "warning",
          message: `Patches text in ${operation.path}; reviewers should verify idempotence.`
        }
      ];
    case "env.ensure":
      return [
        {
          severity: "warning",
          message: `Ensures environment variables in ${operation.path}; secrets must not be embedded.`
        }
      ];
    case "file.create":
    case "json.merge":
      return [];
  }
}

async function readPackagedIntegration(
  projectRoot: string,
  packagePath: string
): Promise<PackagedIntegration> {
  const parsed = JSON.parse(
    await readFile(resolveInsideRoot(projectRoot, packagePath), "utf8")
  ) as unknown;

  if (!isPackagedIntegration(parsed)) {
    throw new Error("File is not an Avis integration package.");
  }

  return parsed;
}

async function readPackageFile(
  integrationRoot: string,
  relativePath: string
): Promise<PackagedIntegrationFile> {
  const contents = await readFile(path.join(integrationRoot, relativePath), "utf8");
  return {
    path: relativePath,
    sha256: sha256(contents),
    contents
  };
}

async function readOptionalPackageFile(
  integrationRoot: string,
  relativePath: string
): Promise<PackagedIntegrationFile | undefined> {
  try {
    return await readPackageFile(integrationRoot, relativePath);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function resolveIntegrationRoot(
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
    throw new Error("Integration packages must be created from inside the project root.");
  }

  return candidateRealPath;
}

function parseManifest(contents: string): AvisIntegrationManifest {
  const parsed = JSON.parse(contents) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("avis.integration.json must contain an object.");
  }

  if (
    !isNonEmptyString(parsed.id) ||
    !isNonEmptyString(parsed.name) ||
    !isNonEmptyString(parsed.description) ||
    !isNonEmptyString(parsed.capability) ||
    !isNonEmptyString(parsed.version) ||
    !isIntegrationStatus(parsed.status) ||
    !isIntegrationTrust(parsed.trust) ||
    !isRecord(parsed.supports) ||
    !isStringArray(parsed.supports.ecosystems)
  ) {
    throw new Error("avis.integration.json is not publishable.");
  }

  return parsed as unknown as AvisIntegrationManifest;
}

function parsePlan(contents: string): LocalIntegrationPlanTemplate {
  const parsed = JSON.parse(contents) as unknown;

  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.operations) ||
    !parsed.operations.every(isOperation)
  ) {
    throw new Error("plan.json is not publishable.");
  }

  return {
    title: typeof parsed.title === "string" ? parsed.title : undefined,
    operations: parsed.operations as Operation[]
  };
}

function createPackageDigest(
  packageCandidate: Omit<PackagedIntegration, "integrity"> | PackagedIntegration
): string {
  return sha256(
    JSON.stringify(
      {
        format: packageCandidate.format,
        manifest: packageCandidate.manifest,
        files: packageCandidate.files,
        securityReview: packageCandidate.securityReview,
        packagedAt: packageCandidate.packagedAt
      },
      null,
      2
    )
  );
}

function createReviewContext(): ProjectContext {
  return {
    workspaceRoot: "/avis-review",
    targetRoot: "/avis-review",
    targetId: "avis-review",
    ecosystem: "review",
    languages: []
  };
}

function isPackagedIntegration(value: unknown): value is PackagedIntegration {
  return (
    isRecord(value) &&
    value.format === packagedIntegrationFormat &&
    isRecord(value.integrity) &&
    value.integrity.algorithm === "sha256" &&
    isNonEmptyString(value.integrity.digest) &&
    isRecord(value.securityReview) &&
    typeof value.securityReview.passed === "boolean" &&
    Array.isArray(value.securityReview.findings) &&
    isRecord(value.files) &&
    hasPackagedIntegrationFileShape(value.files.manifest) &&
    hasPackagedIntegrationFileShape(value.files.plan) &&
    (value.files.verify === undefined || hasPackagedIntegrationFileShape(value.files.verify)) &&
    isNonEmptyString(value.packagedAt) &&
    isRecord(value.manifest)
  );
}

function hasPackagedIntegrationFileShape(value: unknown): value is PackagedIntegrationFile {
  return (
    isRecord(value) &&
    isNonEmptyString(value.path) &&
    isNonEmptyString(value.sha256) &&
    typeof value.contents === "string"
  );
}

function getFileIntegrityFindings(
  packageCandidate: PackagedIntegration
): PublishReviewFinding[] {
  const files = [
    packageCandidate.files.manifest,
    packageCandidate.files.plan,
    packageCandidate.files.verify
  ].filter((file): file is PackagedIntegrationFile => file !== undefined);

  return files
    .filter((file) => sha256(file.contents) !== file.sha256)
    .map((file) => ({
      severity: "error" as const,
      message: `File hash does not match contents: ${file.path}.`
    }));
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

function isIntegrationStatus(value: unknown): value is AvisIntegrationManifest["status"] {
  return value === "experimental" || value === "stable" || value === "deprecated";
}

function isIntegrationTrust(value: unknown): value is AvisIntegrationManifest["trust"] {
  return (
    value === "official" ||
    value === "verified" ||
    value === "community" ||
    value === "local" ||
    value === "experimental"
  );
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

function isDependencyType(value: unknown): boolean {
  return value === "runtime" || value === "development" || value === "optional";
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

function sha256(contents: string): string {
  return createHash("sha256").update(contents).digest("hex");
}
