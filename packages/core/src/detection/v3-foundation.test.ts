import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ecosystemAdapters } from "../ecosystems/catalog.js";
import {
  findFrameworkDefinition,
  getFrameworkSupportTier,
  getRelevantCapabilitiesForContext
} from "../frameworks/catalog.js";
import {
  ecosystems,
  frameworks,
  languages,
  packageManagers,
  projectTypes
} from "../types/ids.js";
import { createProjectContext } from "./context.js";
import { detectGoProject } from "./go.js";
import { detectNodeProject } from "./node.js";
import { detectProject } from "./project.js";
import { detectRustProject } from "./rust.js";

describe("V3 project context foundation", () => {
  it("detects Go modules and Gin as a backend project", async () => {
    const root = await createTempProject({
      "go.mod": `module github.com/acme/api

go 1.24

require github.com/gin-gonic/gin v1.11.0
`,
      "go.sum": ""
    });

    const result = await detectGoProject(root);
    const context = createProjectContext(result);

    expect(result.targets[0]?.ecosystem.id).toBe(ecosystems.go);
    expect(result.targets[0]?.languages).toEqual([languages.go]);
    expect(result.targets[0]?.frameworks[0]).toMatchObject({
      id: frameworks.gin,
      version: "v1.11.0",
      confidence: "high"
    });
    expect(result.targets[0]?.packageManagers[0]?.id).toBe(packageManagers.go);
    expect(context.projectType).toEqual({
      id: projectTypes.backend,
      confidence: "high"
    });
  });

  it("routes generic detection through the six ecosystem adapters", async () => {
    const root = await createTempProject({
      "go.mod": `module github.com/acme/api
go 1.24
`
    });

    const result = await detectProject(root);

    expect(ecosystemAdapters.map((adapter) => adapter.id)).toEqual([
      ecosystems.node,
      ecosystems.python,
      ecosystems.php,
      ecosystems.dart,
      ecosystems.rust,
      ecosystems.go
    ]);
    expect(result.targets[0]?.ecosystem.id).toBe(ecosystems.go);
  });

  it("keeps full context candidates while preserving primary framework fields", async () => {
    const root = await createTempProject({
      "package.json": JSON.stringify({
        name: "next-app",
        packageManager: "pnpm@11.24.0",
        dependencies: {
          next: "16.0.0",
          react: "20.0.0"
        }
      }),
      "pnpm-lock.yaml": ""
    });

    const context = createProjectContext(await detectNodeProject(root));

    expect(context.framework?.id).toBe(frameworks.nextjs);
    expect(context.frameworks?.map((framework) => framework.id)).toEqual([
      frameworks.nextjs,
      frameworks.react
    ]);
    expect(context.packageManager?.id).toBe(packageManagers.pnpm);
    expect(context.packageManagers?.[0]?.confidence).toBe("high");
    expect(context.projectType).toEqual({
      id: projectTypes.fullstack,
      confidence: "high"
    });
  });

  it("detects Rust web frameworks and CLI project type from native Cargo concepts", async () => {
    const axumRoot = await createTempProject({
      "Cargo.toml": `[package]
name = "avis-api"
version = "0.1.0"

[dependencies]
axum = "0.8"
`
    });
    const cliRoot = await createTempProject({
      "Cargo.toml": `[package]
name = "avis-cli"
version = "0.1.0"

[dependencies]
clap = "4"
`
    });

    expect((await detectRustProject(axumRoot)).targets[0]?.frameworks[0]?.id).toBe(
      frameworks.axum
    );
    expect((await detectRustProject(axumRoot)).targets[0]?.projectTypes[0]?.id).toBe(
      projectTypes.backend
    );
    expect((await detectRustProject(cliRoot)).targets[0]?.projectTypes[0]?.id).toBe(
      projectTypes.cli
    );
  });

  it("exposes support tiers and relevant capabilities for detected frameworks", async () => {
    const context = createProjectContext(
      await detectGoProject(
        await createTempProject({
          "go.mod": `module github.com/acme/api

go 1.24

require github.com/gin-gonic/gin v1.11.0
`
        })
      )
    );

    expect(getFrameworkSupportTier(frameworks.nextjs)).toBe("tier-1");
    expect(getFrameworkSupportTier(frameworks.gin)).toBe("tier-2");
    expect(findFrameworkDefinition(frameworks.flutter)?.defaultProjectType).toBe(
      projectTypes.mobile
    );
    expect(getRelevantCapabilitiesForContext(context)).toContain("api");
    expect(getRelevantCapabilitiesForContext(context)).toContain("auth");
  });
});

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-v3-"));

  await Promise.all(
    Object.entries(files).map(([filename, contents]) =>
      writeFile(path.join(root, filename), contents)
    )
  );

  return root;
}
