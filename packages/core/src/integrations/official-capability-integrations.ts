import { readFile } from "node:fs/promises";
import path from "node:path";
import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { createPackageManagerAdapter } from "../package-managers/factory.js";
import { createPythonPackageManagerAdapter } from "../package-managers/python.js";
import type { ChangePlan } from "../planning/change-plan.js";
import type { DependencyType } from "../planning/operations.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import { findDjangoSettingsPath } from "./django-settings.js";
import type {
  AvisIntegration,
  AvisIntegrationManifest,
  CompatibilityResult
} from "./types.js";

const nodePackageManagers = [
  packageManagers.npm,
  packageManagers.pnpm,
  packageManagers.yarn,
  packageManagers.bun
];

const pythonPackageManagers = [
  packageManagers.pip,
  packageManagers.uv,
  packageManagers.poetry
];

export const djangoSimpleJwtIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "django-simple-jwt",
    name: "Simple JWT for Django REST Framework",
    description: "JWT authentication support for Django REST Framework APIs.",
    capability: "auth",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "djangorestframework-simplejwt", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "djangorestframework-simplejwt",
  planTitle: "Add Simple JWT for Django REST Framework",
  dependencyOperationId: "add-django-simple-jwt",
  dependencyDescription: "Install Simple JWT for Django REST Framework.",
  compatibilityDescription: "Django projects"
});

export const sentryNextjsIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "sentry-nextjs",
    name: "Sentry for Next.js",
    description: "Error and performance monitoring for Next.js applications.",
    capability: "monitoring",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      frameworks: [frameworks.nextjs],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "@sentry/nextjs", type: "runtime" }],
    configures: ["runtime dependency", "client-side Sentry initializer", "SENTRY_DSN example"],
    source: { owner: "avis" }
  },
  packageName: "@sentry/nextjs",
  planTitle: "Add Sentry for Next.js",
  dependencyOperationId: "add-sentry-nextjs",
  dependencyDescription: "Install Sentry for Next.js.",
  compatibilityDescription: "Next.js projects",
  files: [
    {
      operationId: "create-sentry-nextjs-client-config",
      description: "Create the Next.js Sentry client initializer.",
      path: "sentry.client.config.ts",
      requiredText: "Sentry.init",
      contents: `import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN
});
`
    }
  ],
  env: [
    {
      operationId: "document-sentry-nextjs-dsn",
      description: "Document the Sentry DSN environment variable.",
      path: ".env.local.example",
      variables: {
        SENTRY_DSN: ""
      }
    }
  ]
});

export const sentryPythonIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "sentry-python",
    name: "Sentry Python SDK",
    description: "Error and performance monitoring for Python applications.",
    capability: "monitoring",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.python],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "sentry-sdk", type: "runtime" }],
    configures: ["runtime dependency", "Python Sentry initializer", "SENTRY_DSN example"],
    source: { owner: "avis" }
  },
  packageName: "sentry-sdk",
  planTitle: "Add Sentry Python SDK",
  dependencyOperationId: "add-sentry-python",
  dependencyDescription: "Install Sentry Python SDK.",
  compatibilityDescription: "Python projects",
  files: [
    {
      operationId: "create-python-sentry-initializer",
      description: "Create a Python Sentry initializer helper.",
      path: "avis_sentry.py",
      requiredText: "sentry_sdk.init",
      contents: `import os

import sentry_sdk


def init_sentry() -> None:
    dsn = os.environ.get("SENTRY_DSN")
    if dsn:
        sentry_sdk.init(dsn=dsn)
`
    }
  ],
  env: [
    {
      operationId: "document-sentry-python-dsn",
      description: "Document the Sentry DSN environment variable.",
      path: ".env.example",
      variables: {
        SENTRY_DSN: ""
      }
    }
  ]
});

export const sentryLaravelIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "sentry-laravel",
    name: "Sentry for Laravel",
    description: "Error and performance monitoring for Laravel applications.",
    capability: "monitoring",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.php],
      frameworks: [frameworks.laravel],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [{ name: "sentry/sentry-laravel", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "sentry/sentry-laravel",
  planTitle: "Add Sentry for Laravel",
  dependencyOperationId: "add-sentry-laravel",
  dependencyDescription: "Install Sentry for Laravel.",
  compatibilityDescription: "Laravel projects"
});

export const sentryFlutterIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "sentry-flutter",
    name: "Sentry for Flutter",
    description: "Error and performance monitoring for Flutter applications.",
    capability: "monitoring",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.dart],
      frameworks: [frameworks.flutter],
      packageManagers: [packageManagers.pub]
    },
    dependencies: [{ name: "sentry_flutter", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "sentry_flutter",
  planTitle: "Add Sentry for Flutter",
  dependencyOperationId: "add-sentry-flutter",
  dependencyDescription: "Install Sentry for Flutter.",
  compatibilityDescription: "Flutter projects"
});

export const sentryRustIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "sentry-rust",
    name: "Sentry Rust SDK",
    description: "Error monitoring for Rust applications.",
    capability: "monitoring",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.rust],
      packageManagers: [packageManagers.cargo]
    },
    dependencies: [{ name: "sentry", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "sentry",
  planTitle: "Add Sentry Rust SDK",
  dependencyOperationId: "add-sentry-rust",
  dependencyDescription: "Install Sentry Rust SDK.",
  compatibilityDescription: "Rust projects"
});

