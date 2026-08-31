import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AvisIntegration } from "../integrations/types.js";
import type { ChangePlan } from "../planning/change-plan.js";
import {
  readAvisProjectState,
  recordAppliedIntegrationPlan
} from "./project-state.js";

describe("Avis project state", () => {
  it("returns empty state when .avis/state.json does not exist", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-state-"));

    await expect(readAvisProjectState(root)).resolves.toEqual({
      schemaVersion: 1,
      integrations: {}
    });
  });

  it("records applied integration files and dependencies", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-state-"));
    await writeFile(path.join(root, "provider.tsx"), "export const Provider = null;\n");

    const state = await recordAppliedIntegrationPlan(plan(root), integration);

    expect(state.integrations["tanstack-query"]).toMatchObject({
      integrationVersion: "1.0.0",
      files: [
        {
          path: "provider.tsx",
          createdByAvis: true,
          modifiedByAvis: false,
          lastOperationId: "create-provider"
        }
      ],
      dependencies: [
        {
          name: "@tanstack/react-query",
          packageManager: "pnpm",
          dependencyType: "runtime",
          lastOperationId: "add-query"
        }
      ]
    });

    const written = JSON.parse(
      await readFile(path.join(root, ".avis/state.json"), "utf8")
    ) as unknown;
    expect(written).toMatchObject(state);
  });
});

function plan(root: string): ChangePlan {
  return {
    id: "tanstack-query",
    title: "Add TanStack Query",
    integrationId: "tanstack-query",
    target: {
      workspaceRoot: root,
      targetRoot: root,
      targetId: "test",
      ecosystem: "node",
      languages: ["typescript"],
      packageManager: {
        id: "pnpm"
      }
    },
    operations: [
      {
        id: "add-query",
        type: "dependency.add",
        description: "Install query.",
        dependencyType: "runtime",
        packageManager: "pnpm",
        packages: [{ name: "@tanstack/react-query" }]
      },
      {
        id: "create-provider",
        type: "file.create",
        description: "Create provider.",
        path: "provider.tsx",
        contents: "export const Provider = null;\n",
        overwrite: "never"
      }
    ],
    diagnostics: []
  };
}

const integration: AvisIntegration = {
  manifest: {
    id: "tanstack-query",
    name: "TanStack Query",
    description: "Query.",
    capability: "data-fetching",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: ["node"]
    }
  },
  isCompatible: () => ({ supported: true }),
  plan: async () => plan("/tmp/avis")
};
