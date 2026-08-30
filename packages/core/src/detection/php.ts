import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DetectionEvidence,
  DetectionResult,
  FrameworkMatch,
  PackageManagerMatch
} from "./types.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";

interface ComposerJson {
  name?: string;
  require?: Record<string, string>;
  "require-dev"?: Record<string, string>;
}

export async function detectPhpProject(root: string): Promise<DetectionResult> {
  const composerJsonPath = path.join(root, "composer.json");
  const composerJson = await readOptionalComposerJson(composerJsonPath);
  const artisanExists = await pathExists(path.join(root, "artisan"));

  if (!composerJson && !artisanExists) {
    return {
      root,
      targets: [],
      evidence: [],
      diagnostics: [
        {
          severity: "info",
          message: "No PHP project files found at the project root."
        }
      ]
    };
  }

  const projectEvidence: DetectionEvidence[] = composerJson
    ? [
        {
          kind: "manifest",
          path: "composer.json",
          description: "Found Composer package manifest."
        }
      ]
    : [
        {
          kind: "file",
          path: "artisan",
          description: "Found Laravel artisan entry point."
        }
      ];
  const packageManagerMatches = await detectPhpPackageManagers(root, composerJson);
  const frameworkMatches = detectPhpFrameworks(composerJson, artisanExists);

  return {
    root,
    targets: [
      {
        id: composerJson?.name ?? "php-root",
        root,
        relativePath: ".",
        ecosystem: {
          id: ecosystems.php,
          confidence: composerJson ? "high" : "medium",
          evidence: projectEvidence
        },
        languages: [languages.php],
        frameworks: frameworkMatches,
        packageManagers: packageManagerMatches
      }
    ],
    evidence: [
      ...projectEvidence,
      ...packageManagerMatches.flatMap((match) => match.evidence),
      ...frameworkMatches.flatMap((match) => match.evidence)
    ],
    diagnostics: []
  };
}

export async function detectPhpPackageManagers(
  root: string,
  composerJson?: ComposerJson
): Promise<PackageManagerMatch[]> {
  if (!composerJson && !(await pathExists(path.join(root, "composer.lock")))) {
    return [];
  }

  const lockfileExists = await pathExists(path.join(root, "composer.lock"));

  return [
    {
      id: packageManagers.composer,
      confidence: composerJson ? "high" : "medium",
      evidence: [
        {
          kind: composerJson ? "manifest" : "lockfile",
          path: composerJson ? "composer.json" : "composer.lock",
          description: lockfileExists
            ? "Found Composer project metadata."
            : "Found Composer package manifest."
        }
      ]
    }
  ];
}

export function detectPhpFrameworks(
  composerJson: ComposerJson | undefined,
  artisanExists: boolean
): FrameworkMatch[] {
  const dependencies = {
    ...composerJson?.require,
    ...composerJson?.["require-dev"]
  };
  const laravelVersion = dependencies["laravel/framework"];
  const evidence: DetectionEvidence[] = [];

  if (laravelVersion) {
    evidence.push({
      kind: "manifest",
      path: "composer.json",
      description: "Found Laravel framework dependency."
    });
  }

  if (artisanExists) {
    evidence.push({
      kind: "file",
      path: "artisan",
      description: "Found Laravel artisan entry point."
    });
  }

  if (evidence.length === 0) {
    return [];
  }

  return [
    {
      id: frameworks.laravel,
      version: laravelVersion,
      confidence: laravelVersion || artisanExists ? "high" : "medium",
      evidence
    }
  ];
}

async function readOptionalComposerJson(
  filePath: string
): Promise<ComposerJson | undefined> {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents) as ComposerJson;
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
