import { axumTowerHttpIntegration } from "./axum-tower-http.js";
import { flutterRiverpodIntegration } from "./flutter-riverpod.js";
import { djangoCorsHeadersIntegration } from "./django-cors-headers.js";
import { djangoRestFrameworkIntegration } from "./django-rest-framework.js";
import { expoSecureStoreIntegration } from "./expo-secure-store.js";
import { fastapiPydanticSettingsIntegration } from "./fastapi-pydantic-settings.js";
import { flutterGoRouterIntegration } from "./flutter-go-router.js";
import { ginValidatorIntegration } from "./gin-validator.js";
import { heroiconsReactIntegration } from "./heroicons-react.js";
import { laravelPestIntegration } from "./laravel-pest.js";
import { laravelSanctumIntegration } from "./laravel-sanctum.js";
import { lucideReactIntegration } from "./lucide-react.js";
import { nextAuthIntegration } from "./next-auth.js";
import { officialCapabilityIntegrations } from "./official-capability-integrations.js";
import type { ProjectContext } from "../types/project-context.js";
import { ecosystems } from "../types/ids.js";
import { reactHookFormIntegration } from "./react-hook-form.js";
import { reactIconsIntegration } from "./react-icons.js";
import { reactRouterDomIntegration } from "./react-router-dom.js";
import { reduxToolkitIntegration } from "./redux-toolkit.js";
import { rustTracingIntegration } from "./rust-tracing.js";
import { tanstackQueryIntegration } from "./tanstack-query.js";
import type { AvisIntegration, Capability } from "./types.js";
import { zodIntegration } from "./zod.js";
import { zustandIntegration } from "./zustand.js";

