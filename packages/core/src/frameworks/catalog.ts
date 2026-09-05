import {
  ecosystems,
  frameworks,
  projectTypes
} from "../types/ids.js";
import type { CapabilityId, FrameworkId } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { FrameworkDefinition, FrameworkSupportTier } from "./types.js";

const frontendCapabilities: CapabilityId[] = [
  "state-management",
  "data-fetching",
  "forms",
  "validation",
  "icons",
  "routing",
  "monitoring",
  "analytics",
  "testing",
  "internationalization"
];

const backendCapabilities: CapabilityId[] = [
  "api",
  "auth",
  "authorization",
  "validation",
  "database",
  "orm",
  "caching",
  "background-jobs",
  "logging",
  "monitoring",
  "testing",
  "api-documentation",
  "storage",
  "email",
  "configuration",
  "security"
];

const mobileCapabilities: CapabilityId[] = [
  "state-management",
  "networking",
  "routing",
  "validation",
  "forms",
  "local-storage",
  "secure-storage",
  "auth",
  "monitoring",
  "analytics",
  "crash-reporting",
  "internationalization",
  "testing",
  "code-generation",
  "serialization",
  "notifications"
];

const rustBackendCapabilities: CapabilityId[] = [
  "api",
  "auth",
  "database",
  "migrations",
  "configuration",
  "logging",
  "observability",
  "serialization",
  "testing",
  "error-handling"
];

const goBackendCapabilities: CapabilityId[] = [
  "api",
  "routing",
  "validation",
  "database",
  "orm",
  "configuration",
  "logging",
  "auth",
  "caching",
  "background-jobs",
  "messaging",
  "monitoring",
  "testing",
  "cli"
];

export const frameworkDefinitions: FrameworkDefinition[] = [
  {
    id: frameworks.nextjs,
    name: "Next.js",
    ecosystem: ecosystems.node,
    supportTier: "tier-1",
    defaultProjectType: projectTypes.fullstack,
    relevantCapabilities: [...frontendCapabilities, "auth", "storage"]
  },
  {
    id: frameworks.react,
    name: "React",
    ecosystem: ecosystems.node,
    supportTier: "tier-2",
    defaultProjectType: projectTypes.frontend,
    relevantCapabilities: frontendCapabilities
  },
  {
    id: frameworks.expo,
    name: "Expo",
    ecosystem: ecosystems.node,
    supportTier: "tier-2",
    defaultProjectType: projectTypes.mobile,
    relevantCapabilities: mobileCapabilities
  },
  {
    id: frameworks.reactNative,
    name: "React Native",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.mobile,
    relevantCapabilities: mobileCapabilities
  },
  {
    id: frameworks.nestjs,
    name: "NestJS",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: backendCapabilities
  },
  {
    id: frameworks.express,
    name: "Express",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: backendCapabilities
  },
  {
    id: frameworks.vue,
    name: "Vue",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.frontend,
    relevantCapabilities: frontendCapabilities
  },
  {
    id: frameworks.nuxt,
    name: "Nuxt",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.fullstack,
    relevantCapabilities: [...frontendCapabilities, "auth", "storage"]
  },
  {
    id: frameworks.svelte,
    name: "Svelte",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.frontend,
    relevantCapabilities: frontendCapabilities
  },
  {
    id: frameworks.sveltekit,
    name: "SvelteKit",
    ecosystem: ecosystems.node,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.fullstack,
    relevantCapabilities: [...frontendCapabilities, "auth", "storage"]
  },
  {
    id: frameworks.django,
    name: "Django",
    ecosystem: ecosystems.python,
    supportTier: "tier-1",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: backendCapabilities
  },
  {
    id: frameworks.fastapi,
    name: "FastAPI",
    ecosystem: ecosystems.python,
    supportTier: "tier-2",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: backendCapabilities
  },
  {
    id: frameworks.flask,
    name: "Flask",
    ecosystem: ecosystems.python,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: backendCapabilities
  },
  {
    id: frameworks.laravel,
    name: "Laravel",
    ecosystem: ecosystems.php,
    supportTier: "tier-1",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: [...backendCapabilities, "payments"]
  },
  {
    id: frameworks.symfony,
    name: "Symfony",
    ecosystem: ecosystems.php,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: backendCapabilities
  },
  {
    id: frameworks.flutter,
    name: "Flutter",
    ecosystem: ecosystems.dart,
    supportTier: "tier-1",
    defaultProjectType: projectTypes.mobile,
    relevantCapabilities: mobileCapabilities
  },
  {
    id: frameworks.axum,
    name: "Axum",
    ecosystem: ecosystems.rust,
    supportTier: "tier-2",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: rustBackendCapabilities
  },
  {
    id: frameworks.actixWeb,
    name: "Actix Web",
    ecosystem: ecosystems.rust,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: rustBackendCapabilities
  },
  {
    id: frameworks.gin,
    name: "Gin",
    ecosystem: ecosystems.go,
    supportTier: "tier-2",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: goBackendCapabilities
  },
  {
    id: frameworks.fiber,
    name: "Fiber",
    ecosystem: ecosystems.go,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: goBackendCapabilities
  },
  {
    id: frameworks.echo,
    name: "Echo",
    ecosystem: ecosystems.go,
    supportTier: "tier-3",
    defaultProjectType: projectTypes.backend,
    relevantCapabilities: goBackendCapabilities
  }
];

export function findFrameworkDefinition(
  frameworkId: FrameworkId
): FrameworkDefinition | undefined {
  return frameworkDefinitions.find((definition) => definition.id === frameworkId);
}

export function getFrameworkSupportTier(
  frameworkId: FrameworkId
): FrameworkSupportTier | undefined {
  return findFrameworkDefinition(frameworkId)?.supportTier;
}

export function getRelevantCapabilitiesForContext(
  context: ProjectContext
): CapabilityId[] {
  const capabilities = new Set<CapabilityId>();

  for (const framework of context.frameworks ?? (context.framework ? [context.framework] : [])) {
    const definition = findFrameworkDefinition(framework.id);
    if (!definition || definition.ecosystem !== context.ecosystem) {
      continue;
    }

    for (const capability of definition.relevantCapabilities) {
      capabilities.add(capability);
    }
  }

  return Array.from(capabilities).sort();
}
