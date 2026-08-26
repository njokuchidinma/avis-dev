import type {
  EcosystemId,
  FrameworkId,
  LanguageId,
  PackageManagerId
} from "./ids.js";

export interface FrameworkContext {
  id: FrameworkId;
  version?: string;
}

export interface PackageManagerContext {
  id: PackageManagerId;
  version?: string;
}

export interface ProjectContext {
  workspaceRoot: string;
  targetRoot: string;
  targetId: string;
  ecosystem: EcosystemId;
  languages: LanguageId[];
  framework?: FrameworkContext;
  packageManager?: PackageManagerContext;
}