export const sentryGoIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "sentry-go",
    name: "Sentry Go SDK",
    description: "Error monitoring for Go applications.",
    capability: "monitoring",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.go],
      packageManagers: [packageManagers.go]
    },
    dependencies: [{ name: "github.com/getsentry/sentry-go", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "github.com/getsentry/sentry-go",
  planTitle: "Add Sentry Go SDK",
  dependencyOperationId: "add-sentry-go",
  dependencyDescription: "Install Sentry Go SDK.",
  compatibilityDescription: "Go projects"
});

export const vitestIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "vitest",
    name: "Vitest",
    description: "Fast unit testing for JavaScript and TypeScript projects.",
    capability: "testing",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "vitest", type: "development" }],
    configures: ["development dependency"],
    source: { owner: "avis" }
  },
  packageName: "vitest",
  planTitle: "Add Vitest",
  dependencyOperationId: "add-vitest",
  dependencyDescription: "Install Vitest.",
  dependencyType: "development",
  compatibilityDescription: "Node projects"
});

export const pytestDjangoIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "pytest-django",
    name: "pytest-django",
    description: "pytest integration for Django applications.",
    capability: "testing",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "pytest-django", type: "development" }],
    configures: ["development dependency"],
    source: { owner: "avis" }
  },
  packageName: "pytest-django",
  planTitle: "Add pytest-django",
  dependencyOperationId: "add-pytest-django",
  dependencyDescription: "Install pytest-django.",
  dependencyType: "development",
  compatibilityDescription: "Django projects"
});

export const nodePostgresIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "node-postgres",
    name: "node-postgres",
    description: "PostgreSQL client for Node.js applications.",
    capability: "database",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "pg", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "pg",
  planTitle: "Add node-postgres",
  dependencyOperationId: "add-node-postgres",
  dependencyDescription: "Install node-postgres.",
  compatibilityDescription: "Node projects"
});

export const psycopgIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "psycopg",
    name: "Psycopg",
    description: "PostgreSQL adapter for Python applications.",
    capability: "database",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.python],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "psycopg", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "psycopg",
  planTitle: "Add Psycopg",
  dependencyOperationId: "add-psycopg",
  dependencyDescription: "Install Psycopg.",
  compatibilityDescription: "Python projects"
});

export const rustSqlxIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "rust-sqlx",
    name: "SQLx",
    description: "Async SQL toolkit for Rust applications.",
    capability: "database",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.rust],
      packageManagers: [packageManagers.cargo]
    },
    dependencies: [{ name: "sqlx", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "sqlx",
  planTitle: "Add SQLx",
  dependencyOperationId: "add-rust-sqlx",
  dependencyDescription: "Install SQLx.",
  compatibilityDescription: "Rust projects"
});

export const goPgxIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "go-pgx",
    name: "pgx",
    description: "PostgreSQL driver and toolkit for Go applications.",
    capability: "database",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.go],
      packageManagers: [packageManagers.go]
    },
    dependencies: [{ name: "github.com/jackc/pgx/v5", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "github.com/jackc/pgx/v5",
  planTitle: "Add pgx",
  dependencyOperationId: "add-go-pgx",
  dependencyDescription: "Install pgx.",
  compatibilityDescription: "Go projects"
});

export const sqlalchemyIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "sqlalchemy",
    name: "SQLAlchemy",
    description: "ORM and SQL toolkit for Python applications.",
    capability: "orm",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.python],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "sqlalchemy", type: "runtime" }],
    configures: ["runtime dependency", "SQLAlchemy session helper", "DATABASE_URL example"],
    source: { owner: "avis" }
  },
  packageName: "sqlalchemy",
  planTitle: "Add SQLAlchemy",
  dependencyOperationId: "add-sqlalchemy",
  dependencyDescription: "Install SQLAlchemy.",
  compatibilityDescription: "Python projects",
  files: [
    {
      operationId: "create-sqlalchemy-session-helper",
      description: "Create a SQLAlchemy engine and session helper.",
      path: "app/db/session.py",
      requiredText: "SessionLocal = sessionmaker",
      contents: `import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
`
    }
  ],
  env: [
    {
      operationId: "document-sqlalchemy-database-url",
      description: "Document the SQLAlchemy database URL variable.",
      path: ".env.example",
      variables: {
        DATABASE_URL: "sqlite:///./app.db"
      }
    }
  ]
});

export const gormIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "gorm",
    name: "GORM",
    description: "ORM library for Go applications.",
    capability: "orm",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.go],
      packageManagers: [packageManagers.go]
    },
    dependencies: [{ name: "gorm.io/gorm", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "gorm.io/gorm",
  planTitle: "Add GORM",
  dependencyOperationId: "add-gorm",
  dependencyDescription: "Install GORM.",
  compatibilityDescription: "Go projects"
});

