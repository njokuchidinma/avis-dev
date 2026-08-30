import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createDartPackageManagerAdapter } from "./dart.js";
import { createPhpPackageManagerAdapter } from "./php.js";
import { createRustPackageManagerAdapter } from "./rust.js";
import { ecosystems, packageManagers } from "../types/ids.js";
import type { PackageManagerId } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";

describe("V2 ecosystem package managers", () => {
  it("builds Composer dependency commands", () => {
    const adapter = createPhpPackageManagerAdapter(packageManagers.composer);

    expect(
      adapter.buildAddCommand(baseContext(ecosystems.php, packageManagers.composer), {
        dependencyType: "development",
        packages: [{ name: "pestphp/pest" }]
      })
    ).toMatchObject({
      command: "composer",
      args: ["require", "--dev", "pestphp/pest"]
    });
  });

  it("builds Dart pub dependency commands", () => {
    const adapter = createDartPackageManagerAdapter(packageManagers.pub);

    expect(
      adapter.buildAddCommand(baseContext(ecosystems.dart, packageManagers.pub), {
        dependencyType: "development",
        packages: [{ name: "build_runner" }]
      })
    ).toMatchObject({
      command: "dart",
      args: ["pub", "add", "dev:build_runner"]
    });
  });

  it("builds Cargo dependency commands", () => {
    const adapter = createRustPackageManagerAdapter(packageManagers.cargo);

    expect(
      adapter.buildAddCommand(baseContext(ecosystems.rust, packageManagers.cargo), {
        dependencyType: "optional",
        packages: [{ name: "serde" }]
      })
    ).toMatchObject({
      command: "cargo",
      args: ["add", "--optional", "serde"]
    });
  });

  it("detects Dart pub dependencies only inside dependency sections", async () => {
    const root = await createTempProject("pubspec.yaml", `name: flutter_riverpod
dependencies:
  flutter:
    sdk: flutter
`);
    const adapter = createDartPackageManagerAdapter(packageManagers.pub);

    await expect(
      adapter.isDependencyInstalled(
        baseContext(ecosystems.dart, packageManagers.pub, root),
        "flutter_riverpod"
      )
    ).resolves.toBe(false);
  });

  it("detects Cargo dependencies only inside dependency sections", async () => {
    const root = await createTempProject("Cargo.toml", `[package]
name = "tracing"
version = "0.1.0"

[dependencies]
serde = "1"
`);
    const adapter = createRustPackageManagerAdapter(packageManagers.cargo);

    await expect(
      adapter.isDependencyInstalled(
        baseContext(ecosystems.rust, packageManagers.cargo, root),
        "tracing"
      )
    ).resolves.toBe(false);
  });
});

function baseContext(
  ecosystem: ProjectContext["ecosystem"],
  packageManagerId: PackageManagerId,
  root = "/tmp/avis"
): ProjectContext {
  return {
    workspaceRoot: root,
    targetRoot: root,
    targetId: "test",
    ecosystem,
    languages: [],
    packageManager: {
      id: packageManagerId
    }
  };
}

async function createTempProject(filename: string, contents: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-package-manager-"));
  await writeFile(path.join(root, filename), contents);
  return root;
}
