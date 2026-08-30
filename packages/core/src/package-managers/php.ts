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

interface ComposerJson {
  require?: Record<string, string>;
  "require-dev"?: Record<string, string>;
}

export function createPhpPackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  if (id !== packageManagers.composer) {
    throw new Error(`Unsupported PHP package manager: ${id}`);
  }

  return {
    id,
    ecosystem: ecosystems.php,
    detect: async (): Promise<PackageManagerMatch | undefined> => undefined,
    isDependencyInstalled: async (
      context: ProjectContext,
      packageName: string
    ): Promise<boolean> => {
      const composerJson = await readComposerJson(context.targetRoot);
      return Boolean(
        composerJson.require?.[packageName] ?? composerJson["require-dev"]?.[packageName]
      );
    },
    buildAddCommand: (
      context: ProjectContext,
      request: DependencyInstallRequest
    ): PackageManagerCommand => ({
      command: "composer",
      args: [
        "require",
        ...(request.dependencyType === "development" ? ["--dev"] : []),
        ...request.packages.map(formatDependencySpec)
      ],
      cwd: context.targetRoot
    })
  };
}

function formatDependencySpec(packageSpec: DependencySpec): string {
  return packageSpec.version
    ? `${packageSpec.name}:${packageSpec.version}`
    : packageSpec.name;
}

async function readComposerJson(root: string): Promise<ComposerJson> {
  const contents = await readFile(path.join(root, "composer.json"), "utf8");
  return JSON.parse(contents) as ComposerJson;
}