export const redisNodeIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "redis-node",
    name: "Redis for Node.js",
    description: "Redis client for Node.js applications.",
    capability: "caching",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "redis", type: "runtime" }],
    configures: ["runtime dependency", "Redis client helper", "REDIS_URL example"],
    source: { owner: "avis" }
  },
  packageName: "redis",
  planTitle: "Add Redis for Node.js",
  dependencyOperationId: "add-redis-node",
  dependencyDescription: "Install Redis for Node.js.",
  compatibilityDescription: "Node projects",
  files: [
    {
      operationId: "create-node-redis-client",
      description: "Create a reusable Node Redis client helper.",
      path: "src/lib/redis.ts",
      requiredText: "createClient",
      contents: `import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379"
});
`
    }
  ],
  env: [
    {
      operationId: "document-node-redis-url",
      description: "Document the Redis connection URL variable.",
      path: ".env.example",
      variables: {
        REDIS_URL: "redis://localhost:6379"
      }
    }
  ]
});

export const djangoRedisIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "django-redis",
    name: "django-redis",
    description: "Redis cache backend for Django applications.",
    capability: "caching",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "django-redis", type: "runtime" }],
    configures: ["runtime dependency", "Django cache settings snippet", "REDIS_URL example"],
    source: { owner: "avis" }
  },
  packageName: "django-redis",
  planTitle: "Add django-redis",
  dependencyOperationId: "add-django-redis",
  dependencyDescription: "Install django-redis.",
  compatibilityDescription: "Django projects",
  files: [
    {
      operationId: "create-django-redis-cache-settings",
      description: "Create a Django Redis cache settings snippet.",
      path: "config/avis_cache.py",
      requiredText: "django_redis.cache.RedisCache",
      contents: `import os


CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://localhost:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}
`
    }
  ],
  env: [
    {
      operationId: "document-django-redis-url",
      description: "Document the Redis connection URL variable.",
      path: ".env.example",
      variables: {
        REDIS_URL: "redis://localhost:6379/1"
      }
    }
  ]
});

export const predisIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "predis",
    name: "Predis",
    description: "Redis client for PHP applications.",
    capability: "caching",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.php],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [{ name: "predis/predis", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "predis/predis",
  planTitle: "Add Predis",
  dependencyOperationId: "add-predis",
  dependencyDescription: "Install Predis.",
  compatibilityDescription: "PHP projects"
});

export const goRedisIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "go-redis",
    name: "go-redis",
    description: "Redis client for Go applications.",
    capability: "caching",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.go],
      packageManagers: [packageManagers.go]
    },
    dependencies: [{ name: "github.com/redis/go-redis/v9", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "github.com/redis/go-redis/v9",
  planTitle: "Add go-redis",
  dependencyOperationId: "add-go-redis",
  dependencyDescription: "Install go-redis.",
  compatibilityDescription: "Go projects"
});

export const bullmqIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "bullmq",
    name: "BullMQ",
    description: "Redis-backed background job queues for Node.js applications.",
    capability: "background-jobs",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "bullmq", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "bullmq",
  planTitle: "Add BullMQ",
  dependencyOperationId: "add-bullmq",
  dependencyDescription: "Install BullMQ.",
  compatibilityDescription: "Node projects"
});

export const celeryIntegration: AvisIntegration = {
  manifest: {
    id: "celery",
    name: "Celery for Django",
    description: "Distributed background task processing configured for Django applications.",
    capability: "background-jobs",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    setupMaturity: "configure",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "celery", type: "runtime" }],
    configures: [
      "runtime dependency",
      "Django Celery application module",
      "CELERY_BROKER_URL example"
    ],
    repair: "plan",
    source: { owner: "avis" }
  },
  isCompatible: isCeleryCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isCeleryCompatible(context);
    if (!compatibility.supported) {
      return incompatibleCeleryPlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.pip;
    const packageManager = createPythonPackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(context, "celery");
    const settingsPath = await findDjangoSettingsPath(context.targetRoot);
    const settingsModule = settingsPath ? settingsPath.replace(/\.py$/, "").replaceAll("/", ".") : undefined;
    const celeryPath = settingsPath ? `${path.posix.dirname(settingsPath)}/celery.py` : undefined;
    const celeryConfigured = celeryPath
      ? await fileIncludes(context.targetRoot, celeryPath, "Celery(")
      : false;
    const envConfigured = await fileIncludes(
      context.targetRoot,
      ".env.example",
      "CELERY_BROKER_URL="
    );

    return {
      id: "celery",
      title: "Add Celery for Django",
      integrationId: "celery",
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-celery",
                type: "dependency.add" as const,
                description: "Install Celery.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: "celery" }]
              }
            ]),
        ...(celeryPath && settingsModule && !celeryConfigured
          ? [
              {
                id: "create-django-celery-app",
                type: "file.create" as const,
                description: "Create the Django Celery application module.",
                path: celeryPath,
                contents: createDjangoCeleryContents(settingsModule),
                overwrite: "never" as const
              }
            ]
          : []),
        ...(envConfigured
          ? []
          : [
              {
                id: "document-celery-broker-url",
                type: "env.ensure" as const,
                description: "Document the Celery broker URL variable.",
                path: ".env.example",
                variables: {
                  CELERY_BROKER_URL: "redis://localhost:6379/0"
                }
              }
            ])
      ],
      diagnostics: settingsPath
        ? []
        : [
            {
              severity: "warning",
              message: "Could not find a Django settings.py file to place celery.py."
            }
          ]
    };
  },
  verify: verifyCelery
};

function isCeleryCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.python) {
    return {
      supported: false,
      reason: "Celery for Django supports Python projects only."
    };
  }

  if (context.framework?.id !== frameworks.django) {
    return {
      supported: false,
      reason: "Celery for Django requires a detected Django project."
    };
  }

  if (!context.packageManager) {
    return {
      supported: false,
      reason: "No supported Python package manager was detected."
    };
  }

  return { supported: true };
}

function incompatibleCeleryPlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: "celery",
    title: "Add Celery for Django",
    integrationId: "celery",
    target: context,
    operations: [],
    diagnostics: [
      {
        severity: "error",
        message: reason
      }
    ]
  };
}

async function verifyCelery(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createPythonPackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.pip
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(context, "celery");
  const settingsPath = await findDjangoSettingsPath(context.targetRoot);
  const settingsModule = settingsPath ? settingsPath.replace(/\.py$/, "").replaceAll("/", ".") : undefined;
  const celeryPath = settingsPath ? `${path.posix.dirname(settingsPath)}/celery.py` : undefined;
  const celeryConfigured =
    celeryPath && settingsModule
      ? await fileIncludes(context.targetRoot, celeryPath, `DJANGO_SETTINGS_MODULE", "${settingsModule}"`)
      : false;
  const envConfigured = await fileIncludes(
    context.targetRoot,
    ".env.example",
    "CELERY_BROKER_URL="
  );
  const checks = [
    {
      id: "celery-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "skipped",
      message: dependencyInstalled ? undefined : "celery is not installed.",
      remediation: dependencyInstalled ? undefined : "Run avis add celery."
    },
    {
      id: "celery-app-module",
      label: "Django Celery app configured",
      status: celeryConfigured ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: celeryConfigured
        ? undefined
        : celeryPath
          ? `${celeryPath} was not found or does not initialize Celery for this settings module.`
          : "Django settings.py was not found.",
      remediation: celeryConfigured ? undefined : "Run avis repair celery."
    },
    {
      id: "celery-broker-url",
      label: "broker URL documented",
      status: envConfigured ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: envConfigured ? undefined : ".env.example does not include CELERY_BROKER_URL.",
      remediation: envConfigured ? undefined : "Run avis repair celery."
    }
  ] as const;
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId: "celery",
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [...checks],
    diagnostics: []
  };
}

function createDjangoCeleryContents(settingsModule: string): string {
  return `import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "${settingsModule}")

app = Celery("${settingsModule.split(".")[0]}")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
`;
}

