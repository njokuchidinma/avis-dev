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

export function createDartPackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  if (id !== packageManagers.pub) {
    throw new Error(`Unsupported Dart package manager: ${id}`);
  }

  return {
    id,
    ecosystem: ecosystems.dart,
    detect: async (): Promise<PackageManagerMatch | undefined> => undefined,
    isDependencyInstalled: async (
      context: ProjectContext,
      packageName: string
    ): Promise<boolean> => {
      const pubspec = await readFile(path.join(context.targetRoot, "pubspec.yaml"), "utf8");
      return hasPubspecDependency(pubspec, packageName);
    },
    buildAddCommand: (
      context: ProjectContext,
      request: DependencyInstallRequest
    ): PackageManagerCommand => ({
      command: "dart",
      args: [
        "pub",
        "add",
        ...request.packages.map((packageSpec) =>
          formatDependencySpec(packageSpec, request.dependencyType)
        )
      ],
      cwd: context.targetRoot
    })
  };
}

function hasPubspecDependency(pubspec: string, packageName: string): boolean {
  const dependencyPattern = new RegExp(`^\\s{2}${escapeRegExp(packageName)}\\s*:`);
  let inDependencySection = false;

  for (const line of pubspec.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inDependencySection =
        line.trim() === "dependencies:" || line.trim() === "dev_dependencies:";
    }

    if (inDependencySection && dependencyPattern.test(line)) {
      return true;
    }
  }

  return false;
}

function formatDependencySpec(
  packageSpec: DependencySpec,
  dependencyType: DependencyInstallRequest["dependencyType"]
): string {
  const formatted = packageSpec.version
    ? `${packageSpec.name}:${packageSpec.version}`
    : packageSpec.name;

  return dependencyType === "development" ? `dev:${formatted}` : formatted;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
