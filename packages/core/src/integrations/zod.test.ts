import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectContext, detectNodeProject } from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { zodIntegration } from "./zod.js";

describe("zodIntegration", () => {
  it("plans dependency and schema changes for a Next.js project", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "14.2.0"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zodIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-zod",
      "create-zod-schema"
    ]);
  });

  it("does not duplicate dependency or schema operations", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "14.2.0",
        zod: "4.0.0"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });
    await mkdir(path.join(root, "src/schemas"), { recursive: true });
    await writeFile(path.join(root, "src/schemas/index.ts"), "");

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zodIntegration.plan({ context });

    expect(plan.operations).toEqual([]);
  });

  it("can apply file changes and verify the local setup", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "14.2.0",
        zod: "4.0.0"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zodIntegration.plan({ context });

    await applyChangePlan(plan);

    const secondPlan = await zodIntegration.plan({ context });
    const verification = await zodIntegration.verify?.(context);

    expect(secondPlan.operations).toEqual([]);
    expect(verification?.health).toBe("healthy");
  });
});

async function createNextProject(packageJson: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-zod-"));
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