async function fileIncludes(
  root: string,
  relativePath: string,
  value: string
): Promise<boolean> {
  try {
    const contents = await readFile(path.join(root, relativePath), "utf8");
    return contents.includes(value);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

type GeneratedIntegrationFileValue =
  | string
  | ((
      context: ProjectContext,
      relativePath: string
    ) => string | Promise<string>);

type GeneratedIntegrationFilePath =
  | string
  | ((context: ProjectContext) => string | undefined | Promise<string | undefined>);

interface GeneratedIntegrationFile {
  operationId: string;
  description: string;
  path: GeneratedIntegrationFilePath;
  contents: GeneratedIntegrationFileValue;
  requiredText: GeneratedIntegrationFileValue;
}

interface GeneratedIntegrationEnv {
  operationId: string;
  description: string;
  path: string;
  variables: Record<string, string>;
}

interface ConfiguredDependencyIntegrationOptions {
  manifest: Omit<AvisIntegrationManifest, "setupMaturity"> &
    Partial<Pick<AvisIntegrationManifest, "setupMaturity">>;
  packageName?: string;
  packageNames?: string[];
  planTitle: string;
  dependencyOperationId: string;
  dependencyDescription: string;
  dependencyType?: DependencyType;
  compatibilityDescription: string;
  files?: GeneratedIntegrationFile[];
  env?: GeneratedIntegrationEnv[];
}

function createConfiguredDependencyIntegration(
  options: ConfiguredDependencyIntegrationOptions
): AvisIntegration {
  const manifest: AvisIntegrationManifest = {
    setupMaturity: "configure",
    repair: "plan",
    ...options.manifest
  };

  return {
    manifest,
    isCompatible: (context) => isConfiguredIntegrationCompatible(context, options),
    plan: async ({ context }): Promise<ChangePlan> => {
      const compatibility = isConfiguredIntegrationCompatible(context, options);
      if (!compatibility.supported) {
        return incompatibleConfiguredPlan(context, options, compatibility.reason);
      }

      const packageManagerId = context.packageManager?.id;
      if (!packageManagerId) {
        throw new Error("Cannot plan configured integration without a package manager.");
      }

      const packageManager = createPackageManagerAdapter(packageManagerId);
      const missingPackageNames = await Promise.all(
        getConfiguredPackageNames(options).map(async (packageName) => ({
          packageName,
          installed: await packageManager.isDependencyInstalled(context, packageName)
        }))
      );
      const missingPackages = missingPackageNames
        .filter((dependency) => !dependency.installed)
        .map((dependency) => dependency.packageName);
      const filePlans = await getMissingGeneratedFiles(context, options);
      const envPlans = await getMissingEnvEntries(context, options);

      return {
        id: manifest.id,
        title: options.planTitle,
        integrationId: manifest.id,
        target: context,
        operations: [
          ...(missingPackages.length === 0
            ? []
            : [
                {
                  id: options.dependencyOperationId,
                  type: "dependency.add" as const,
                  description: options.dependencyDescription,
                  dependencyType: options.dependencyType ?? "runtime",
                  packageManager: packageManagerId,
                  packages: missingPackages.map((name) => ({ name }))
                }
              ]),
          ...filePlans.operations,
          ...envPlans.operations
        ],
        diagnostics: [...filePlans.diagnostics, ...envPlans.diagnostics]
      };
    },
    verify: async (context): Promise<VerificationResult> =>
      verifyConfiguredIntegration(context, options, manifest)
  };
}

function isConfiguredIntegrationCompatible(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions
): CompatibilityResult {
  if (!options.manifest.supports.ecosystems.includes(context.ecosystem)) {
    return {
      supported: false,
      reason: `${options.manifest.name} integration supports ${options.compatibilityDescription} only.`
    };
  }

  if (
    options.manifest.supports.frameworks &&
    (!context.framework ||
      !options.manifest.supports.frameworks.includes(context.framework.id))
  ) {
    return {
      supported: false,
      reason: `${options.manifest.name} integration is not compatible with this framework.`
    };
  }

  if (
    options.manifest.supports.packageManagers &&
    (!context.packageManager ||
      !options.manifest.supports.packageManagers.includes(context.packageManager.id))
  ) {
    return {
      supported: false,
      reason: `${options.manifest.name} integration requires a supported package manager.`
    };
  }

  if (!context.packageManager) {
    return {
      supported: false,
      reason: `${options.manifest.name} integration requires a detected package manager.`
    };
  }

  return { supported: true };
}

function incompatibleConfiguredPlan(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions,
  reason: string
): ChangePlan {
  return {
    id: options.manifest.id,
    title: options.planTitle,
    integrationId: options.manifest.id,
    target: context,
    operations: [],
    diagnostics: [
      {
        severity: "error",
        message: reason
      }
    ]
  };
}

async function verifyConfiguredIntegration(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions,
  manifest: AvisIntegrationManifest
): Promise<VerificationResult> {
  if (!context.packageManager) {
    return {
      integrationId: manifest.id,
      health: "unknown",
      checks: [
        {
          id: `${manifest.id}-package-manager`,
          label: "package manager detected",
          status: "skipped",
          message: "No supported package manager was detected.",
          remediation: `Run avis add ${manifest.id} in a supported project.`
        }
      ],
      diagnostics: []
    };
  }

  const packageManager = createPackageManagerAdapter(context.packageManager.id);
  const packageNames = getConfiguredPackageNames(options);
  const dependencyResults = await Promise.all(
    packageNames.map(async (packageName) => ({
      packageName,
      installed: await packageManager.isDependencyInstalled(context, packageName)
    }))
  );
  const missingPackages = dependencyResults
    .filter((dependency) => !dependency.installed)
    .map((dependency) => dependency.packageName);
  const dependencyInstalled = missingPackages.length === 0;
  const fileChecks = await getGeneratedFileChecks(context, options, dependencyInstalled);
  const envChecks = await getGeneratedEnvChecks(context, options, dependencyInstalled);
  const checks = [
    {
      id: `${manifest.id}-dependency`,
      label: "dependency installed",
      status: dependencyInstalled
        ? "pass" as const
        : missingPackages.length === packageNames.length
          ? "skipped" as const
          : "warning" as const,
      message: dependencyInstalled
        ? undefined
        : `${missingPackages.join(", ")} is not installed.`,
      remediation: dependencyInstalled ? undefined : `Run avis add ${manifest.id}.`
    },
    ...fileChecks,
    ...envChecks
  ];
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId: manifest.id,
    health: dependencyInstalled
      ? hasWarning
        ? "partial"
        : "healthy"
      : "not-installed",
    checks,
    diagnostics: []
  };
}

function getConfiguredPackageNames(
  options: ConfiguredDependencyIntegrationOptions
): string[] {
  return options.packageNames ?? (options.packageName ? [options.packageName] : []);
}

async function getMissingGeneratedFiles(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions
): Promise<{
  operations: ChangePlan["operations"];
  diagnostics: ChangePlan["diagnostics"];
}> {
  const operations: ChangePlan["operations"] = [];
  const diagnostics: ChangePlan["diagnostics"] = [];

  for (const file of options.files ?? []) {
    const filePath = await resolveGeneratedFilePath(context, file.path);
    if (!filePath) {
      diagnostics.push({
        severity: "warning",
        message: `Could not resolve a safe target path for ${file.description}.`
      });
      continue;
    }

    const contents = await resolveGeneratedFileValue(context, filePath, file.contents);
    const requiredText = await resolveGeneratedFileValue(context, filePath, file.requiredText);
    const alreadyConfigured = await fileIncludes(context.targetRoot, filePath, requiredText);
    if (alreadyConfigured) {
      continue;
    }

    const exists = await fileExists(context.targetRoot, filePath);
    if (exists) {
      diagnostics.push({
        severity: "warning",
        message: `${filePath} already exists but does not include the expected ${options.manifest.name} marker; review it before merging manually.`
      });
      continue;
    }

    operations.push({
      id: file.operationId,
      type: "file.create",
      description: file.description,
      path: filePath,
      contents,
      overwrite: "never"
    });
  }

  return { operations, diagnostics };
}

async function getMissingEnvEntries(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions
): Promise<{
  operations: ChangePlan["operations"];
  diagnostics: ChangePlan["diagnostics"];
}> {
  const operations: ChangePlan["operations"] = [];
  const diagnostics: ChangePlan["diagnostics"] = [];

  for (const env of options.env ?? []) {
    const missingVariables = await getMissingEnvVariables(context, env);
    if (missingVariables.length === 0) {
      continue;
    }

    operations.push({
      id: env.operationId,
      type: "env.ensure",
      description: env.description,
      path: env.path,
      variables: Object.fromEntries(
        missingVariables.map((key) => [key, env.variables[key] ?? ""])
      )
    });
  }

  return { operations, diagnostics };
}

async function getGeneratedFileChecks(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions,
  dependencyInstalled: boolean
) {
  return Promise.all(
    (options.files ?? []).map(async (file) => {
      const filePath = await resolveGeneratedFilePath(context, file.path);
      if (!filePath) {
        return {
          id: `${options.manifest.id}-${file.operationId}`,
          label: file.description,
          status: dependencyInstalled ? "warning" as const : "skipped" as const,
          message: `Could not resolve a safe target path for ${file.description}.`,
          remediation: `Run avis repair ${options.manifest.id}.`
        };
      }

      const requiredText = await resolveGeneratedFileValue(context, filePath, file.requiredText);
      const configured = await fileIncludes(context.targetRoot, filePath, requiredText);

      return {
        id: `${options.manifest.id}-${file.operationId}`,
        label: file.description,
        status: configured
          ? "pass" as const
          : dependencyInstalled
            ? "warning" as const
            : "skipped" as const,
        message: configured ? undefined : `${filePath} is not configured.`,
        remediation: configured ? undefined : `Run avis repair ${options.manifest.id}.`
      };
    })
  );
}

async function getGeneratedEnvChecks(
  context: ProjectContext,
  options: ConfiguredDependencyIntegrationOptions,
  dependencyInstalled: boolean
) {
  return Promise.all(
    (options.env ?? []).map(async (env) => {
      const missingVariables = await getMissingEnvVariables(context, env);
      const configured = missingVariables.length === 0;

      return {
        id: `${options.manifest.id}-${env.operationId}`,
        label: env.description,
        status: configured
          ? "pass" as const
          : dependencyInstalled
            ? "warning" as const
            : "skipped" as const,
        message: configured
          ? undefined
          : `${env.path} is missing ${missingVariables.join(", ")}.`,
        remediation: configured ? undefined : `Run avis repair ${options.manifest.id}.`
      };
    })
  );
}

async function getMissingEnvVariables(
  context: ProjectContext,
  env: GeneratedIntegrationEnv
): Promise<string[]> {
  const results = await Promise.all(
    Object.keys(env.variables).map(async (key) => ({
      key,
      present: await fileIncludes(context.targetRoot, env.path, `${key}=`)
    }))
  );

  return results.filter((result) => !result.present).map((result) => result.key);
}

async function resolveGeneratedFilePath(
  context: ProjectContext,
  value: GeneratedIntegrationFilePath
): Promise<string | undefined> {
  return typeof value === "function" ? value(context) : value;
}

async function resolveGeneratedFileValue(
  context: ProjectContext,
  relativePath: string,
  value: GeneratedIntegrationFileValue
): Promise<string> {
  return typeof value === "function" ? value(context, relativePath) : value;
}

async function fileExists(root: string, relativePath: string): Promise<boolean> {
  try {
    await readFile(path.join(root, relativePath), "utf8");
    return true;
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

export const laravelHorizonIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "laravel-horizon",
    name: "Laravel Horizon",
    description: "Redis queue dashboard and worker supervision for Laravel applications.",
    capability: "background-jobs",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.php],
      frameworks: [frameworks.laravel],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [{ name: "laravel/horizon", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "laravel/horizon",
  planTitle: "Add Laravel Horizon",
  dependencyOperationId: "add-laravel-horizon",
  dependencyDescription: "Install Laravel Horizon.",
  compatibilityDescription: "Laravel projects"
});

export const resendNodeIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "resend-node",
    name: "Resend Node SDK",
    description: "Transactional email delivery for Node.js applications.",
    capability: "email",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "resend", type: "runtime" }],
    configures: ["runtime dependency", "Resend client helper", "RESEND_API_KEY example"],
    source: { owner: "avis" }
  },
  packageName: "resend",
  planTitle: "Add Resend Node SDK",
  dependencyOperationId: "add-resend-node",
  dependencyDescription: "Install Resend Node SDK.",
  compatibilityDescription: "Node projects",
  files: [
    {
      operationId: "create-resend-email-client",
      description: "Create a reusable Resend email client helper.",
      path: "src/lib/email.ts",
      requiredText: "new Resend",
      contents: `import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
`
    }
  ],
  env: [
    {
      operationId: "document-resend-api-key",
      description: "Document the Resend API key variable.",
      path: ".env.example",
      variables: {
        RESEND_API_KEY: ""
      }
    }
  ]
});

