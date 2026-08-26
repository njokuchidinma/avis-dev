import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectNodeFrameworks,
  detectNodePackageManagers,
  detectNodeProject,
  detectProject
} from "./node.js";
import { frameworks, languages, packageManagers } from "../types/ids.js";

describe("detectNodeProject", () => {
  it("detects a pnpm Next.js TypeScript project", async () => {
    const root = await createTempProject({
      "package.json": JSON.stringify(
        {
          name: "next-app",
          packageManager: "pnpm@11.24.0",
          dependencies: {
            next: "16.0.0",
            react: "20.0.0"
          },
          devDependencies: {
            typescript: "7.0.0"
          }
        },
        null,
        2
      ),
      "pnpm-lock.yaml": ""
    });

    const result = await detectNodeProject(root);

    expect(result.targets).toHaveLength(1);
    expect(result.targets[0]?.ecosystem.id).toBe("node");
    expect(result.targets[0]?.languages).toEqual([languages.typescript]);
    expect(result.targets[0]?.frameworks[0]?.id).toBe(frameworks.nextjs);
    expect(result.targets[0]?.frameworks[0]?.version).toBe("16.0.0");
    expect(result.targets[0]?.packageManagers[0]?.id).toBe(packageManagers.pnpm);
    expect(result.targets[0]?.packageManagers[0]?.version).toBe("11.24.0");
  });

  it("returns no targets when package.json is missing", async () => {
    const root = await createTempProject({});

    const result = await detectProject(root);

    expect(result.targets).toEqual([]);
    expect(result.diagnostics[0]?.message).toContain("No package.json");
  });
});

describe("detectNodePackageManagers", () => {
  it("combines packageManager and lockfile evidence for the same manager", async () => {
    const root = await createTempProject({
      "pnpm-lock.yaml": ""
    });

    const matches = await detectNodePackageManagers(root, {
      packageManager: "pnpm@11.24.0"
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.id).toBe(packageManagers.pnpm);
    expect(matches[0]?.evidence).toHaveLength(2);
  });

  it("detects multiple lockfiles as separate package manager candidates", async () => {
    const root = await createTempProject({
      "pnpm-lock.yaml": "",
      "yarn.lock": ""
    });

    const matches = await detectNodePackageManagers(root, {});

    expect(matches.map((match) => match.id).sort()).toEqual([
      packageManagers.pnpm,
      packageManagers.yarn
    ]);
  });
});

describe("detectNodeFrameworks", () => {
  it("detects Next.js from a config file when dependency metadata is unavailable", async () => {
    const root = await createTempProject({
      "next.config.mjs": "export default {};"
    });

    const matches = await detectNodeFrameworks(root, {});

    expect(matches[0]?.id).toBe(frameworks.nextjs);
    expect(matches[0]?.confidence).toBe("medium");
  });
});

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-core-"));

  await Promise.all(
    Object.entries(files).map(([filename, contents]) =>
      writeFile(path.join(root, filename), contents)
    )
  );

  return root;
}
