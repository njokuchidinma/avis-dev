import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PackageManagerMatch } from "../detection/types.js";
import type { DependencySpec } from "../planning/operations.js";
import { ecosystems, packageManagers } from "../types/ids.js";
import type { PackageManagerId } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type {
  DependencyInstallRequest,
  PackageManagerAdapter,
  PackageManagerCommand
} from "./types.js";

export function createPythonPackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  if (
    id !== packageManagers.uv &&
    id !== packageManagers.pip &&
    id !== packageManagers.poetry
  ) {
    throw new Error(`Unsupported Python package manager: ${id}`);
  }

  return {
    id,
    ecosystem: ecosystems.python,
    detect: async (): Promise<PackageManagerMatch | undefined> => undefined,
    isDependencyInstalled: async (
      context: ProjectContext,
      packageName: string
    ): Promise<boolean> => isPythonDependencyInstalled(context, packageName),
    buildAddCommand: (
      context: ProjectContext,
      request: DependencyInstallRequest
    ): PackageManagerCommand => buildPythonAddCommand(id, context, request)
  };
}

async function isPythonDependencyInstalled(
  context: ProjectContext,
  packageName: string
): Promise<boolean> {
  const normalizedPackageName = normalizePackageName(packageName);
  const pyproject = await readOptionalFile(path.join(context.targetRoot, "pyproject.toml"));
  const requirements = await readOptionalFile(
    path.join(context.targetRoot, "requirements.txt")
  );
  const dependencyText = `${pyproject ?? ""}\n${requirements ?? ""}`.toLowerCase();

  return dependencyText.includes(normalizedPackageName);
}

function buildPythonAddCommand(
  id: PackageManagerId,
  context: ProjectContext,
  request: DependencyInstallRequest
): PackageManagerCommand {
  const packageSpecs = request.packages.map(formatDependencySpec);

  switch (id) {
    case packageManagers.uv:
      return {
        command: "uv",
        args: [
          "add",
          ...(request.dependencyType === "development" ? ["--dev"] : []),
          ...packageSpecs
        ],
        cwd: context.targetRoot
      };

    case packageManagers.poetry:
      return {
        command: "poetry",
        args: [
          "add",
          ...(request.dependencyType === "development" ? ["--group", "dev"] : []),
          ...packageSpecs
        ],
        cwd: context.targetRoot
      };

    case packageManagers.pip:
      return {
        command: "python",
        args: ["-m", "pip", "install", ...packageSpecs],
        cwd: context.targetRoot
      };

    default:
      throw new Error(`Unsupported Python package manager: ${id}`);
  }
}

function formatDependencySpec(packageSpec: DependencySpec): string {
  return packageSpec.version
    ? `${packageSpec.name}${packageSpec.version}`
    : packageSpec.name;
}

function normalizePackageName(packageName: string): string {
  return packageName.toLowerCase().replace(/[-_.]+/g, "-");
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

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