export const djangoAnymailIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "django-anymail",
    name: "django-anymail",
    description: "Transactional email provider integrations for Django applications.",
    capability: "email",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "django-anymail", type: "runtime" }],
    configures: ["runtime dependency", "Django Anymail settings snippet", "email env examples"],
    source: { owner: "avis" }
  },
  packageName: "django-anymail",
  planTitle: "Add django-anymail",
  dependencyOperationId: "add-django-anymail",
  dependencyDescription: "Install django-anymail.",
  compatibilityDescription: "Django projects",
  files: [
    {
      operationId: "create-django-anymail-settings",
      description: "Create a Django Anymail settings snippet.",
      path: "config/avis_email.py",
      requiredText: "anymail.backends.mailgun.EmailBackend",
      contents: `import os


ANYMAIL = {
    "MAILGUN_API_KEY": os.environ.get("ANYMAIL_API_KEY", ""),
}
EMAIL_BACKEND = "anymail.backends.mailgun.EmailBackend"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@example.com")
`
    }
  ],
  env: [
    {
      operationId: "document-django-anymail-env",
      description: "Document Anymail environment variables.",
      path: ".env.example",
      variables: {
        ANYMAIL_API_KEY: "",
        DEFAULT_FROM_EMAIL: "noreply@example.com"
      }
    }
  ]
});

