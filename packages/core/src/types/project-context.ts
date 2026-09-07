import type {
  EcosystemId,
  FrameworkId,
  LanguageId,
  PackageManagerId,
  ProjectTypeId
} from "./ids.js";
import type { Confidence } from "./common.js";

export interface FrameworkContext {
  id: FrameworkId;
  version?: string;
  confidence?: Confidence;
}

export interface PackageManagerContext {
  id: PackageManagerId;
  version?: string;
  confidence?: Confidence;
}

export interface ProjectTypeContext {
  id: ProjectTypeId;
  confidence: Confidence;
}

export interface ProjectContext {
  workspaceRoot: string;
  targetRoot: string;
  targetId: string;
  ecosystem: EcosystemId;
  ecosystemConfidence?: Confidence;
  languages: LanguageId[];
  framework?: FrameworkContext;
  frameworks?: FrameworkContext[];
  packageManager?: PackageManagerContext;
  packageManagers?: PackageManagerContext[];
  projectType?: ProjectTypeContext;
  projectTypes?: ProjectTypeContext[];
}
