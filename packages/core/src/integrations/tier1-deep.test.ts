import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createProjectContext,
  detectDartProject,
  detectNodeProject,
  detectPhpProject,
  detectPythonProject
} from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { builtInCapabilities, builtInIntegrations } from "./catalog.js";
import { djangoCorsHeadersIntegration } from "./django-cors-headers.js";
import { flutterGoRouterIntegration } from "./flutter-go-router.js";
import { laravelPestIntegration } from "./laravel-pest.js";
import { nextAuthIntegration } from "./next-auth.js";

describe("Tier 1 deep integrations", () => {
  it("registers deep Tier 1 defaults in the built-in catalog", () => {
    expect(builtInIntegrations.map((integration) => integration.manifest.id)).toEqual(
      expect.arrayContaining([
        "next-auth",
        "django-cors-headers",
        "laravel-pest",
        "flutter-go-router"
      ])
    );
    expect(
      builtInCapabilities.find((capability) => capability.id === "auth")
        ?.defaultIntegrations
    ).toMatchObject({
      node: "next-auth"
    });
    expect(
      builtInCapabilities.find((capability) => capability.id === "security")
        ?.defaultIntegrations
    ).toMatchObject({
      python: "django-cors-headers"
    });
    expect(
      builtInCapabilities.find((capability) => capability.id === "testing")
        ?.defaultIntegrations
    ).toMatchObject({
      php: "laravel-pest"
    });
    expect(
      builtInCapabilities.find((capability) => capability.id === "routing")
        ?.defaultIntegrations
    ).toMatchObject({
      dart: "flutter-go-router"
    });
  });

  it("repairs a partial Next.js Auth.js setup and stays idempotent", async () => {
    const root = await createTempProject({
      "package.json": JSON.stringify(
        {
          name: "next-app",
          packageManager: "pnpm@11.24.0",
          dependencies: {
            next: "16.0.0",
            react: "20.0.0",
            "next-auth": "beta"
          },
          devDependencies: {
            typescript: "7.0.2"
          }
        },
        null,
        2
      ),
      "pnpm-lock.yaml": "",
      "tsconfig.json": JSON.stringify({})
    });

    const context = createProjectContext(await detectNodeProject(root));
    const initialVerification = await nextAuthIntegration.verify?.(context);
    const repairPlan = await nextAuthIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "create-next-auth-config",
      "create-next-auth-route",
      "document-auth-secret"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await nextAuthIntegration.verify?.(context);
    const secondPlan = await nextAuthIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(secondPlan.operations).toEqual([]);
  });

  it("repairs a partial Django CORS setup and stays idempotent", async () => {
    const root = await createTempProject({
      "pyproject.toml": `[project]
name = "django-app"
dependencies = [
  "django>=5.0",
  "django-cors-headers>=4.0"
]
`,
      "uv.lock": "",
      "manage.py": `import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
`,
      "config/settings.py": `INSTALLED_APPS = [
    "django.contrib.admin",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
]
`
    });

    const context = createProjectContext(await detectPythonProject(root));
    const initialVerification = await djangoCorsHeadersIntegration.verify?.(context);
    const repairPlan = await djangoCorsHeadersIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "configure-cors-installed-app",
      "configure-cors-middleware"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await djangoCorsHeadersIntegration.verify?.(context);
    const secondPlan = await djangoCorsHeadersIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(secondPlan.operations).toEqual([]);
  });

  it("repairs a partial Laravel Pest setup and stays idempotent", async () => {
    const root = await createTempProject({
      "composer.json": JSON.stringify(
        {
          require: {
            "laravel/framework": "^12.0"
          },
          "require-dev": {
            "pestphp/pest": "^4.0",
            "pestphp/pest-plugin-laravel": "^4.0"
          }
        },
        null,
        2
      ),
      artisan: ""
    });

    const context = createProjectContext(await detectPhpProject(root));
    const initialVerification = await laravelPestIntegration.verify?.(context);
    const repairPlan = await laravelPestIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "create-laravel-pest-bootstrap",
      "create-laravel-pest-feature-test"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await laravelPestIntegration.verify?.(context);
    const secondPlan = await laravelPestIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(secondPlan.operations).toEqual([]);
  });

  it("repairs a partial Flutter GoRouter setup and stays idempotent", async () => {
    const root = await createTempProject({
      "pubspec.yaml": `name: avis_flutter
dependencies:
  flutter:
    sdk: flutter
  go_router: ^17.0.0
`,
      "pubspec.lock": ""
    });

    const context = createProjectContext(await detectDartProject(root));
    const initialVerification = await flutterGoRouterIntegration.verify?.(context);
    const repairPlan = await flutterGoRouterIntegration.plan({ context });

    expect(initialVerification?.health).toBe("partial");
    expect(repairPlan.operations.map((operation) => operation.id)).toEqual([
      "create-flutter-router"
    ]);

    await applyChangePlan(repairPlan);

    const repairedVerification = await flutterGoRouterIntegration.verify?.(context);
    const secondPlan = await flutterGoRouterIntegration.plan({ context });

    expect(repairedVerification?.health).toBe("healthy");
    expect(secondPlan.operations).toEqual([]);
  });
});

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-tier1-deep-"));

  await Promise.all(
    Object.entries(files).map(async ([filename, contents]) => {
      const filePath = path.join(root, filename);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, contents);
    })
  );

  return root;
}