export const builtInCapabilities: Capability[] = [
  {
    id: "state-management",
    name: "State Management",
    description: "Client-side application state.",
    aliases: ["state", "store", "stores"],
    defaultIntegrations: {
      [ecosystems.node]: "zustand",
      [ecosystems.dart]: "flutter-riverpod"
    },
    exclusive: true
  },
  {
    id: "data-fetching",
    name: "Data Fetching",
    description: "Client-side server-state and API fetching.",
    defaultIntegrations: {
      [ecosystems.node]: "tanstack-query"
    }
  },
  {
    id: "api",
    name: "API",
    description: "API framework extensions and tooling.",
    aliases: ["api-tooling", "rest-api"],
    defaultIntegrations: {
      [ecosystems.python]: "django-rest-framework",
      [ecosystems.rust]: "axum-tower-http"
    }
  },
  {
    id: "forms",
    name: "Forms",
    description: "Form state and submission helpers.",
    aliases: ["form", "form-state"],
    defaultIntegrations: {
      [ecosystems.node]: "react-hook-form"
    }
  },
  {
    id: "validation",
    name: "Validation",
    description: "Runtime schema validation.",
    aliases: ["schemas", "schema-validation"],
    defaultIntegrations: {
      [ecosystems.node]: "zod",
      [ecosystems.go]: "gin-validator"
    }
  },
  {
    id: "auth",
    name: "Authentication",
    description: "Authentication and API access control.",
    aliases: ["authentication", "api-auth", "access-control"],
    defaultIntegrations: {
      [ecosystems.node]: "next-auth",
      [ecosystems.python]: "django-simple-jwt",
      [ecosystems.php]: "laravel-sanctum"
    }
  },
  {
    id: "observability",
    name: "Observability",
    description: "Logging, tracing, and error visibility.",
    aliases: ["logging", "tracing"],
    defaultIntegrations: {
      [ecosystems.rust]: "rust-tracing"
    }
  },
  {
    id: "icons",
    name: "Icons",
    description: "Icon libraries and icon systems for application interfaces.",
    aliases: ["icon", "icon-pack", "icon-system"],
    defaultIntegrations: {
      [ecosystems.node]: "lucide-react"
    }
  },
  {
    id: "authorization",
    name: "Authorization",
    description: "Role, permission, and access-policy support."
  },
  {
    id: "api-documentation",
    name: "API Documentation",
    description: "OpenAPI, schema, and API reference tooling.",
    aliases: ["openapi", "swagger"],
    defaultIntegrations: {
      [ecosystems.node]: "swagger-ui-express",
      [ecosystems.python]: "drf-spectacular"
    }
  },
  {
    id: "routing",
    name: "Routing",
    description: "Application navigation and request routing.",
    defaultIntegrations: {
      [ecosystems.node]: "react-router-dom",
      [ecosystems.dart]: "flutter-go-router"
    }
  },
  {
    id: "networking",
    name: "Networking",
    description: "HTTP clients and network request helpers."
  },
  {
    id: "database",
    name: "Database",
    description: "Database clients and persistence setup.",
    defaultIntegrations: {
      [ecosystems.node]: "node-postgres",
      [ecosystems.python]: "psycopg",
      [ecosystems.rust]: "rust-sqlx",
      [ecosystems.go]: "go-pgx"
    }
  },
  {
    id: "orm",
    name: "ORM",
    description: "Object-relational mapping and query builders.",
    defaultIntegrations: {
      [ecosystems.python]: "sqlalchemy",
      [ecosystems.go]: "gorm"
    }
  },
  {
    id: "migrations",
    name: "Migrations",
    description: "Database schema migration tooling."
  },
  {
    id: "caching",
    name: "Caching",
    description: "Application cache clients and cache configuration.",
    defaultIntegrations: {
      [ecosystems.node]: "redis-node",
      [ecosystems.python]: "django-redis",
      [ecosystems.php]: "predis",
      [ecosystems.go]: "go-redis"
    }
  },
  {
    id: "background-jobs",
    name: "Background Jobs",
    description: "Asynchronous work processing.",
    aliases: ["jobs", "workers"],
    defaultIntegrations: {
      [ecosystems.node]: "bullmq",
      [ecosystems.python]: "celery",
      [ecosystems.php]: "laravel-horizon"
    }
  },
  {
    id: "queues",
    name: "Queues",
    description: "Queue-backed task processing."
  },
  {
    id: "messaging",
    name: "Messaging",
    description: "Message broker and event-stream integrations."
  },
  {
    id: "logging",
    name: "Logging",
    description: "Structured application logging."
  },
  {
    id: "monitoring",
    name: "Monitoring",
    description: "Runtime health, metrics, and error monitoring.",
    defaultIntegrations: {
      [ecosystems.node]: "sentry-nextjs",
      [ecosystems.python]: "sentry-python",
      [ecosystems.php]: "sentry-laravel",
      [ecosystems.dart]: "sentry-flutter",
      [ecosystems.rust]: "sentry-rust",
      [ecosystems.go]: "sentry-go"
    }
  },
  {
    id: "storage",
    name: "Storage",
    description: "Object, file, and media storage integrations.",
    defaultIntegrations: {
      [ecosystems.node]: "aws-sdk-s3",
      [ecosystems.python]: "django-storages",
      [ecosystems.php]: "flysystem-s3"
    }
  },
  {
    id: "local-storage",
    name: "Local Storage",
    description: "Device-local persistence."
  },
  {
    id: "secure-storage",
    name: "Secure Storage",
    description: "Encrypted or platform-secure local persistence.",
    defaultIntegrations: {
      [ecosystems.node]: "expo-secure-store"
    }
  },
  {
    id: "email",
    name: "Email",
    description: "Transactional email delivery.",
    defaultIntegrations: {
      [ecosystems.node]: "resend-node",
      [ecosystems.python]: "django-anymail"
    }
  },
  {
    id: "payments",
    name: "Payments",
    description: "Payment provider and checkout integrations."
  },
  {
    id: "internationalization",
    name: "Internationalization",
    description: "Localization and translation tooling.",
    aliases: ["i18n", "localization"]
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Product and usage analytics."
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Push, local, and user notification support."
  },
  {
    id: "configuration",
    name: "Configuration",
    description: "Application settings and environment configuration.",
    defaultIntegrations: {
      [ecosystems.node]: "dotenv",
      [ecosystems.python]: "fastapi-pydantic-settings",
      [ecosystems.php]: "phpdotenv",
      [ecosystems.rust]: "rust-config",
      [ecosystems.go]: "viper"
    }
  },
  {
    id: "security",
    name: "Security",
    description: "Security hardening and guardrail tooling.",
    defaultIntegrations: {
      [ecosystems.node]: "helmet",
      [ecosystems.python]: "django-cors-headers"
    }
  },
  {
    id: "testing",
    name: "Testing",
    description: "Project-native test framework setup and starter tests.",
    defaultIntegrations: {
      [ecosystems.node]: "vitest",
      [ecosystems.python]: "pytest-django",
      [ecosystems.php]: "laravel-pest"
    }
  },
  {
    id: "serialization",
    name: "Serialization",
    description: "Data serialization and DTO generation."
  },
  {
    id: "code-generation",
    name: "Code Generation",
    description: "Project-native generated code workflows."
  },
  {
    id: "cli",
    name: "CLI",
    description: "Command-line application tooling."
  },
  {
    id: "error-handling",
    name: "Error Handling",
    description: "Error modeling and propagation utilities."
  },
  {
    id: "crash-reporting",
    name: "Crash Reporting",
    description: "Mobile and client crash visibility."
  }
];

export const builtInIntegrations: AvisIntegration[] = [
  zustandIntegration,
  reduxToolkitIntegration,
  tanstackQueryIntegration,
  djangoRestFrameworkIntegration,
  reactHookFormIntegration,
  zodIntegration,
  laravelSanctumIntegration,
  flutterRiverpodIntegration,
  rustTracingIntegration,
  nextAuthIntegration,
  djangoCorsHeadersIntegration,
  laravelPestIntegration,
  flutterGoRouterIntegration,
  lucideReactIntegration,
  reactIconsIntegration,
  heroiconsReactIntegration,
  reactRouterDomIntegration,
  fastapiPydanticSettingsIntegration,
  expoSecureStoreIntegration,
  axumTowerHttpIntegration,
  ginValidatorIntegration,
  ...officialCapabilityIntegrations
];

export function findIntegrationById(id: string): AvisIntegration | undefined {
  return builtInIntegrations.find((integration) => integration.manifest.id === id);
}

export function findCapabilityById(id: string): Capability | undefined {
  return builtInCapabilities.find((capability) => capability.id === id);
}

export function findCompatibleIntegrationsForCapability(
  capabilityId: string,
  context: ProjectContext
): AvisIntegration[] {
  return builtInIntegrations.filter(
    (integration) =>
      integration.manifest.capability === capabilityId &&
      integration.isCompatible(context).supported
  );
}
