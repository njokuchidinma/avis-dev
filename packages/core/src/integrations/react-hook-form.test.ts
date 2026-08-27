import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectContext, detectNodeProject } from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { reactHookFormIntegration } from "./react-hook-form.js";

describe("reactHookFormIntegration", () => {
  it("plans dependency and component changes for a Next.js project", async () => {
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
    const plan = await reactHookFormIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-react-hook-form",
      "create-example-form"
    ]);
  });

  it("does not duplicate dependency or component operations", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "14.2.0",
        react: "18.3.1",
        "react-hook-form": "7.0.0"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });
    await mkdir(path.join(root, "src/components"), { recursive: true });
    await writeFile(path.join(root, "src/components/example-form.tsx"), "");

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await reactHookFormIntegration.plan({ context });

    expect(plan.operations).toEqual([]);
  });

  it("can apply file changes and verify the local setup", async () => {
    const root = await createNextProject({
      dependencies: {
        next: "14.2.0",
        react: "18.3.1",
        "react-hook-form": "7.0.0"
      },
      devDependencies: {
        typescript: "5.4.5"
      }
    });

    const context = createProjectContext(await detectNodeProject(root));
    const plan = await reactHookFormIntegration.plan({ context });

    await applyChangePlan(plan);

    const secondPlan = await reactHookFormIntegration.plan({ context });
    const verification = await reactHookFormIntegration.verify?.(context);

    expect(secondPlan.operations).toEqual([]);
    expect(verification?.health).toBe("healthy");
  });
});

async function createNextProject(packageJson: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-rhf-"));
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
