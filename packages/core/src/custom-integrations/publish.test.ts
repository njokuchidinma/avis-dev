import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  inspectPackagedIntegration,
  installPackagedIntegration,
  packageLocalIntegration,
  packagedIntegrationExtension
} from "./publish.js";
import {
  loadLocalIntegrations,
  localIntegrationManifestFile,
  localIntegrationPlanFile,
  localIntegrationRegistryPath,
  localIntegrationVerifyFile
} from "./local.js";

describe("custom integration publishing", () => {
  it("packages a local integration with community trust and integrity metadata", async () => {
    const root = await createPublishableIntegration();

    const result = await packageLocalIntegration(root, "./company-auth", {
      packagedAt: "2026-09-02T00:00:00.000Z"
    });

    expect(result.packagePath).toBe(
      `.avis/packages/company-auth-0.1.0${packagedIntegrationExtension}`
    );
    expect(result.packagedIntegration).toMatchObject({
      format: "avis.integration.package.v1",
      manifest: {
        id: "company-auth",
        trust: "community",
        source: {
          owner: "community"
        }
      },
      integrity: {
        algorithm: "sha256"
      },
      securityReview: {
        passed: true
      }
    });
    expect(result.packagedIntegration.integrity.digest).toHaveLength(64);
  });

  it("reports tampered package contents during inspection", async () => {
    const root = await createPublishableIntegration();
    const result = await packageLocalIntegration(root, "./company-auth", {
      packagedAt: "2026-09-02T00:00:00.000Z"
    });
    const packagePath = path.join(root, result.packagePath);
    const packaged = JSON.parse(await readFile(packagePath, "utf8")) as {
      files: {
        plan: {
          contents: string;
        };
      };
    };
    packaged.files.plan.contents = packaged.files.plan.contents.replace(
      "company-auth.ts",
      "tampered.ts"
    );
    await writeFile(packagePath, `${JSON.stringify(packaged, null, 2)}\n`);

    const inspected = await inspectPackagedIntegration(root, result.packagePath);

    expect(inspected.securityReview.passed).toBe(false);
    expect(inspected.securityReview.findings.map((finding) => finding.message)).toContain(
      "Package integrity digest does not match package contents."
    );
  });

  it("installs a packaged integration into the project local registry", async () => {
    const root = await createPublishableIntegration();
    const result = await packageLocalIntegration(root, "./company-auth", {
      packagedAt: "2026-09-02T00:00:00.000Z"
    });

    const installPath = await installPackagedIntegration(root, result.packagePath);
    const registry = JSON.parse(
      await readFile(path.join(root, localIntegrationRegistryPath), "utf8")
    ) as {
      integrations: Array<{ path: string }>;
    };
    const loaded = await loadLocalIntegrations(root);

    expect(installPath).toBe(".avis/packaged-integrations/company-auth");
    expect(registry.integrations.map((entry) => entry.path)).toContain(
      ".avis/packaged-integrations/company-auth"
    );
    expect(loaded.integrations[0]?.manifest).toMatchObject({
      id: "company-auth",
      trust: "local"
    });
  });

  it("refuses to package unsafe ChangePlan paths", async () => {
    const root = await createPublishableIntegration({
      planPath: "../escape.ts"
    });

    await expect(packageLocalIntegration(root, "./company-auth")).rejects.toThrow(
      "Integration package failed security review."
    );
  });
});

async function createPublishableIntegration(
  options: {
    planPath?: string;
  } = {}
): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-publish-"));
  const integrationRoot = path.join(root, "company-auth");
  await mkdir(integrationRoot, { recursive: true });
  await writeFile(
    path.join(integrationRoot, localIntegrationManifestFile),
    `${JSON.stringify(
      {
        id: "company-auth",
        name: "Company Auth",
        description: "Internal auth package.",
        capability: "auth",
        version: "0.1.0",
        status: "experimental",
        trust: "local",
        supports: {
          ecosystems: ["node"],
          frameworks: ["nextjs"],
          packageManagers: ["pnpm"]
        },
        source: {
          owner: "local"
        }
      },
      null,
      2
    )}\n`
  );
  await writeFile(
    path.join(integrationRoot, localIntegrationPlanFile),
    `${JSON.stringify(
      {
        title: "Add Company Auth",
        operations: [
          {
            id: "create-company-auth",
            type: "file.create",
            description: "Create company auth config.",
            path: options.planPath ?? "src/company-auth.ts",
            contents: "export const auth = true;\n",
            overwrite: "never"
          }
        ]
      },
      null,
      2
    )}\n`
  );
  await writeFile(
    path.join(integrationRoot, localIntegrationVerifyFile),
    `${JSON.stringify(
      {
        health: "unknown",
        checks: [
          {
            id: "company-auth-check",
            label: "company auth",
            status: "skipped"
          }
        ]
      },
      null,
      2
    )}\n`
  );

  return root;
}
