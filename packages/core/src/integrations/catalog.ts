import { djangoRestFrameworkIntegration } from "./django-rest-framework.js";
import type { ProjectContext } from "../types/project-context.js";
import { reactHookFormIntegration } from "./react-hook-form.js";
import { tanstackQueryIntegration } from "./tanstack-query.js";
import type { AvisIntegration, Capability } from "./types.js";
import { zodIntegration } from "./zod.js";
import { zustandIntegration } from "./zustand.js";

export const builtInCapabilities: Capability[] = [
  {
    id: "state-management",
    name: "State Management",
    description: "Client-side application state."
  },
  {
    id: "data-fetching",
    name: "Data Fetching",
    description: "Client-side server-state and API fetching."
  },
  {
    id: "api",
    name: "API",
    description: "API framework extensions and tooling."
  },
  {
    id: "forms",
    name: "Forms",
    description: "Form state and submission helpers."
  },
  {
    id: "validation",
    name: "Validation",
    description: "Runtime schema validation."
  }
];

export const builtInIntegrations: AvisIntegration[] = [
  zustandIntegration,
  tanstackQueryIntegration,
  djangoRestFrameworkIntegration,
  reactHookFormIntegration,
  zodIntegration
];

export function findIntegrationById(id: string): AvisIntegration | undefined {
  return builtInIntegrations.find((integration) => integration.id === id);
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
      integration.capability === capabilityId &&
      integration.isCompatible(context).supported
  );
}
