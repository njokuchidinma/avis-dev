import { cp, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createProjectContext, detectNodeProject } from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { tanstackQueryIntegration } from "./tanstack-query.js";

describe("integration fixture flows", () => {
  it("repairs a partial TanStack Query fixture and stays idempotent", async () => {
    const root = await copyFixture("next-query-partial");
    const context = createProjectContext(await detectNodeProject(root));
    const initialVerification = await tanstackQueryIntegration.verify?.(context);
    const repairPlan = await tanstackQueryIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "create-query-provider"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await tanstackQueryIntegration.verify?.(context);
    const secondPlan = await tanstackQueryIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(secondPlan.operations).toEqual([]);
  });
});

async function copyFixture(name: string): Promise<string> {
  const source = path.join(fixturesRoot, name);
  const target = await mkdtemp(path.join(os.tmpdir(), `avis-fixture-${name}-`));

  await cp(source, target, { recursive: true });

  return target;
}

const thisFile = fileURLToPath(import.meta.url);
const fixturesRoot = path.resolve(
  path.dirname(thisFile),
  "../../test/fixtures"
);
