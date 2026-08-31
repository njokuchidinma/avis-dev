import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DetectionEvidence,
  DetectionResult,
  FrameworkMatch,
  PackageManagerMatch
} from "./types.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";

export async function detectDartProject(root: string): Promise<DetectionResult> {
  const pubspecPath = path.join(root, "pubspec.yaml");
  const pubspec = await readOptionalFile(pubspecPath);

  if (pubspec === undefined) {
    return {
      root,
      targets: [],
      evidence: [],
      diagnostics: [
        {
          severity: "info",
          message: "No Dart pubspec.yaml found at the project root."
        }
      ]
    };
  }

  const projectEvidence: DetectionEvidence = {
    kind: "manifest",
    path: "pubspec.yaml",
    description: "Found Dart package manifest."
  };
  const packageManagerMatches = await detectDartPackageManagers(root);
  const frameworkMatches = detectDartFrameworks(pubspec);

  return {
    root,
    targets: [
      {
        id: getPubspecName(pubspec) ?? "dart-root",
        root,
        relativePath: ".",
        ecosystem: {
          id: ecosystems.dart,
          confidence: "high",
          evidence: [projectEvidence]
        },
        languages: [languages.dart],
        frameworks: frameworkMatches,
        packageManagers: packageManagerMatches
      }
    ],
    evidence: [
      projectEvidence,
      ...packageManagerMatches.flatMap((match) => match.evidence),
      ...frameworkMatches.flatMap((match) => match.evidence)
    ],
    diagnostics: []
  };
}

export async function detectDartPackageManagers(
  root: string
): Promise<PackageManagerMatch[]> {
  const lockfileExists = await pathExists(path.join(root, "pubspec.lock"));

  return [
    {
      id: packageManagers.pub,
      confidence: "high",
      evidence: [
        {
          kind: lockfileExists ? "lockfile" : "manifest",
          path: lockfileExists ? "pubspec.lock" : "pubspec.yaml",
          description: "Found Dart pub package metadata."
        }
      ]
    }
  ];
}

export function detectDartFrameworks(pubspec: string): FrameworkMatch[] {
  const hasFlutterSdk = /^\s*sdk:\s*flutter\s*$/m.test(pubspec);
  const hasFlutterSection = /^flutter:\s*$/m.test(pubspec);

  if (!hasFlutterSdk && !hasFlutterSection) {
    return [];
  }

  return [
    {
      id: frameworks.flutter,
      confidence: hasFlutterSdk ? "high" : "medium",
      evidence: [
        {
          kind: "manifest",
          path: "pubspec.yaml",
          description: hasFlutterSdk
            ? "Found Flutter SDK dependency."
            : "Found Flutter configuration section."
        }
      ]
    }
  ];
}

function getPubspecName(pubspec: string): string | undefined {
  return pubspec.match(/^name:\s*([A-Za-z0-9_-]+)\s*$/m)?.[1];
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
