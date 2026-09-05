import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createProjectContext,
  detectDartProject,
  detectGoProject,
  detectNodeProject,
  detectPhpProject,
  detectPythonProject,
  detectRustProject
} from "../detection/index.js";
import type { ProjectContext } from "../types/project-context.js";
import {
  builtInCapabilities,
  builtInIntegrations,
  findIntegrationById
} from "./catalog.js";

describe("official capability integrations", () => {
  it("has built-in defaults for the requested capability expansion", () => {
    expectCapabilityDefaults("auth", {
      node: "next-auth",
      python: "django-simple-jwt",
      php: "laravel-sanctum"
    });
    expectCapabilityDefaults("monitoring", {
      node: "sentry-nextjs",
      python: "sentry-python",
      php: "sentry-laravel",
      dart: "sentry-flutter",
      rust: "sentry-rust",
      go: "sentry-go"
    });
    expectCapabilityDefaults("testing", {
      node: "vitest",
      python: "pytest-django",
      php: "laravel-pest"
    });
    expectCapabilityDefaults("database", {
      node: "node-postgres",
      python: "psycopg",
      rust: "rust-sqlx",
      go: "go-pgx"
    });
    expectCapabilityDefaults("orm", {
      python: "sqlalchemy",
      go: "gorm"
    });
    expectCapabilityDefaults("caching", {
      node: "redis-node",
      python: "django-redis",
      php: "predis",
      go: "go-redis"
    });
    expectCapabilityDefaults("background-jobs", {
      node: "bullmq",
      python: "celery",
      php: "laravel-horizon"
    });
    expectCapabilityDefaults("email", {
      node: "resend-node",
      python: "django-anymail"
    });
    expectCapabilityDefaults("storage", {
      node: "aws-sdk-s3",
      python: "django-storages",
      php: "flysystem-s3"
    });
    expectCapabilityDefaults("api-documentation", {
      node: "swagger-ui-express",
      python: "drf-spectacular"
    });
    expectCapabilityDefaults("configuration", {
      node: "dotenv",
      python: "fastapi-pydantic-settings",
      php: "phpdotenv",
      rust: "rust-config",
      go: "viper"
    });
    expectCapabilityDefaults("security", {
      node: "helmet",
      python: "django-cors-headers"
    });
  });

  it("keeps integration ids unique across the built-in catalog", () => {
    const integrationIds = builtInIntegrations.map(
      (integration) => integration.manifest.id
    );

    expect(new Set(integrationIds).size).toBe(integrationIds.length);
  });

  it("plans native dependency additions for the new official integrations", async () => {
    const contexts = await createContexts();
    const cases: Array<{
      integrationId: string;
      context: ProjectContext;
      packageManager: string;
      operationId: string;
      dependencyType?: "runtime" | "development";
    }> = [
      {
        integrationId: "django-simple-jwt",
        context: contexts.django,
        packageManager: "uv",
        operationId: "add-django-simple-jwt"
      },
      {
        integrationId: "sentry-nextjs",
        context: contexts.nextjs,
        packageManager: "pnpm",
        operationId: "add-sentry-nextjs"
      },
      {
        integrationId: "sentry-python",
        context: contexts.python,
        packageManager: "uv",
        operationId: "add-sentry-python"
      },
      {
        integrationId: "sentry-laravel",
        context: contexts.laravel,
        packageManager: "composer",
        operationId: "add-sentry-laravel"
      },
      {
        integrationId: "sentry-flutter",
        context: contexts.flutter,
        packageManager: "pub",
        operationId: "add-sentry-flutter"
      },
      {
        integrationId: "sentry-rust",
        context: contexts.rust,
        packageManager: "cargo",
        operationId: "add-sentry-rust"
      },
      {
        integrationId: "sentry-go",
        context: contexts.go,
        packageManager: "go",
        operationId: "add-sentry-go"
      },
      {
        integrationId: "vitest",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-vitest",
        dependencyType: "development"
      },
      {
        integrationId: "pytest-django",
        context: contexts.django,
        packageManager: "uv",
        operationId: "add-pytest-django",
        dependencyType: "development"
      },
      {
        integrationId: "node-postgres",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-node-postgres"
      },
      {
        integrationId: "psycopg",
        context: contexts.python,
        packageManager: "uv",
        operationId: "add-psycopg"
      },
      {
        integrationId: "rust-sqlx",
        context: contexts.rust,
        packageManager: "cargo",
        operationId: "add-rust-sqlx"
      },
      {
        integrationId: "go-pgx",
        context: contexts.go,
        packageManager: "go",
        operationId: "add-go-pgx"
      },
      {
        integrationId: "sqlalchemy",
        context: contexts.python,
        packageManager: "uv",
        operationId: "add-sqlalchemy"
      },
      {
        integrationId: "gorm",
        context: contexts.go,
        packageManager: "go",
        operationId: "add-gorm"
      },
      {
        integrationId: "redis-node",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-redis-node"
      },
      {
        integrationId: "django-redis",
        context: contexts.django,
        packageManager: "uv",
        operationId: "add-django-redis"
      },
      {
        integrationId: "predis",
        context: contexts.laravel,
        packageManager: "composer",
        operationId: "add-predis"
      },
      {
        integrationId: "go-redis",
        context: contexts.go,
        packageManager: "go",
        operationId: "add-go-redis"
      },
      {
        integrationId: "bullmq",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-bullmq"
      },
      {
        integrationId: "celery",
        context: contexts.python,
        packageManager: "uv",
        operationId: "add-celery"
      },
      {
        integrationId: "laravel-horizon",
        context: contexts.laravel,
        packageManager: "composer",
        operationId: "add-laravel-horizon"
      },
      {
        integrationId: "resend-node",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-resend-node"
      },
      {
        integrationId: "django-anymail",
        context: contexts.django,
        packageManager: "uv",
        operationId: "add-django-anymail"
      },
      {
        integrationId: "aws-sdk-s3",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-aws-sdk-s3"
      },
      {
        integrationId: "django-storages",
        context: contexts.django,
        packageManager: "uv",
        operationId: "add-django-storages"
      },
      {
        integrationId: "flysystem-s3",
        context: contexts.laravel,
        packageManager: "composer",
        operationId: "add-flysystem-s3"
      },
      {
        integrationId: "drf-spectacular",
        context: contexts.django,
        packageManager: "uv",
        operationId: "add-drf-spectacular"
      },
      {
        integrationId: "swagger-ui-express",
        context: contexts.express,
        packageManager: "pnpm",
        operationId: "add-swagger-ui-express"
      },
      {
        integrationId: "dotenv",
        context: contexts.node,
        packageManager: "pnpm",
        operationId: "add-dotenv"
      },
      {
        integrationId: "phpdotenv",
        context: contexts.laravel,
        packageManager: "composer",
        operationId: "add-phpdotenv"
      },
      {
        integrationId: "rust-config",
        context: contexts.rust,
        packageManager: "cargo",
        operationId: "add-rust-config"
      },
      {
        integrationId: "viper",
        context: contexts.go,
        packageManager: "go",
        operationId: "add-viper"
      },
      {
        integrationId: "helmet",
        context: contexts.express,
        packageManager: "pnpm",
        operationId: "add-helmet"
      }
    ];

    for (const testCase of cases) {
      const integration = findIntegrationById(testCase.integrationId);
      expect(integration, testCase.integrationId).toBeDefined();

      const plan = await integration?.plan({ context: testCase.context });

      expect(plan?.diagnostics).toEqual([]);
      expect(plan?.operations).toMatchObject([
        {
          id: testCase.operationId,
          type: "dependency.add",
          packageManager: testCase.packageManager,
          dependencyType: testCase.dependencyType ?? "runtime"
        }
      ]);
    }
  });
});

