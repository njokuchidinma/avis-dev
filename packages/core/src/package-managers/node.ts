import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import type { PackageManagerMatch } from "../detection/types.js";
import { ecosystems, packageManagers } from "../types/ids.js";
import type { PackageManagerId } from "../types/ids.js";
import type { DependencySpec } from "../planning/operations.js";
import type {
  DependencyInstallRequest,
  PackageManagerAdapter,
  PackageManagerCommand
} from "./types.js";
import type { ProjectContext } from "../types/project-context.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export type CommandRunner = (command: PackageManagerCommand) => Promise<void>;

export function createNodePackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  if (
    id !== packageManagers.pnpm &&
    id !== packageManagers.npm &&
    id !== packageManagers.yarn &&
    id !== packageManagers.bun
  ) {
    throw new Error(`Unsupported Node package manager: ${id}`);
  }

  return {
    id,
    ecosystem: ecosystems.node,
    detect: async (): Promise<PackageManagerMatch | undefined> => undefined,
    isDependencyInstalled: async (
      context: ProjectContext,
      packageName: string
    ): Promise<boolean> => {
      const packageJson = await readPackageJson(context.targetRoot);
      return Boolean(
        packageJson.dependencies?.[packageName] ??
          packageJson.devDependencies?.[packageName] ??
          packageJson.optionalDependencies?.[packageName]
      );
    },
    buildAddCommand: (
      context: ProjectContext,
      request: DependencyInstallRequest
    ): PackageManagerCommand => buildNodeAddCommand(id, context, request)
  };
}

export const nodePackageManagerAdapters = [
  createNodePackageManagerAdapter(packageManagers.pnpm),
  createNodePackageManagerAdapter(packageManagers.npm),
  createNodePackageManagerAdapter(packageManagers.yarn),
  createNodePackageManagerAdapter(packageManagers.bun)
];

export async function runPackageManagerCommand(
  command: PackageManagerCommand
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      cwd: command.cwd,
      stdio: "inherit"
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command.command} ${command.args.join(" ")} failed with exit code ${code ?? "unknown"}`
        )
      );
    });
  });
}

function buildNodeAddCommand(
  id: PackageManagerId,
  context: ProjectContext,
  request: DependencyInstallRequest
): PackageManagerCommand {
  const packageSpecs = request.packages.map(formatDependencySpec);

  switch (id) {
    case packageManagers.pnpm:
      return {
        command: "pnpm",
        args: [
          "add",
          ...(request.dependencyType === "development" ? ["-D"] : []),
          ...(request.dependencyType === "optional" ? ["--save-optional"] : []),
          ...packageSpecs
        ],
        cwd: context.targetRoot
      };

    case packageManagers.npm:
      return {
        command: "npm",
        args: [
          "install",
          ...(request.dependencyType === "development" ? ["--save-dev"] : []),
          ...(request.dependencyType === "optional" ? ["--save-optional"] : []),
          ...packageSpecs
        ],
        cwd: context.targetRoot
      };

    case packageManagers.yarn:
      return {
        command: "yarn",
        args: [
          "add",
          ...(request.dependencyType === "development" ? ["--dev"] : []),
          ...(request.dependencyType === "optional" ? ["--optional"] : []),
          ...packageSpecs
        ],
        cwd: context.targetRoot
      };

    case packageManagers.bun:
      return {
        command: "bun",
        args: [
          "add",
          ...(request.dependencyType === "development" ? ["--dev"] : []),
          ...(request.dependencyType === "optional" ? ["--optional"] : []),
          ...packageSpecs
        ],
        cwd: context.targetRoot
      };

    default:
      throw new Error(`Unsupported Node package manager: ${id}`);
  }
}

function formatDependencySpec(packageSpec: DependencySpec): string {
  return packageSpec.version
    ? `${packageSpec.name}@${packageSpec.version}`
    : packageSpec.name;
}

async function readPackageJson(root: string): Promise<PackageJson> {
  const contents = await readFile(path.join(root, "package.json"), "utf8");
  return JSON.parse(contents) as PackageJson;
}
