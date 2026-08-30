import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectDartProject } from "./dart.js";
import { detectPhpProject } from "./php.js";
import { detectProject } from "./project.js";
import { detectRustProject } from "./rust.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";

describe("V2 ecosystem detection", () => {
  it("detects a Laravel project from Composer metadata", async () => {
    const root = await createTempProject({
      "composer.json": JSON.stringify({
        name: "avis/example-laravel",
        require: {
          "php": "^8.3",
          "laravel/framework": "^12.0"
        }
      }),
      "composer.lock": "{}"
    });

    const result = await detectPhpProject(root);

    expect(result.targets[0]?.ecosystem.id).toBe(ecosystems.php);
    expect(result.targets[0]?.languages).toEqual([languages.php]);
    expect(result.targets[0]?.frameworks[0]?.id).toBe(frameworks.laravel);
    expect(result.targets[0]?.packageManagers[0]?.id).toBe(packageManagers.composer);
  });

  it("detects a Flutter project from pubspec.yaml", async () => {
    const root = await createTempProject({
      "pubspec.yaml": `name: avis_flutter
dependencies:
  flutter:
    sdk: flutter
`,
      "pubspec.lock": ""
    });

    const result = await detectDartProject(root);

    expect(result.targets[0]?.ecosystem.id).toBe(ecosystems.dart);
    expect(result.targets[0]?.languages).toEqual([languages.dart]);
    expect(result.targets[0]?.frameworks[0]?.id).toBe(frameworks.flutter);
    expect(result.targets[0]?.packageManagers[0]?.id).toBe(packageManagers.pub);
  });

  it("detects a Rust project from Cargo metadata", async () => {
    const root = await createTempProject({
      "Cargo.toml": `[package]
name = "avis-rust"
version = "0.1.0"
edition = "2024"
`,
      "Cargo.lock": ""
    });

    const result = await detectRustProject(root);

    expect(result.targets[0]?.ecosystem.id).toBe(ecosystems.rust);
    expect(result.targets[0]?.languages).toEqual([languages.rust]);
    expect(result.targets[0]?.packageManagers[0]?.id).toBe(packageManagers.cargo);
  });

  it("uses expanded ecosystem detection in the generic detector", async () => {
    const root = await createTempProject({
      "Cargo.toml": `[package]
name = "avis-rust"
version = "0.1.0"
edition = "2024"
`
    });

    const result = await detectProject(root);

    expect(result.targets[0]?.ecosystem.id).toBe(ecosystems.rust);
  });
});

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-ecosystem-"));

  await Promise.all(
    Object.entries(files).map(([filename, contents]) =>
      writeFile(path.join(root, filename), contents)
    )
  );

  return root;
}
