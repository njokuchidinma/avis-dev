import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectContext, detectNodeProject } from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { zustandIntegration } from "./zustand.js";

describe("zustandIntegration", () => {
  it("plans dependency and starter store changes for a Next.js project", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "16.0.0"
      },
      devDependencies: {
        typescript: "7.0.0"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zustandIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-zustand",
      "create-zustand-store"
    ]);
  });

  it("does not duplicate dependency or store operations", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "16.0.0",
        zustand: "5.0.0"
      },
      devDependencies: {
        typescript: "7.0.0"
      }
    });
    await mkdir(path.join(root, "src/stores"), { recursive: true });
    await writeFile(path.join(root, "src/stores/index.ts"), "");

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zustandIntegration.plan({ context });

    expect(plan.operations).toEqual([]);
  });

  it("reports not-installed before Avis applies the integration", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "16.0.0"
      },
      devDependencies: {
        typescript: "7.0.0"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const verification = await zustandIntegration.verify?.(context);

    expect(verification?.health).toBe("not-installed");
    expect(verification?.checks.map((check) => check.status)).toEqual([
      "skipped",
      "skipped"
    ]);
  });

  it("can apply file changes and verify the local setup", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "16.0.0",
        zustand: "5.0.0"
      },
      devDependencies: {
        typescript: "7.0.0"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zustandIntegration.plan({ context });

    await applyChangePlan(plan);

    const secondPlan = await zustandIntegration.plan({ context });
    const verification = await zustandIntegration.verify?.(context);

    expect(secondPlan.operations).toEqual([]);
    expect(verification?.health).toBe("healthy");
  });
});

async function createNextProject(packageJson: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-zustand-"));
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify(
      {
        name: "next-app",
        packageManager: "pnpm@11.24.0",
        ...packageJson
      },
      null,
      2
    )
  );
  await writeFile(path.join(root, "pnpm-lock.yaml"), "");
  return root;
}