function expectCapabilityDefaults(
  capabilityId: string,
  defaults: Record<string, string>
): void {
  const capability = builtInCapabilities.find(
    (candidate) => candidate.id === capabilityId
  );

  expect(capability?.defaultIntegrations).toMatchObject(defaults);

  for (const integrationId of Object.values(defaults)) {
    const integration = findIntegrationById(integrationId);
    expect(integration, integrationId).toBeDefined();
    expect(integration?.manifest.capability).toBe(capabilityId);
  }
}

async function createContexts(): Promise<{
  node: ProjectContext;
  nextjs: ProjectContext;
  express: ProjectContext;
  python: ProjectContext;
  django: ProjectContext;
  laravel: ProjectContext;
  flutter: ProjectContext;
  rust: ProjectContext;
  go: ProjectContext;
}> {
  const [
    node,
    nextjs,
    express,
    python,
    django,
    laravel,
    flutter,
    rust,
    go
  ] = await Promise.all([
    createNodeContext("node-app", {}),
    createNodeContext("next-app", { next: "16.0.0", react: "20.0.0" }),
    createNodeContext("express-app", { express: "5.0.0" }),
    createPythonContext("python-app", []),
    createPythonContext("django-app", ["django>=5.0"]),
    createLaravelContext(),
    createFlutterContext(),
    createRustContext(),
    createGoContext()
  ]);

  return { node, nextjs, express, python, django, laravel, flutter, rust, go };
}

async function createNodeContext(
  name: string,
  dependencies: Record<string, string>
): Promise<ProjectContext> {
  const root = await createTempProject({
    "package.json": JSON.stringify(
      {
        name,
        packageManager: "pnpm@11.24.0",
        dependencies
      },
      null,
      2
    ),
    "pnpm-lock.yaml": ""
  });

  return createProjectContext(await detectNodeProject(root));
}

async function createPythonContext(
  name: string,
  dependencies: string[]
): Promise<ProjectContext> {
  const root = await createTempProject({
    "pyproject.toml": `[project]
name = "${name}"
dependencies = [
${dependencies.map((dependency) => `  "${dependency}"`).join(",\n")}
]
`,
    "uv.lock": ""
  });

  return createProjectContext(await detectPythonProject(root));
}

async function createLaravelContext(): Promise<ProjectContext> {
  const root = await createTempProject({
    "composer.json": JSON.stringify(
      {
        require: {
          "laravel/framework": "^12.0"
        }
      },
      null,
      2
    ),
    artisan: ""
  });

  return createProjectContext(await detectPhpProject(root));
}

async function createFlutterContext(): Promise<ProjectContext> {
  const root = await createTempProject({
    "pubspec.yaml": `name: avis_flutter
dependencies:
  flutter:
    sdk: flutter
`,
    "pubspec.lock": ""
  });

  return createProjectContext(await detectDartProject(root));
}

async function createRustContext(): Promise<ProjectContext> {
  const root = await createTempProject({
    "Cargo.toml": `[package]
name = "avis-rust"
version = "0.1.0"
edition = "2024"

[dependencies]
`
  });

  return createProjectContext(await detectRustProject(root));
}

async function createGoContext(): Promise<ProjectContext> {
  const root = await createTempProject({
    "go.mod": `module github.com/acme/app

go 1.24
`,
    "go.sum": ""
  });

  return createProjectContext(await detectGoProject(root));
}

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-official-integrations-"));

  await Promise.all(
    Object.entries(files).map(async ([filename, contents]) => {
      const filePath = path.join(root, filename);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, contents);
    })
  );

  return root;
}
