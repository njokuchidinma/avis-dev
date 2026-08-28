import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DetectionEvidence,
  DetectionResult,
  FrameworkMatch,
  PackageManagerMatch
} from "./types.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";

interface PythonProjectFiles {
  pyproject?: string;
  requirements?: string;
  managePy?: string;
}

export async function detectPythonProject(root: string): Promise<DetectionResult> {
  const files = await readPythonProjectFiles(root);
  const hasPythonProject =
    files.pyproject !== undefined ||
    files.requirements !== undefined ||
    files.managePy !== undefined ||
    (await pathExists(path.join(root, "uv.lock"))) ||
    (await pathExists(path.join(root, "poetry.lock")));

  if (!hasPythonProject) {
    return {
      root,
      targets: [],
      evidence: [],
      diagnostics: [
        {
          severity: "info",
          message: "No Python project files found at the project root."
        }
      ]
    };
  }

  const projectEvidence = getPythonProjectEvidence(files);
  const packageManagerMatches = await detectPythonPackageManagers(root, files);
  const frameworkMatches = detectPythonFrameworks(files);

  return {
    root,
    targets: [
      {
        id: "python-root",
        root,
        relativePath: ".",
        ecosystem: {
          id: ecosystems.python,
          confidence: "high",
          evidence: projectEvidence
        },
        languages: [languages.python],
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

export async function detectPythonPackageManagers(
  root: string,
  files: PythonProjectFiles = {}
): Promise<PackageManagerMatch[]> {
  const matches: PackageManagerMatch[] = [];

  if (await pathExists(path.join(root, "uv.lock"))) {
    matches.push({
      id: packageManagers.uv,
      confidence: "high",
      evidence: [
        {
          kind: "lockfile",
          path: "uv.lock",
          description: "Found uv lockfile."
        }
      ]
    });
  }

  if ((await pathExists(path.join(root, "poetry.lock"))) || files.pyproject?.includes("[tool.poetry]")) {
    matches.push({
      id: packageManagers.poetry,
      confidence: files.pyproject?.includes("[tool.poetry]") ? "high" : "medium",
      evidence: [
        {
          kind: files.pyproject?.includes("[tool.poetry]") ? "config" : "lockfile",
          path: files.pyproject?.includes("[tool.poetry]") ? "pyproject.toml" : "poetry.lock",
          description: "Found Poetry project metadata."
        }
      ]
    });
  }

  if (files.requirements !== undefined) {
    matches.push({
      id: packageManagers.pip,
      confidence: "medium",
      evidence: [
        {
          kind: "manifest",
          path: "requirements.txt",
          description: "Found pip requirements file."
        }
      ]
    });
  }

  return matches;
}

export function detectPythonFrameworks(files: PythonProjectFiles): FrameworkMatch[] {
  const evidence: DetectionEvidence[] = [];
  const dependencyText = `${files.pyproject ?? ""}\n${files.requirements ?? ""}`.toLowerCase();

  if (files.managePy !== undefined) {
    evidence.push({
      kind: "file",
      path: "manage.py",
      description: "Found Django manage.py."
    });
  }

  if (dependencyText.includes("django")) {
    evidence.push({
      kind: files.pyproject ? "config" : "manifest",
      path: files.pyproject ? "pyproject.toml" : "requirements.txt",
      description: "Found Django dependency metadata."
    });
  }

  if (evidence.length === 0) {
    return [];
  }

  return [
    {
      id: frameworks.django,
      confidence: files.managePy !== undefined ? "high" : "medium",
      evidence
    }
  ];
}

async function readPythonProjectFiles(root: string): Promise<PythonProjectFiles> {
  return {
    pyproject: await readOptionalFile(path.join(root, "pyproject.toml")),
    requirements: await readOptionalFile(path.join(root, "requirements.txt")),
    managePy: await readOptionalFile(path.join(root, "manage.py"))
  };
}

function getPythonProjectEvidence(files: PythonProjectFiles): DetectionEvidence[] {
  const evidence: DetectionEvidence[] = [];

  if (files.pyproject !== undefined) {
    evidence.push({
      kind: "config",
      path: "pyproject.toml",
      description: "Found Python project metadata."
    });
  }

  if (files.requirements !== undefined) {
    evidence.push({
      kind: "manifest",
      path: "requirements.txt",
      description: "Found Python requirements file."
    });
  }

  if (files.managePy !== undefined) {
    evidence.push({
      kind: "file",
      path: "manage.py",
      description: "Found Python entry point."
    });
  }

  return evidence;
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
