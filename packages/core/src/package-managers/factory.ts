import { packageManagers } from "../types/ids.js";
import type { PackageManagerId } from "../types/ids.js";
import { createNodePackageManagerAdapter } from "./node.js";
import { createPythonPackageManagerAdapter } from "./python.js";
import type { PackageManagerAdapter } from "./types.js";

export function createPackageManagerAdapter(
  id: PackageManagerId
): PackageManagerAdapter {
  switch (id) {
    case packageManagers.pnpm:
    case packageManagers.npm:
    case packageManagers.yarn:
    case packageManagers.bun:
      return createNodePackageManagerAdapter(id);

    case packageManagers.uv:
    case packageManagers.pip:
    case packageManagers.poetry:
      return createPythonPackageManagerAdapter(id);

    default:
      throw new Error(`Unsupported package manager: ${id}`);
  }
}
