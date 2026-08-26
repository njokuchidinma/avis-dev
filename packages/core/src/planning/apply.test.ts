import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyChangePlan } from "./apply.js";
import type { ChangePlan } from "./change-plan.js";

describe("applyChangePlan", () => {
  it("creates files inside the target root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-apply-"));
    const result = await applyChangePlan({
      ...basePlan(root),
      operations: [
        {
          id: "create-store",
          type: "file.create",
          description: "Create store.",
          path: "src/stores/index.ts",
          contents: "export const value = 1;\n",
          overwrite: "never"
        }
      ]
    });

    await expect(readFile(path.join(root, "src/stores/index.ts"), "utf8")).resolves.toBe(
      "export const value = 1;\n"
    );
    expect(result.applied[0]?.skipped).toBe(false);
  });

  it("runs dependency add operations through the command runner", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-apply-"));
    const commands: string[] = [];

    await applyChangePlan(
      {
        ...basePlan(root),
        operations: [
          {
            id: "add-zustand",
            type: "dependency.add",
            description: "Install Zustand.",
            packages: [{ name: "zustand" }],
            dependencyType: "runtime"
          }
        ]
      },
      {
        commandRunner: async (command) => {
          commands.push(`${command.command} ${command.args.join(" ")}`);
        }
      }
    );

    expect(commands).toEqual(["pnpm add zustand"]);
  });

  it("merges json objects deeply", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-apply-"));
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ scripts: { test: "vitest" } }, null, 2)
    );

    await applyChangePlan({
      ...basePlan(root),
      operations: [
        {
          id: "merge-json",
          type: "json.merge",
          description: "Merge package json.",
          path: "package.json",
          value: {
            scripts: {
              build: "tsc"
            }
          }
        }
      ]
    });

    await expect(readFile(path.join(root, "package.json"), "utf8")).resolves.toContain(
      "\"build\": \"tsc\""
    );
    await expect(readFile(path.join(root, "package.json"), "utf8")).resolves.toContain(
      "\"test\": \"vitest\""
    );
  });
});

function basePlan(root: string): ChangePlan {
  return {
    id: "test-plan",
    title: "Test plan",
    integrationId: "test",
    target: {
      workspaceRoot: root,
      targetRoot: root,
      targetId: "test",
      ecosystem: "node",
      languages: ["typescript"],
      framework: {
        id: "nextjs"
      },
      packageManager: {
        id: "pnpm"
      }
    },
    operations: [],
    diagnostics: []
  };
}
