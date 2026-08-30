import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createProjectContext,
  detectDartProject,
  detectNodeProject,
  detectPhpProject,
  detectRustProject
} from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { flutterRiverpodIntegration } from "./flutter-riverpod.js";
import { heroiconsReactIntegration } from "./heroicons-react.js";
import { laravelSanctumIntegration } from "./laravel-sanctum.js";
import { lucideReactIntegration } from "./lucide-react.js";
import { reactIconsIntegration } from "./react-icons.js";
import { reduxToolkitIntegration } from "./redux-toolkit.js";
import { rustTracingIntegration } from "./rust-tracing.js";

describe("V2 ecosystem integrations", () => {
  it("plans Laravel Sanctum as a Composer dependency", async () => {
    const root = await createTempProject({
      "composer.json": JSON.stringify({
        require: {
          "laravel/framework": "^12.0"
        }
      })
    });

    const context = createProjectContext(await detectPhpProject(root));
    const plan = await laravelSanctumIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-laravel-sanctum"
    ]);
    expect(plan.operations[0]).toMatchObject({
      type: "dependency.add",
      packageManager: "composer"
    });
  });

  it("does not duplicate Laravel Sanctum when Composer already requires it", async () => {
    const root = await createTempProject({
      "composer.json": JSON.stringify({
        require: {
          "laravel/framework": "^12.0",
          "laravel/sanctum": "^4.0"
        }
      })
    });

    const context = createProjectContext(await detectPhpProject(root));
    const plan = await laravelSanctumIntegration.plan({ context });
    const verification = await laravelSanctumIntegration.verify?.(context);

    expect(plan.operations).toEqual([]);
    expect(verification?.health).toBe("healthy");
  });

  it("plans Flutter Riverpod dependency and starter provider", async () => {
    const root = await createFlutterProject(`dependencies:
  flutter:
    sdk: flutter
`);

    const context = createProjectContext(await detectDartProject(root));
    const plan = await flutterRiverpodIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-flutter-riverpod",
      "create-riverpod-provider"
    ]);
  });

  it("can apply Flutter Riverpod file changes and verify the local setup", async () => {
    const root = await createFlutterProject(`dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^3.0.0
`);

    const context = createProjectContext(await detectDartProject(root));
    const plan = await flutterRiverpodIntegration.plan({ context });

    await applyChangePlan(plan);

    const secondPlan = await flutterRiverpodIntegration.plan({ context });
    const verification = await flutterRiverpodIntegration.verify?.(context);

    expect(secondPlan.operations).toEqual([]);
    expect(verification?.health).toBe("healthy");
  });

  it("plans Rust tracing as a Cargo dependency", async () => {
    const root = await createTempProject({
      "Cargo.toml": `[package]
name = "avis-rust"
version = "0.1.0"
edition = "2024"

[dependencies]
`
    });

    const context = createProjectContext(await detectRustProject(root));
    const plan = await rustTracingIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-rust-tracing"
    ]);
    expect(plan.operations[0]).toMatchObject({
      type: "dependency.add",
      packageManager: "cargo"
    });
  });

  it("does not duplicate Rust tracing when Cargo already declares it", async () => {
    const root = await createTempProject({
      "Cargo.toml": `[package]
name = "avis-rust"
version = "0.1.0"
edition = "2024"

[dependencies]
tracing = "0.1"
`
    });

    const context = createProjectContext(await detectRustProject(root));
    const plan = await rustTracingIntegration.plan({ context });
    const verification = await rustTracingIntegration.verify?.(context);

    expect(plan.operations).toEqual([]);
    expect(verification?.health).toBe("healthy");
  });

  it("plans icon integrations as alternative implementations of the icons capability", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "16.0.0"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));

    await expect(lucideReactIntegration.plan({ context })).resolves.toMatchObject({
      operations: [
        {
          id: "add-lucide-react",
          type: "dependency.add",
          packageManager: "pnpm",
          packages: [{ name: "lucide-react" }]
        }
      ]
    });
    await expect(reactIconsIntegration.plan({ context })).resolves.toMatchObject({
      operations: [
        {
          id: "add-react-icons",
          packages: [{ name: "react-icons" }]
        }
      ]
    });
    await expect(heroiconsReactIntegration.plan({ context })).resolves.toMatchObject({
      operations: [
        {
          id: "add-heroicons-react",
          packages: [{ name: "@heroicons/react" }]
        }
      ]
    });
  });

  it("plans only missing packages for multi-package dependency integrations", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "16.0.0",
        "@reduxjs/toolkit": "2.0.0"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await reduxToolkitIntegration.plan({ context });
    const verification = await reduxToolkitIntegration.verify?.(context);

    expect(plan.operations).toMatchObject([
      {
        id: "add-redux-toolkit",
        packages: [{ name: "react-redux" }]
      }
    ]);
    expect(verification?.health).toBe("partial");
  });
});

async function createFlutterProject(pubspecBody: string): Promise<string> {
  const root = await createTempProject({
    "pubspec.yaml": `name: avis_flutter
${pubspecBody}`,
    "pubspec.lock": ""
  });
  await mkdir(path.join(root, "lib"), { recursive: true });
  return root;
}

async function createNextProject(packageJson: Record<string, unknown>): Promise<string> {
  return createTempProject({
    "package.json": JSON.stringify(
      {
        name: "next-app",
        packageManager: "pnpm@11.24.0",
        ...packageJson
      },
      null,
      2
    ),
    "pnpm-lock.yaml": ""
  });
}

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-integration-"));

  await Promise.all(
    Object.entries(files).map(([filename, contents]) =>
      writeFile(path.join(root, filename), contents)
    )
  );

  return root;
}
