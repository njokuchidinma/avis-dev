import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DetectionEvidence,
  DetectionResult,
  FrameworkMatch,
  PackageManagerMatch,
  ProjectTypeMatch
} from "./types.js";
import {
  ecosystems,
  frameworks,
  languages,
  packageManagers,
  projectTypes
} from "../types/ids.js";
import type {
  FrameworkId,
  LanguageId,
  PackageManagerId,
  ProjectTypeId
} from "../types/ids.js";

interface PackageJson {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bin?: string | Record<string, string>;
}

interface NodeFrameworkDefinition {
  id: FrameworkId;
  dependencies: string[];
  configFiles?: string[];
  projectType: ProjectTypeId;
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

const nodeFrameworkDefinitions: NodeFrameworkDefinition[] = [
  {
    id: frameworks.nextjs,
    dependencies: ["next"],
    configFiles: ["next.config.js", "next.config.mjs", "next.config.ts"],
    projectType: projectTypes.fullstack
  },
  {
    id: frameworks.expo,
    dependencies: ["expo"],
    projectType: projectTypes.mobile
  },
  {
    id: frameworks.reactNative,
    dependencies: ["react-native"],
    projectType: projectTypes.mobile
  },
  {
    id: frameworks.nestjs,
    dependencies: ["@nestjs/core"],
    projectType: projectTypes.backend
  },
  {
    id: frameworks.express,
    dependencies: ["express"],
    projectType: projectTypes.backend
  },
  {
    id: frameworks.fastify,
    dependencies: ["fastify"],
    projectType: projectTypes.backend
  },
  {
    id: frameworks.nuxt,
    dependencies: ["nuxt"],
    configFiles: ["nuxt.config.js", "nuxt.config.mjs", "nuxt.config.ts"],
    projectType: projectTypes.fullstack
  },
  {
    id: frameworks.vue,
    dependencies: ["vue"],
    projectType: projectTypes.frontend
  },
  {
    id: frameworks.sveltekit,
    dependencies: ["@sveltejs/kit"],
    configFiles: ["svelte.config.js"],
    projectType: projectTypes.fullstack
  },
  {
    id: frameworks.svelte,
    dependencies: ["svelte"],
    projectType: projectTypes.frontend
  },
  {
    id: frameworks.react,
    dependencies: ["react"],
    projectType: projectTypes.frontend
  }
];

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
  const projectTypeMatches = detectNodeProjectTypes(packageJson, frameworkMatches);

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
        packageManagers: packageManagerMatches,
        projectTypes: projectTypeMatches
      }
    ],
    evidence: [
      packageJsonEvidence,
      ...packageManagerMatches.flatMap((match) => match.evidence),
      ...frameworkMatches.flatMap((match) => match.evidence),
      ...projectTypeMatches.flatMap((match) => match.evidence)
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
  const matches = await Promise.all(
    nodeFrameworkDefinitions.map(async (definition) =>
      detectNodeFramework(root, dependencies, definition)
    )
  );

  return matches.filter((match): match is FrameworkMatch => match !== undefined);
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

export function detectNodeProjectTypes(
  packageJson: PackageJson,
  frameworkMatches: FrameworkMatch[]
): ProjectTypeMatch[] {
  const frameworkTypes = new Map<FrameworkId, ProjectTypeId>(
    nodeFrameworkDefinitions.map((definition) => [definition.id, definition.projectType])
  );
  const matches = new Map<ProjectTypeId, ProjectTypeMatch>();

  for (const frameworkMatch of frameworkMatches) {
    const projectType = frameworkTypes.get(frameworkMatch.id);
    if (!projectType) {
      continue;
    }

    addProjectTypeMatch(matches, projectType, {
      confidence: frameworkMatch.confidence,
      evidence: frameworkMatch.evidence
    });
  }

  if (matches.size === 0 && packageJson.bin) {
    addProjectTypeMatch(matches, projectTypes.cli, {
      confidence: "medium",
      evidence: [
        {
          kind: "package-json",
          path: "package.json",
          description: "Found package.json bin entry."
        }
      ]
    });
  }

  return Array.from(matches.values()).sort(compareProjectTypeMatches);
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

async function detectNodeFramework(
  root: string,
  dependencies: Map<string, string>,
  definition: NodeFrameworkDefinition
): Promise<FrameworkMatch | undefined> {
  const dependency = definition.dependencies.find((name) => dependencies.has(name));
  const version = dependency ? dependencies.get(dependency) : undefined;
  const configFile = definition.configFiles
    ? await findFirstExisting(root, definition.configFiles)
    : undefined;

  if (!dependency && !configFile) {
    return undefined;
  }

  const evidence: DetectionEvidence[] = [];

  if (dependency) {
    evidence.push({
      kind: "package-json",
      path: "package.json",
      description: `Found ${dependency} dependency.`
    });
  }

  if (configFile) {
    evidence.push({
      kind: "config",
      path: configFile,
      description: `Found ${definition.id} config file.`
    });
  }

  return {
    id: definition.id,
    version,
    confidence: dependency ? "high" : "medium",
    evidence
  };
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

function addProjectTypeMatch(
  matches: Map<ProjectTypeId, ProjectTypeMatch>,
  id: ProjectTypeId,
  match: Omit<ProjectTypeMatch, "id">
): void {
  const existing = matches.get(id);

  if (!existing) {
    matches.set(id, { id, ...match });
    return;
  }

  matches.set(id, {
    id,
    confidence:
      existing.confidence === "high" || match.confidence === "high"
        ? "high"
        : existing.confidence,
    evidence: [...existing.evidence, ...match.evidence]
  });
}

function compareProjectTypeMatches(
  left: ProjectTypeMatch,
  right: ProjectTypeMatch
): number {
  const confidenceRank = { high: 0, medium: 1, low: 2 };
  return confidenceRank[left.confidence] - confidenceRank[right.confidence];
}
