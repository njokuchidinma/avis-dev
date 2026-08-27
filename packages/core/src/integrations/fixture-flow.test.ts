import { cp, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createProjectContext,
  detectNodeProject,
  detectProject
} from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { djangoRestFrameworkIntegration } from "./django-rest-framework.js";
import { reactHookFormIntegration } from "./react-hook-form.js";
import { tanstackQueryIntegration } from "./tanstack-query.js";
import type { AvisIntegration } from "./types.js";
import { zodIntegration } from "./zod.js";
import { zustandIntegration } from "./zustand.js";

describe("integration fixture flows", () => {
  it("plans dependency and configuration changes for a clean Next.js fixture", async () => {
    const root = await copyFixture("next-clean");
    const context = createProjectContext(await detectNodeProject(root));
    const plan = await zustandIntegration.plan({ context });
    const verification = await zustandIntegration.verify?.(context);

    expect(verification?.health).toBe("not-installed");
    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-zustand",
      "create-zustand-store"
    ]);
  });

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

  it("recognizes a complete Zustand fixture as healthy and idempotent", async () => {
    await expectCompleteNodeFixture("next-zustand-complete", zustandIntegration);
  });

  it("repairs a partial Zod fixture and stays idempotent", async () => {
    await expectRepairableNodeFixture("next-zod-partial", zodIntegration, [
      "create-zod-schema"
    ]);
  });

  it("recognizes a complete Zod fixture as healthy and idempotent", async () => {
    await expectCompleteNodeFixture("next-zod-complete", zodIntegration);
  });

  it("repairs a partial React Hook Form fixture and stays idempotent", async () => {
    await expectRepairableNodeFixture(
      "next-react-hook-form-partial",
      reactHookFormIntegration,
      ["create-example-form"]
    );
  });

  it("recognizes a complete React Hook Form fixture as healthy and idempotent", async () => {
    await expectCompleteNodeFixture(
      "next-react-hook-form-complete",
      reactHookFormIntegration
    );
  });

  it("repairs a partial Django REST Framework fixture and stays idempotent", async () => {
    const root = await copyFixture("django-drf-partial");
    const context = createProjectContext(await detectProject(root));
    const initialVerification = await djangoRestFrameworkIntegration.verify?.(context);
    const repairPlan = await djangoRestFrameworkIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "configure-drf-installed-app"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await djangoRestFrameworkIntegration.verify?.(context);
    const secondPlan = await djangoRestFrameworkIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(secondPlan.operations).toEqual([]);
  });

  it("recognizes a complete Django REST Framework fixture as healthy and idempotent", async () => {
    const root = await copyFixture("django-drf-complete");
    const context = createProjectContext(await detectProject(root));
    const verification = await djangoRestFrameworkIntegration.verify?.(context);
    const plan = await djangoRestFrameworkIntegration.plan({ context });

    expect(verification?.health).toBe("healthy");
    expect(plan.operations).toEqual([]);
  });
});

async function expectRepairableNodeFixture(
  fixtureName: string,
  integration: AvisIntegration,
  expectedOperationIds: string[]
): Promise<void> {
  const root = await copyFixture(fixtureName);
  const context = createProjectContext(await detectNodeProject(root));
  const initialVerification = await integration.verify?.(context);
  const repairPlan = await integration.plan({ context });

  expect(initialVerification?.health).toBe("partial");
  expect(repairPlan.operations.map((operation) => operation.id)).toEqual(
    expectedOperationIds
  );

  await applyChangePlan(repairPlan);

  const repairedVerification = await integration.verify?.(context);
  const secondPlan = await integration.plan({ context });

  expect(repairedVerification?.health).toBe("healthy");
  expect(secondPlan.operations).toEqual([]);
}

async function expectCompleteNodeFixture(
  fixtureName: string,
  integration: AvisIntegration
): Promise<void> {
  const root = await copyFixture(fixtureName);
  const context = createProjectContext(await detectNodeProject(root));
  const verification = await integration.verify?.(context);
  const plan = await integration.plan({ context });

  expect(verification?.health).toBe("healthy");
  expect(plan.operations).toEqual([]);
}

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
