import { packageManagers } from "../types/ids.js";
import type { PackageManagerId } from "../types/ids.js";
import { createDartPackageManagerAdapter } from "./dart.js";
import { createGoPackageManagerAdapter } from "./go.js";
import { createNodePackageManagerAdapter } from "./node.js";
import { createPhpPackageManagerAdapter } from "./php.js";
import { createPythonPackageManagerAdapter } from "./python.js";
import { createRustPackageManagerAdapter } from "./rust.js";
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

    case packageManagers.composer:
      return createPhpPackageManagerAdapter(id);

    case packageManagers.pub:
      return createDartPackageManagerAdapter(id);

    case packageManagers.cargo:
      return createRustPackageManagerAdapter(id);

    case packageManagers.go:
      return createGoPackageManagerAdapter(id);

    default:
      throw new Error(`Unsupported package manager: ${id}`);
  }
}
