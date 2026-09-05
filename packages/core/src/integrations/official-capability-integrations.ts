import { readFile } from "node:fs/promises";
import path from "node:path";
import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { createPythonPackageManagerAdapter } from "../package-managers/python.js";
import type { ChangePlan } from "../planning/change-plan.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import { findDjangoSettingsPath } from "./django-settings.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

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

export const sentryNextjsIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "@sentry/nextjs",
  planTitle: "Add Sentry for Next.js",
  dependencyOperationId: "add-sentry-nextjs",
  dependencyDescription: "Install Sentry for Next.js.",
  compatibilityDescription: "Next.js projects"
});

export const sentryPythonIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "sentry-sdk",
  planTitle: "Add Sentry Python SDK",
  dependencyOperationId: "add-sentry-python",
  dependencyDescription: "Install Sentry Python SDK.",
  compatibilityDescription: "Python projects"
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

export const sqlalchemyIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "sqlalchemy",
  planTitle: "Add SQLAlchemy",
  dependencyOperationId: "add-sqlalchemy",
  dependencyDescription: "Install SQLAlchemy.",
  compatibilityDescription: "Python projects"
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

export const redisNodeIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "redis",
  planTitle: "Add Redis for Node.js",
  dependencyOperationId: "add-redis-node",
  dependencyDescription: "Install Redis for Node.js.",
  compatibilityDescription: "Node projects"
});

export const djangoRedisIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "django-redis",
  planTitle: "Add django-redis",
  dependencyOperationId: "add-django-redis",
  dependencyDescription: "Install django-redis.",
  compatibilityDescription: "Django projects"
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

export const resendNodeIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "resend",
  planTitle: "Add Resend Node SDK",
  dependencyOperationId: "add-resend-node",
  dependencyDescription: "Install Resend Node SDK.",
  compatibilityDescription: "Node projects"
});

export const djangoAnymailIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "django-anymail",
  planTitle: "Add django-anymail",
  dependencyOperationId: "add-django-anymail",
  dependencyDescription: "Install django-anymail.",
  compatibilityDescription: "Django projects"
});

export const awsSdkS3Integration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "@aws-sdk/client-s3",
  planTitle: "Add AWS SDK S3 Client",
  dependencyOperationId: "add-aws-sdk-s3",
  dependencyDescription: "Install AWS SDK S3 Client.",
  compatibilityDescription: "Node projects"
});

export const djangoStoragesIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "django-storages",
  planTitle: "Add django-storages",
  dependencyOperationId: "add-django-storages",
  dependencyDescription: "Install django-storages.",
  compatibilityDescription: "Django projects"
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

export const drfSpectacularIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "drf-spectacular",
  planTitle: "Add drf-spectacular",
  dependencyOperationId: "add-drf-spectacular",
  dependencyDescription: "Install drf-spectacular.",
  compatibilityDescription: "Django projects"
});

export const swaggerUiExpressIntegration = createDependencyOnlyIntegration({
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "swagger-ui-express",
  planTitle: "Add swagger-ui-express",
  dependencyOperationId: "add-swagger-ui-express",
  dependencyDescription: "Install swagger-ui-express.",
  compatibilityDescription: "Express projects"
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