export const awsSdkS3Integration = createConfiguredDependencyIntegration({
  manifest: {
    id: "aws-sdk-s3",
    name: "AWS SDK S3 Client",
    description: "Amazon S3 client support for Node.js applications.",
    capability: "storage",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "@aws-sdk/client-s3", type: "runtime" }],
    configures: ["runtime dependency", "S3 client helper", "S3 env examples"],
    source: { owner: "avis" }
  },
  packageName: "@aws-sdk/client-s3",
  planTitle: "Add AWS SDK S3 Client",
  dependencyOperationId: "add-aws-sdk-s3",
  dependencyDescription: "Install AWS SDK S3 Client.",
  compatibilityDescription: "Node projects",
  files: [
    {
      operationId: "create-node-s3-client",
      description: "Create a reusable S3 client helper.",
      path: "src/lib/storage.ts",
      requiredText: "new S3Client",
      contents: `import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION
});

export const s3Bucket = process.env.AWS_S3_BUCKET;
`
    }
  ],
  env: [
    {
      operationId: "document-node-s3-env",
      description: "Document S3 environment variables.",
      path: ".env.example",
      variables: {
        AWS_REGION: "",
        AWS_S3_BUCKET: ""
      }
    }
  ]
});

export const djangoStoragesIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "django-storages",
    name: "django-storages",
    description: "Storage backends for Django file and media uploads.",
    capability: "storage",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "django-storages", type: "runtime" }],
    configures: ["runtime dependency", "Django S3 storage settings snippet", "S3 env examples"],
    source: { owner: "avis" }
  },
  packageName: "django-storages",
  planTitle: "Add django-storages",
  dependencyOperationId: "add-django-storages",
  dependencyDescription: "Install django-storages.",
  compatibilityDescription: "Django projects",
  files: [
    {
      operationId: "create-django-storages-settings",
      description: "Create a Django S3 storage settings snippet.",
      path: "config/avis_storage.py",
      requiredText: "storages.backends.s3.S3Storage",
      contents: `import os


AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME", "")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "")

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
`
    }
  ],
  env: [
    {
      operationId: "document-django-storages-env",
      description: "Document Django storage environment variables.",
      path: ".env.example",
      variables: {
        AWS_STORAGE_BUCKET_NAME: "",
        AWS_S3_REGION_NAME: ""
      }
    }
  ]
});

export const flysystemS3Integration = createDependencyOnlyIntegration({
  manifest: {
    id: "flysystem-s3",
    name: "Flysystem AWS S3 Adapter",
    description: "Amazon S3 filesystem adapter for PHP and Laravel applications.",
    capability: "storage",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.php],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [{ name: "league/flysystem-aws-s3-v3", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "league/flysystem-aws-s3-v3",
  planTitle: "Add Flysystem AWS S3 Adapter",
  dependencyOperationId: "add-flysystem-s3",
  dependencyDescription: "Install Flysystem AWS S3 Adapter.",
  compatibilityDescription: "PHP projects"
});

export const drfSpectacularIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "drf-spectacular",
    name: "drf-spectacular",
    description: "OpenAPI schema generation for Django REST Framework APIs.",
    capability: "api-documentation",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: pythonPackageManagers
    },
    dependencies: [{ name: "drf-spectacular", type: "runtime" }],
    configures: ["runtime dependency", "Django OpenAPI settings snippet"],
    source: { owner: "avis" }
  },
  packageName: "drf-spectacular",
  planTitle: "Add drf-spectacular",
  dependencyOperationId: "add-drf-spectacular",
  dependencyDescription: "Install drf-spectacular.",
  compatibilityDescription: "Django projects",
  files: [
    {
      operationId: "create-drf-spectacular-settings",
      description: "Create a DRF Spectacular settings snippet.",
      path: "config/avis_openapi.py",
      requiredText: "SPECTACULAR_SETTINGS",
      contents: `SPECTACULAR_SETTINGS = {
    "TITLE": "API",
    "DESCRIPTION": "OpenAPI schema generated by drf-spectacular.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
`
    }
  ]
});

