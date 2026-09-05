import type { DetectionResult } from "../detection/types.js";
import type {
  EcosystemId,
  LanguageId,
  PackageManagerId
} from "../types/ids.js";

export type DependencyModel =
  | "node-packages"
  | "python-packages"
  | "composer-packages"
  | "pub-packages"
  | "cargo-crates"
  | "go-modules";

export interface EcosystemAdapter {
  id: EcosystemId;
  name: string;
  languages: LanguageId[];
  packageManagers: PackageManagerId[];
  dependencyModel: DependencyModel;
  detect(root: string): Promise<DetectionResult>;
}
