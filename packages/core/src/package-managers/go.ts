import { readFile } from "node:fs/promises";
import path from "node:path";
import { ecosystems, packageManagers } from "../types/ids.js";
import type { PackageManagerId } from "../types/ids.js";
import type {
  DependencyInstallRequest,
  PackageManagerAdapter,
  PackageManagerCommand
} from "./types.js";
import type { PackageManagerMatch } from "../detection/types.js";
import type { ProjectContext } from "../types/project-context.js";

export function createGoPackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  if (id !== packageManagers.go) {
    throw new Error(`Unsupported Go package manager: ${id}`);
  }

  return {
    id,
    ecosystem: ecosystems.go,
    detect: async (root: string): Promise<PackageManagerMatch | undefined> => {
      try {
        await readFile(path.join(root, "go.mod"), "utf8");
        return {
          id,
          confidence: "high",
          evidence: [
            {
              kind: "manifest",
              path: "go.mod",
              description: "Found Go module manifest."
            }
          ]
        };
      } catch (error) {
        if (isFileNotFoundError(error)) {
          return undefined;
        }

        throw error;
      }
    },
    isDependencyInstalled: async (
      context: ProjectContext,
      packageName: string
    ): Promise<boolean> => {
      const goMod = await readOptionalFile(path.join(context.targetRoot, "go.mod"));
      return goMod?.split("\n").some((line) => {
        const trimmed = line.trim();
        return trimmed === packageName || trimmed.startsWith(`${packageName} `);
      }) ?? false;
    },
    buildAddCommand: (
      context: ProjectContext,
      request: DependencyInstallRequest
    ): PackageManagerCommand => ({
      command: "go",
      args: ["get", ...request.packages.map((packageSpec) => packageSpec.name)],
      cwd: context.targetRoot
    })
  };
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
