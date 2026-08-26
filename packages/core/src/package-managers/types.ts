import type { PackageManagerMatch } from "../detection/types.js";
import type { EcosystemId, PackageManagerId } from "../types/ids.js";
import type { DependencySpec, DependencyType } from "../planning/operations.js";
import type { ProjectContext } from "../types/project-context.js";

export interface DependencyInstallRequest {
  packages: DependencySpec[];
  dependencyType: DependencyType;
}

export interface PackageManagerCommand {
  command: string;
  args: string[];
  cwd: string;
}

export interface PackageManagerAdapter {
  id: PackageManagerId;
  ecosystem: EcosystemId;
  detect(root: string): Promise<PackageManagerMatch | undefined>;
  isDependencyInstalled(
    context: ProjectContext,
    packageName: string
  ): Promise<boolean>;
  buildAddCommand(
    context: ProjectContext,
    request: DependencyInstallRequest
  ): PackageManagerCommand;
}
