import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DetectionEvidence,
  DetectionResult,
  PackageManagerMatch
} from "./types.js";
import { ecosystems, languages, packageManagers } from "../types/ids.js";

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
        frameworks: [],
        packageManagers: packageManagerMatches
      }
    ],
    evidence: [
      projectEvidence,
      ...packageManagerMatches.flatMap((match) => match.evidence)
    ],
    diagnostics: []
  };
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
