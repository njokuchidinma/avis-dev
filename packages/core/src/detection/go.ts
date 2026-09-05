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
import type { FrameworkId } from "../types/ids.js";

export async function detectGoProject(root: string): Promise<DetectionResult> {
  const goModPath = path.join(root, "go.mod");
  const goMod = await readOptionalFile(goModPath);

  if (goMod === undefined) {
    return {
      root,
      targets: [],
      evidence: [],
      diagnostics: [
        {
          severity: "info",
          message: "No Go module file found at the project root."
        }
      ]
    };
  }

  const projectEvidence: DetectionEvidence = {
    kind: "manifest",
    path: "go.mod",
    description: "Found Go module manifest."
  };
  const packageManagerMatches = await detectGoPackageManagers(root);
  const frameworkMatches = detectGoFrameworks(goMod);
  const projectTypeMatches = detectGoProjectTypes(frameworkMatches);

  return {
    root,
    targets: [
      {
        id: getGoModuleName(goMod) ?? "go-root",
        root,
        relativePath: ".",
        ecosystem: {
          id: ecosystems.go,
          confidence: "high",
          evidence: [projectEvidence]
        },
        languages: [languages.go],
        frameworks: frameworkMatches,
        packageManagers: packageManagerMatches,
        projectTypes: projectTypeMatches
      }
    ],
    evidence: [
      projectEvidence,
      ...packageManagerMatches.flatMap((match) => match.evidence),
      ...frameworkMatches.flatMap((match) => match.evidence),
      ...projectTypeMatches.flatMap((match) => match.evidence)
    ],
    diagnostics: []
  };
}

export async function detectGoPackageManagers(
  root: string
): Promise<PackageManagerMatch[]> {
  const lockfileExists = await pathExists(path.join(root, "go.sum"));

  return [
    {
      id: packageManagers.go,
      confidence: "high",
      evidence: [
        {
          kind: lockfileExists ? "lockfile" : "manifest",
          path: lockfileExists ? "go.sum" : "go.mod",
          description: "Found Go module metadata."
        }
      ]
    }
  ];
}

export function detectGoFrameworks(goMod: string): FrameworkMatch[] {
  const dependencies = getGoDependencies(goMod);
  const matches: FrameworkMatch[] = [];

  addGoFrameworkMatch(matches, dependencies, "github.com/gin-gonic/gin", frameworks.gin);
  addGoFrameworkMatch(matches, dependencies, "github.com/gofiber/fiber", frameworks.fiber);
  addGoFrameworkMatch(matches, dependencies, "github.com/labstack/echo", frameworks.echo);

  return matches;
}

export function detectGoProjectTypes(
  frameworksFound: FrameworkMatch[]
): ProjectTypeMatch[] {
  if (frameworksFound.length === 0) {
    return [];
  }

  return [
    {
      id: projectTypes.backend,
      confidence: "high",
      evidence: frameworksFound.flatMap((framework) => framework.evidence)
    }
  ];
}

function addGoFrameworkMatch(
  matches: FrameworkMatch[],
  dependencies: Map<string, string>,
  dependency: string,
  frameworkId: FrameworkId
): void {
  const version = dependencies.get(dependency);

  if (!version) {
    return;
  }

  matches.push({
    id: frameworkId,
    version,
    confidence: "high",
    evidence: [
      {
        kind: "manifest",
        path: "go.mod",
        description: `Found ${frameworkId} module dependency.`
      }
    ]
  });
}

function getGoDependencies(goMod: string): Map<string, string> {
  const dependencies = new Map<string, string>();
  const requireBlock = goMod.match(/require\s*\(([\s\S]*?)\)/m)?.[1] ?? "";

  for (const line of `${goMod}\n${requireBlock}`.split("\n")) {
    const match = line
      .trim()
      .match(/^(?:require\s+)?([A-Za-z0-9_./-]+)\s+(v[^\s]+)/);
    if (match) {
      dependencies.set(match[1], match[2]);
    }
  }

  return dependencies;
}

function getGoModuleName(goMod: string): string | undefined {
  return goMod.match(/^module\s+(.+?)\s*$/m)?.[1];
}

async function readOptionalFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
