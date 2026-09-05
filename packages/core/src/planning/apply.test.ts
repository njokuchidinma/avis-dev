import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ApplyChangePlanError, applyChangePlan } from "./apply.js";
import type { ChangePlan } from "./change-plan.js";
import type { PackageManagerAdapter, PackageManagerCommand } from "../package-managers/types.js";

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
    await writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: {} }));
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

  it("rolls back file changes when a later operation fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-apply-"));
    await writeFile(path.join(root, "settings.json"), JSON.stringify({ existing: true }));

    await expect(
      applyChangePlan({
        ...basePlan(root),
        operations: [
          {
            id: "create-generated",
            type: "file.create",
            description: "Create generated file.",
            path: "src/generated.ts",
            contents: "export const generated = true;\n",
            overwrite: "never"
          },
          {
            id: "merge-settings",
            type: "json.merge",
            description: "Merge settings.",
            path: "settings.json",
            value: {
              avis: true
            }
          },
          {
            id: "missing-patch",
            type: "text.patch",
            description: "Patch missing marker.",
            path: "settings.json",
            search: "not-present",
            replace: "present"
          }
        ]
      })
    ).rejects.toThrow(ApplyChangePlanError);

    await expect(access(path.join(root, "src/generated.ts"))).rejects.toThrow();
    await expect(readFile(path.join(root, "settings.json"), "utf8")).resolves.toBe(
      JSON.stringify({ existing: true })
    );
  });

  it("rolls back dependencies added by Avis when a later operation fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-apply-"));
    const installedDependencies = new Set<string>();
    const commands: string[] = [];
    const adapter: PackageManagerAdapter = {
      id: "pnpm",
      ecosystem: "node",
      detect: async () => undefined,
      isDependencyInstalled: async (_context, packageName) =>
        installedDependencies.has(packageName),
      buildAddCommand: (context, request): PackageManagerCommand => ({
        command: "pnpm",
        args: ["add", ...request.packages.map((packageSpec) => packageSpec.name)],
        cwd: context.targetRoot
      }),
      buildRemoveCommand: (context, request): PackageManagerCommand => ({
        command: "pnpm",
        args: ["remove", ...request.packages],
        cwd: context.targetRoot
      })
    };

    await expect(
      applyChangePlan(
        {
          ...basePlan(root),
          operations: [
            {
              id: "add-zustand",
              type: "dependency.add",
              description: "Install Zustand.",
              packages: [{ name: "zustand" }],
              dependencyType: "runtime"
            },
            {
              id: "missing-patch",
              type: "text.patch",
              description: "Patch missing file.",
              path: "missing.ts",
              search: "from",
              replace: "to"
            }
          ]
        },
        {
          packageManagerAdapters: [adapter],
          commandRunner: async (command) => {
            commands.push(`${command.command} ${command.args.join(" ")}`);
            if (command.args[0] === "add") {
              installedDependencies.add(command.args[1] ?? "");
            }
            if (command.args[0] === "remove") {
              installedDependencies.delete(command.args[1] ?? "");
            }
          }
        }
      )
    ).rejects.toThrow(ApplyChangePlanError);

    expect(commands).toEqual(["pnpm add zustand", "pnpm remove zustand"]);
    expect(installedDependencies.has("zustand")).toBe(false);
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
