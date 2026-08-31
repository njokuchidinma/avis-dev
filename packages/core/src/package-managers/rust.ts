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

export function createRustPackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  if (id !== packageManagers.cargo) {
    throw new Error(`Unsupported Rust package manager: ${id}`);
  }

  return {
    id,
    ecosystem: ecosystems.rust,
    detect: async (): Promise<PackageManagerMatch | undefined> => undefined,
    isDependencyInstalled: async (
      context: ProjectContext,
      packageName: string
    ): Promise<boolean> => {
      const cargoToml = await readFile(path.join(context.targetRoot, "Cargo.toml"), "utf8");
      return hasCargoDependency(cargoToml, packageName);
    },
    buildAddCommand: (
      context: ProjectContext,
      request: DependencyInstallRequest
    ): PackageManagerCommand => ({
      command: "cargo",
      args: [
        "add",
        ...(request.dependencyType === "development" ? ["--dev"] : []),
        ...(request.dependencyType === "optional" ? ["--optional"] : []),
        ...request.packages.map(formatDependencySpec)
      ],
      cwd: context.targetRoot
    })
  };
}

function hasCargoDependency(cargoToml: string, packageName: string): boolean {
  const dependencyPattern = new RegExp(`^\\s*${escapeRegExp(packageName)}\\s*=`);
  let inDependencySection = false;

  for (const line of cargoToml.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\s*\[([^\]]+)]\s*$/);
    if (sectionMatch) {
      inDependencySection = [
        "dependencies",
        "dev-dependencies",
        "build-dependencies"
      ].includes(sectionMatch[1] ?? "");
      continue;
    }

    if (inDependencySection && dependencyPattern.test(line)) {
      return true;
    }
  }

  return false;
}

function formatDependencySpec(packageSpec: DependencySpec): string {
  return packageSpec.version
    ? `${packageSpec.name}@${packageSpec.version}`
    : packageSpec.name;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
