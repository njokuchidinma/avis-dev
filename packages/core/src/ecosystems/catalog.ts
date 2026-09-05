import { detectDartProject } from "../detection/dart.js";
import { detectGoProject } from "../detection/go.js";
import { detectNodeProject } from "../detection/node.js";
import { detectPhpProject } from "../detection/php.js";
import { detectPythonProject } from "../detection/python.js";
import { detectRustProject } from "../detection/rust.js";
import {
  ecosystems,
  languages,
  packageManagers
} from "../types/ids.js";
import type { EcosystemId } from "../types/ids.js";
import type { EcosystemAdapter } from "./types.js";

export const ecosystemAdapters: EcosystemAdapter[] = [
  {
    id: ecosystems.node,
    name: "JavaScript / TypeScript",
    languages: [languages.javascript, languages.typescript],
    packageManagers: [
      packageManagers.npm,
      packageManagers.pnpm,
      packageManagers.yarn,
      packageManagers.bun
    ],
    dependencyModel: "node-packages",
    detect: detectNodeProject
  },
  {
    id: ecosystems.python,
    name: "Python",
    languages: [languages.python],
    packageManagers: [
      packageManagers.pip,
      packageManagers.uv,
      packageManagers.poetry
    ],
    dependencyModel: "python-packages",
    detect: detectPythonProject
  },
  {
    id: ecosystems.php,
    name: "PHP",
    languages: [languages.php],
    packageManagers: [packageManagers.composer],
    dependencyModel: "composer-packages",
    detect: detectPhpProject
  },
  {
    id: ecosystems.dart,
    name: "Dart",
    languages: [languages.dart],
    packageManagers: [packageManagers.pub],
    dependencyModel: "pub-packages",
    detect: detectDartProject
  },
  {
    id: ecosystems.rust,
    name: "Rust",
    languages: [languages.rust],
    packageManagers: [packageManagers.cargo],
    dependencyModel: "cargo-crates",
    detect: detectRustProject
  },
  {
    id: ecosystems.go,
    name: "Go",
    languages: [languages.go],
    packageManagers: [packageManagers.go],
    dependencyModel: "go-modules",
    detect: detectGoProject
  }
];

export function findEcosystemAdapter(
  ecosystem: EcosystemId
): EcosystemAdapter | undefined {
  return ecosystemAdapters.find((adapter) => adapter.id === ecosystem);
}
