import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createProjectContext,
  detectProject
} from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import type { ProjectContext } from "../types/project-context.js";
import { djangoCorsHeadersIntegration } from "./django-cors-headers.js";
import { djangoRestFrameworkIntegration } from "./django-rest-framework.js";
import { builtInIntegrations } from "./catalog.js";
import { nextAuthIntegration } from "./next-auth.js";
import type { AvisIntegration } from "./types.js";

describe("V3.1 release fixture QA", () => {
  it("proves the Next.js Auth.js src/app add, verify, idempotence, break, and re-plan lifecycle", async () => {
    const root = await copyFixture("release-next-auth-src-app");
    const context = createProjectContext(await detectProject(root));

    expect(context.framework?.id).toBe("nextjs");
    expect(context.packageManager?.id).toBe("pnpm");

    const initialVerification = await nextAuthIntegration.verify?.(context);
    const initialPlan = await nextAuthIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(initialPlan.operations.map((operation) => operation.id)).toEqual([
      "create-next-auth-config",
      "create-next-auth-route",
      "document-auth-secret"
    ]);

    await applyChangePlan(initialPlan);

    const routePath = "src/app/api/auth/[...nextauth]/route.ts";
    await expect(readFixtureFile(root, routePath)).resolves.toContain(
      'from "../../../../auth"'
    );
    await expect(readFixtureFile(root, ".env.local.example")).resolves.toContain(
      "AUTH_SECRET="
    );

    const healthyVerification = await nextAuthIntegration.verify?.(context);
    const idempotentPlan = await nextAuthIntegration.plan({ context });

    expect(healthyVerification?.health).toBe("healthy");
    expect(idempotentPlan.operations).toEqual([]);
    expect(
      await getDoctorHealth(context, nextAuthIntegration.manifest.id)
    ).toBe("healthy");

    await rm(path.join(root, routePath));

    const brokenVerification = await nextAuthIntegration.verify?.(context);
    const repairPlan = await nextAuthIntegration.plan({ context });

    expect(brokenVerification?.health).toBe("partial");
    expect(await getDoctorHealth(context, nextAuthIntegration.manifest.id)).toBe(
      "partial"
    );
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "create-next-auth-route"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await nextAuthIntegration.verify?.(context);
    const repairedPlan = await nextAuthIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(repairedPlan.operations).toEqual([]);
  });

  it("proves the Django managed integrations detect, verify, repair, and stay idempotent", async () => {
    const root = await copyFixture("release-django-managed");
    const context = createProjectContext(await detectProject(root));
    const managedIntegrations = [
      djangoRestFrameworkIntegration,
      djangoCorsHeadersIntegration
    ];

    expect(context.framework?.id).toBe("django");
    expect(context.packageManager?.id).toBe("pip");
    expect(
      managedIntegrations.map((integration) => integration.manifest.setupMaturity)
    ).toEqual(["managed", "managed"]);

    await expectIntegrationHealth(context, managedIntegrations, "partial");

    for (const integration of managedIntegrations) {
      await applyChangePlan(await integration.plan({ context }));
    }

    await expect(readFixtureFile(root, "config/settings.py")).resolves.toContain(
      '"rest_framework"'
    );
    await expect(readFixtureFile(root, "config/settings.py")).resolves.toContain(
      '"corsheaders"'
    );
    await expect(readFixtureFile(root, "config/settings.py")).resolves.toContain(
      '"corsheaders.middleware.CorsMiddleware"'
    );
    await expectIntegrationHealth(context, managedIntegrations, "healthy");
    await expectIdempotentPlans(context, managedIntegrations);

    await writeFile(
      path.join(root, "config/settings.py"),
      createBareDjangoSettings(),
      "utf8"
    );

    await expectIntegrationHealth(context, managedIntegrations, "partial");
    expect(await getDoctorHealth(context, "django-rest-framework")).toBe("partial");
    expect(await getDoctorHealth(context, "django-cors-headers")).toBe("partial");

    expect(
      (await djangoRestFrameworkIntegration.plan({ context })).operations.map(
        (operation) => operation.id
      )
    ).toEqual(["configure-drf-installed-app"]);
    expect(
      (await djangoCorsHeadersIntegration.plan({ context })).operations.map(
        (operation) => operation.id
      )
    ).toEqual([
      "configure-cors-installed-app",
      "configure-cors-middleware"
    ]);

    for (const integration of managedIntegrations) {
      await applyChangePlan(await integration.plan({ context }));
    }

    await expectIntegrationHealth(context, managedIntegrations, "healthy");
    await expectIdempotentPlans(context, managedIntegrations);
  });
});

async function expectIntegrationHealth(
  context: ProjectContext,
  integrations: AvisIntegration[],
  expectedHealth: "partial" | "healthy"
): Promise<void> {
  for (const integration of integrations) {
    const verification = await integration.verify?.(context);
    expect(verification?.health, integration.manifest.id).toBe(expectedHealth);
  }
}

async function expectIdempotentPlans(
  context: ProjectContext,
  integrations: AvisIntegration[]
): Promise<void> {
  for (const integration of integrations) {
    const plan = await integration.plan({ context });
    expect(plan.operations, integration.manifest.id).toEqual([]);
  }
}

async function getDoctorHealth(
  context: ProjectContext,
  integrationId: string
): Promise<string | undefined> {
  const integration = builtInIntegrations.find(
    (candidate) => candidate.manifest.id === integrationId
  );
  if (!integration?.isCompatible(context).supported || !integration.verify) {
    return undefined;
  }

  return (await integration.verify(context)).health;
}

async function copyFixture(name: string): Promise<string> {
  const source = path.join(fixturesRoot, name);
  const target = await mkdtemp(path.join(os.tmpdir(), `avis-release-fixture-${name}-`));

  await cp(source, target, { recursive: true });

  return target;
}

function readFixtureFile(root: string, relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

function createBareDjangoSettings(): string {
  return `INSTALLED_APPS = [
    "django.contrib.admin",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
]
`;
}

const thisFile = fileURLToPath(import.meta.url);
const fixturesRoot = path.resolve(
  path.dirname(thisFile),
  "../../test/fixtures"
);
