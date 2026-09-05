import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import { validateChangePlan } from "../planning/validation.js";
import {
  loadLocalIntegrations,
  localIntegrationManifestFile,
  localIntegrationPlanFile,
  localIntegrationRegistryPath,
  registerLocalIntegration
} from "./local.js";

describe("local custom integrations", () => {
  it("registers and loads local integrations with local trust", async () => {
    const root = await createProjectWithLocalIntegration("company-auth", {
      plan: {
        title: "Add Company Auth",
        operations: [
          {
            id: "create-company-auth",
            type: "file.create",
            description: "Create company auth config.",
            path: "src/company-auth.ts",
            contents: "export const auth = true;\n",
            overwrite: "never"
          }
        ]
      }
    });

    await registerLocalIntegration(root, "./company-auth", "2026-09-02T00:00:00.000Z");
    const registry = JSON.parse(
      await readFile(path.join(root, localIntegrationRegistryPath), "utf8")
    ) as unknown;
    const local = await loadLocalIntegrations(root);
    const integration = local.integrations[0];
    const plan = await integration?.plan({ context: nextContext(root) });

    expect(registry).toMatchObject({
      schemaVersion: 1,
      integrations: [
        {
          path: "company-auth",
          addedAt: "2026-09-02T00:00:00.000Z"
        }
      ]
    });
    expect(integration?.manifest).toMatchObject({
      id: "company-auth",
      trust: "local",
      source: {
        owner: "local"
      }
    });
    expect(integration?.isCompatible(nextContext(root))).toEqual({ supported: true });
    expect(plan?.operations[0]).toMatchObject({
      id: "create-company-auth",
      path: "src/company-auth.ts"
    });
  });

  it("rejects local integration paths outside the project root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-local-project-"));

    await expect(registerLocalIntegration(root, "../outside")).rejects.toThrow(
      "Path must be relative"
    );
  });

  it("returns plan diagnostics for unsafe local integration operations", async () => {
    const root = await createProjectWithLocalIntegration("unsafe-auth", {
      plan: {
        operations: [
          {
            id: "unsafe-file",
            type: "file.create",
            description: "Create unsafe file.",
            path: "../escape.ts",
            contents: "",
            overwrite: "never"
          }
        ]
      }
    });

    await registerLocalIntegration(root, "./unsafe-auth");
    const local = await loadLocalIntegrations(root);
    const plan = await local.integrations[0]?.plan({ context: nextContext(root) });
    const validation = plan ? validateChangePlan(plan) : undefined;

    expect(validation?.diagnostics.map((diagnostic) => diagnostic.message)).toContain(
      "Operation unsafe-file uses an unsafe path: ../escape.ts."
    );
  });
});

async function createProjectWithLocalIntegration(
  integrationId: string,
  options: {
    plan: Record<string, unknown>;
  }
): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-local-integration-"));
  const integrationRoot = path.join(root, integrationId);
  await mkdir(integrationRoot, { recursive: true });
  await writeFile(
    path.join(integrationRoot, localIntegrationManifestFile),
    `${JSON.stringify({
      id: integrationId,
      name: "Company Auth",
      description: "Company authentication integration.",
      capability: "auth",
      version: "0.1.0",
      status: "experimental",
      trust: "official",
      supports: {
        ecosystems: [ecosystems.node],
        frameworks: [frameworks.nextjs],
        packageManagers: [packageManagers.pnpm]
      }
    })}\n`
  );
  await writeFile(
    path.join(integrationRoot, localIntegrationPlanFile),
    `${JSON.stringify(options.plan)}\n`
  );

  return root;
}

function nextContext(root: string): ProjectContext {
  return {
    workspaceRoot: root,
    targetRoot: root,
    targetId: "next-app",
    ecosystem: ecosystems.node,
    languages: ["typescript"],
    framework: {
      id: frameworks.nextjs
    },
    frameworks: [
      {
        id: frameworks.nextjs,
        confidence: "high"
      }
    ],
    packageManager: {
      id: packageManagers.pnpm
    },
    packageManagers: [
      {
        id: packageManagers.pnpm,
        confidence: "high"
      }
    ]
  };
}
