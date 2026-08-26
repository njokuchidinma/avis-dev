import type { PackageManagerId } from "../types/ids.js";

export type DependencyType = "runtime" | "development" | "optional";

export interface DependencySpec {
  name: string;
  version?: string;
  features?: string[];
}

export interface BaseOperation {
  id: string;
  description: string;
}

export interface DependencyAddOperation extends BaseOperation {
  type: "dependency.add";
  packages: DependencySpec[];
  dependencyType: DependencyType;
  packageManager?: PackageManagerId;
}

export interface DependencyRemoveOperation extends BaseOperation {
  type: "dependency.remove";
  packages: string[];
  packageManager?: PackageManagerId;
}

export interface FileCreateOperation extends BaseOperation {
  type: "file.create";
  path: string;
  contents: string;
  overwrite: "never" | "if-identical";
}

export interface JsonMergeOperation extends BaseOperation {
  type: "json.merge";
  path: string;
  value: Record<string, unknown>;
}

export interface TextPatchOperation extends BaseOperation {
  type: "text.patch";
  path: string;
  search: string;
  replace: string;
}

export interface EnvEnsureOperation extends BaseOperation {
  type: "env.ensure";
  path: string;
  variables: Record<string, string>;
}

export type Operation =
  | DependencyAddOperation
  | DependencyRemoveOperation
  | FileCreateOperation
  | JsonMergeOperation
  | TextPatchOperation
  | EnvEnsureOperation;