export const swaggerUiExpressIntegration = createConfiguredDependencyIntegration({
  manifest: {
    id: "swagger-ui-express",
    name: "swagger-ui-express",
    description: "Swagger UI middleware for Express applications.",
    capability: "api-documentation",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.node],
      frameworks: [frameworks.express],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "swagger-ui-express", type: "runtime" }],
    configures: ["runtime dependency", "Express OpenAPI helper"],
    source: { owner: "avis" }
  },
  packageName: "swagger-ui-express",
  planTitle: "Add swagger-ui-express",
  dependencyOperationId: "add-swagger-ui-express",
  dependencyDescription: "Install swagger-ui-express.",
  compatibilityDescription: "Express projects",
  files: [
    {
      operationId: "create-express-openapi-helper",
      description: "Create an Express Swagger UI helper.",
      path: "src/openapi.ts",
      requiredText: "swaggerUi.setup",
      contents: `import swaggerUi from "swagger-ui-express";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0"
  },
  paths: {}
};

export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiHandler = swaggerUi.setup(openApiDocument);
`
    }
  ]
});

export const dotenvIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "dotenv",
    name: "dotenv",
    description: "Environment variable loading for Node.js applications.",
    capability: "configuration",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.node],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "dotenv", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "dotenv",
  planTitle: "Add dotenv",
  dependencyOperationId: "add-dotenv",
  dependencyDescription: "Install dotenv.",
  compatibilityDescription: "Node projects"
});

export const phpdotenvIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "phpdotenv",
    name: "phpdotenv",
    description: "Environment variable loading for PHP applications.",
    capability: "configuration",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.php],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [{ name: "vlucas/phpdotenv", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "vlucas/phpdotenv",
  planTitle: "Add phpdotenv",
  dependencyOperationId: "add-phpdotenv",
  dependencyDescription: "Install phpdotenv.",
  compatibilityDescription: "PHP projects"
});

export const rustConfigIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "rust-config",
    name: "config-rs",
    description: "Layered configuration loading for Rust applications.",
    capability: "configuration",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.rust],
      packageManagers: [packageManagers.cargo]
    },
    dependencies: [{ name: "config", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "config",
  planTitle: "Add config-rs",
  dependencyOperationId: "add-rust-config",
  dependencyDescription: "Install config-rs.",
  compatibilityDescription: "Rust projects"
});

export const viperIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "viper",
    name: "Viper",
    description: "Configuration loading for Go applications.",
    capability: "configuration",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.go],
      packageManagers: [packageManagers.go]
    },
    dependencies: [{ name: "github.com/spf13/viper", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "github.com/spf13/viper",
  planTitle: "Add Viper",
  dependencyOperationId: "add-viper",
  dependencyDescription: "Install Viper.",
  compatibilityDescription: "Go projects"
});

export const helmetIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "helmet",
    name: "Helmet",
    description: "Secure HTTP response headers for Express applications.",
    capability: "security",
    version: "1.0.0",
    status: "stable",
    trust: "verified",
    supports: {
      ecosystems: [ecosystems.node],
      frameworks: [frameworks.express],
      packageManagers: nodePackageManagers
    },
    dependencies: [{ name: "helmet", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "helmet",
  planTitle: "Add Helmet",
  dependencyOperationId: "add-helmet",
  dependencyDescription: "Install Helmet.",
  compatibilityDescription: "Express projects"
});

export const officialCapabilityIntegrations = [
  djangoSimpleJwtIntegration,
  sentryNextjsIntegration,
  sentryPythonIntegration,
  sentryLaravelIntegration,
  sentryFlutterIntegration,
  sentryRustIntegration,
  sentryGoIntegration,
  vitestIntegration,
  pytestDjangoIntegration,
  nodePostgresIntegration,
  psycopgIntegration,
  rustSqlxIntegration,
  goPgxIntegration,
  sqlalchemyIntegration,
  gormIntegration,
  redisNodeIntegration,
  djangoRedisIntegration,
  predisIntegration,
  goRedisIntegration,
  bullmqIntegration,
  celeryIntegration,
  laravelHorizonIntegration,
  resendNodeIntegration,
  djangoAnymailIntegration,
  awsSdkS3Integration,
  djangoStoragesIntegration,
  flysystemS3Integration,
  drfSpectacularIntegration,
  swaggerUiExpressIntegration,
  dotenvIntegration,
  phpdotenvIntegration,
  rustConfigIntegration,
  viperIntegration,
  helmetIntegration
];
