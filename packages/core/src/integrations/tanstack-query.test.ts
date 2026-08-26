import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectContext, detectNodeProject } from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { tanstackQueryIntegration } from "./tanstack-query.js";

describe("tanstackQueryIntegration", () => {
  it("plans dependency and provider changes for a Next.js project", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "14.2.0",
        react: "18.3.1"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await tanstackQueryIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-tanstack-query",
      "create-query-provider"
    ]);
  });

  it("does not duplicate dependency or provider operations", async () => {
    const root = await createNextProject({
      dependencies: {
        "@tanstack/react-query": "5.0.0",
        next: "14.2.0",
        react: "18.3.1"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });
    await writeFile(path.join(root, "src/app/providers.tsx"), "");

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await tanstackQueryIntegration.plan({ context });

    expect(plan.operations).toEqual([]);
  });

  it("can apply file changes and verify the local setup", async () => {
    const root = await createNextProject({
      dependencies: {
        "@tanstack/react-query": "5.0.0",
        next: "14.2.0",
        react: "18.3.1"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await tanstackQueryIntegration.plan({ context });

    await applyChangePlan(plan);

    const secondPlan = await tanstackQueryIntegration.plan({ context });
    const verification = await tanstackQueryIntegration.verify?.(context);

    expect(secondPlan.operations).toEqual([]);
    expect(verification?.status).toBe("pass");
  });
});

async function createNextProject(packageJson: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-query-"));
  await mkdir(path.join(root, "src/app"), { recursive: true });
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
