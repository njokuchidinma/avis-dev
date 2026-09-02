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

export async function detectRustProject(root: string): Promise<DetectionResult> {
  const cargoTomlPath = path.join(root, "Cargo.toml");
  const cargoToml = await readOptionalFile(cargoTomlPath);

  if (cargoToml === undefined) {
    return {
      root,
      targets: [],
      evidence: [],
      diagnostics: [
        {
          severity: "info",
          message: "No Rust Cargo.toml found at the project root."
        }
      ]
    };
  }

  const projectEvidence: DetectionEvidence = {
    kind: "manifest",
    path: "Cargo.toml",
    description: "Found Cargo package manifest."
  };
  const packageManagerMatches = await detectRustPackageManagers(root);
  const frameworkMatches = detectRustFrameworks(cargoToml);
  const projectTypeMatches = detectRustProjectTypes(cargoToml, frameworkMatches);

  return {
    root,
    targets: [
      {
        id: getCargoPackageName(cargoToml) ?? "rust-root",
        root,
        relativePath: ".",
        ecosystem: {
          id: ecosystems.rust,
          confidence: "high",
          evidence: [projectEvidence]
        },
        languages: [languages.rust],
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

export function detectRustFrameworks(cargoToml: string): FrameworkMatch[] {
  const dependencies = getCargoDependencies(cargoToml);
  const matches: FrameworkMatch[] = [];

  if (dependencies.has("axum")) {
    matches.push({
      id: frameworks.axum,
      version: dependencies.get("axum"),
      confidence: "high",
      evidence: [
        {
          kind: "manifest",
          path: "Cargo.toml",
          description: "Found axum crate dependency."
        }
      ]
    });
  }

  if (dependencies.has("actix-web")) {
    matches.push({
      id: frameworks.actixWeb,
      version: dependencies.get("actix-web"),
      confidence: "high",
      evidence: [
        {
          kind: "manifest",
          path: "Cargo.toml",
          description: "Found actix-web crate dependency."
        }
      ]
    });
  }

  return matches;
}

export function detectRustProjectTypes(
  cargoToml: string,
  frameworkMatches: FrameworkMatch[]
): ProjectTypeMatch[] {
  if (frameworkMatches.length > 0) {
    return [
      {
        id: projectTypes.backend,
        confidence: "high",
        evidence: frameworkMatches.flatMap((match) => match.evidence)
      }
    ];
  }

  if (getCargoDependencies(cargoToml).has("clap")) {
    return [
      {
        id: projectTypes.cli,
        confidence: "high",
        evidence: [
          {
            kind: "manifest",
            path: "Cargo.toml",
            description: "Found clap crate dependency."
          }
        ]
      }
    ];
  }

  return [];
}

export async function detectRustPackageManagers(
  root: string
): Promise<PackageManagerMatch[]> {
  const lockfileExists = await pathExists(path.join(root, "Cargo.lock"));

  return [
    {
      id: packageManagers.cargo,
      confidence: "high",
      evidence: [
        {
          kind: lockfileExists ? "lockfile" : "manifest",
          path: lockfileExists ? "Cargo.lock" : "Cargo.toml",
          description: "Found Cargo project metadata."
        }
      ]
    }
  ];
}

function getCargoPackageName(cargoToml: string): string | undefined {
  return cargoToml.match(/^\s*name\s*=\s*"([^"]+)"\s*$/m)?.[1];
}

function getCargoDependencies(cargoToml: string): Map<string, string | undefined> {
  const dependencies = new Map<string, string | undefined>();
  let inDependencySection = false;

  for (const line of cargoToml.split("\n")) {
    const trimmed = line.trim();
    if (/^\[.+\]$/.test(trimmed)) {
      inDependencySection = trimmed === "[dependencies]";
      continue;
    }

    if (!inDependencySection) {
      continue;
    }

    const match = line.trim().match(/^([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]+)"|\{)/);
    if (match) {
      dependencies.set(match[1], match[2]);
    }
  }

  return dependencies;
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
