import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DetectionEvidence,
  DetectionResult,
  FrameworkMatch,
  PackageManagerMatch
} from "./types.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";
import type { LanguageId, PackageManagerId } from "../types/ids.js";

interface PackageJson {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

const nodePackageManagerLockfiles: Record<string, PackageManagerId> = {
  "pnpm-lock.yaml": packageManagers.pnpm,
  "package-lock.json": packageManagers.npm,
  "npm-shrinkwrap.json": packageManagers.npm,
  "yarn.lock": packageManagers.yarn,
  "bun.lock": packageManagers.bun,
  "bun.lockb": packageManagers.bun
};

const knownPackageManagerIds = new Set<string>(Object.values(packageManagers));

export async function detectProject(root: string): Promise<DetectionResult> {
  return detectNodeProject(root);
}

export async function detectNodeProject(root: string): Promise<DetectionResult> {
  const packageJsonPath = path.join(root, "package.json");
  const packageJsonExists = await pathExists(packageJsonPath);

  if (!packageJsonExists) {
    return {
      root,
      targets: [],
      evidence: [],
      diagnostics: [
        {
          severity: "info",
          message: "No package.json found at the project root."
        }
      ]
    };
  }

  const packageJson = await readPackageJson(packageJsonPath);
  const packageJsonEvidence: DetectionEvidence = {
    kind: "package-json",
    path: "package.json",
    description: "Found Node package manifest."
  };

  const packageManagerMatches = await detectNodePackageManagers(root, packageJson);
  const frameworkMatches = await detectNodeFrameworks(root, packageJson);
  const languageMatches = await detectNodeLanguages(root, packageJson);

  return {
    root,
    targets: [
      {
        id: packageJson.name ?? "node-root",
        root,
        relativePath: ".",
        ecosystem: {
          id: ecosystems.node,
          confidence: "high",
          evidence: [packageJsonEvidence]
        },
        languages: languageMatches,
        frameworks: frameworkMatches,
        packageManagers: packageManagerMatches
      }
    ],
    evidence: [
      packageJsonEvidence,
      ...packageManagerMatches.flatMap((match) => match.evidence),
      ...frameworkMatches.flatMap((match) => match.evidence)
    ],
    diagnostics: []
  };
}

export async function detectNodePackageManagers(
  root: string,
  packageJson: PackageJson
): Promise<PackageManagerMatch[]> {
  const matches = new Map<PackageManagerId, PackageManagerMatch>();

  const packageManagerSpec = parsePackageManagerSpec(packageJson.packageManager);
  if (packageManagerSpec) {
    addPackageManagerMatch(matches, packageManagerSpec.id, {
      version: packageManagerSpec.version,
      confidence: "high",
      evidence: [
        {
          kind: "package-json",
          path: "package.json",
          description: `packageManager declares ${packageManagerSpec.id}.`
        }
      ]
    });
  }

  await Promise.all(
    Object.entries(nodePackageManagerLockfiles).map(async ([filename, id]) => {
      if (!(await pathExists(path.join(root, filename)))) {
        return;
      }

      addPackageManagerMatch(matches, id, {
        confidence: "high",
        evidence: [
          {
            kind: "lockfile",
            path: filename,
            description: `Found ${id} lockfile.`
          }
        ]
      });
    })
  );

  return Array.from(matches.values()).sort(compareMatches);
}

export async function detectNodeFrameworks(
  root: string,
  packageJson: PackageJson
): Promise<FrameworkMatch[]> {
  const dependencies = getAllDependencies(packageJson);
  const nextVersion = dependencies.get("next");
  const nextConfigEvidence = await findFirstExisting(root, [
    "next.config.js",
    "next.config.mjs",
    "next.config.ts"
  ]);

  if (!nextVersion && !nextConfigEvidence) {
    return [];
  }

  const evidence: DetectionEvidence[] = [];

  if (nextVersion) {
    evidence.push({
      kind: "package-json",
      path: "package.json",
      description: "Found next dependency."
    });
  }

  if (nextConfigEvidence) {
    evidence.push({
      kind: "config",
      path: nextConfigEvidence,
      description: "Found Next.js config file."
    });
  }

  return [
    {
      id: frameworks.nextjs,
      version: nextVersion,
      confidence: nextVersion ? "high" : "medium",
      evidence
    }
  ];
}

export async function detectNodeLanguages(
  root: string,
  packageJson: PackageJson
): Promise<LanguageId[]> {
  const dependencies = getAllDependencies(packageJson);
  const hasTsConfig = await pathExists(path.join(root, "tsconfig.json"));

  if (hasTsConfig || dependencies.has("typescript")) {
    return [languages.typescript];
  }

  return [languages.javascript];
}

function addPackageManagerMatch(
  matches: Map<PackageManagerId, PackageManagerMatch>,
  id: PackageManagerId,
  match: Omit<PackageManagerMatch, "id">
): void {
  const existing = matches.get(id);

  if (!existing) {
    matches.set(id, { id, ...match });
    return;
  }

  matches.set(id, {
    id,
    version: existing.version ?? match.version,
    confidence:
      existing.confidence === "high" || match.confidence === "high"
        ? "high"
        : existing.confidence,
    evidence: [...existing.evidence, ...match.evidence]
  });
}

function parsePackageManagerSpec(
  spec: string | undefined
): { id: PackageManagerId; version?: string } | undefined {
  if (!spec) {
    return undefined;
  }

  const atIndex = spec.indexOf("@");
  const id = atIndex === -1 ? spec : spec.slice(0, atIndex);
  const version = atIndex === -1 ? undefined : spec.slice(atIndex + 1);

  if (!knownPackageManagerIds.has(id)) {
    return undefined;
  }

  return { id, version };
}

function getAllDependencies(packageJson: PackageJson): Map<string, string> {
  return new Map(
    Object.entries({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies
    })
  );
}

async function findFirstExisting(
  root: string,
  candidates: string[]
): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (await pathExists(path.join(root, candidate))) {
      return candidate;
    }
  }

  return undefined;
}

async function readPackageJson(filePath: string): Promise<PackageJson> {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as PackageJson;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function compareMatches(
  left: PackageManagerMatch,
  right: PackageManagerMatch
): number {
  const confidenceRank = { high: 0, medium: 1, low: 2 };
  return confidenceRank[left.confidence] - confidenceRank[right.confidence];
}
