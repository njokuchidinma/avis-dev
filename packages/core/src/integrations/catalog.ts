import { flutterRiverpodIntegration } from "./flutter-riverpod.js";
import { djangoRestFrameworkIntegration } from "./django-rest-framework.js";
import { laravelSanctumIntegration } from "./laravel-sanctum.js";
import type { ProjectContext } from "../types/project-context.js";
import { reactHookFormIntegration } from "./react-hook-form.js";
import { rustTracingIntegration } from "./rust-tracing.js";
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
  },
  {
    id: "auth",
    name: "Authentication",
    description: "Authentication and API access control."
  },
  {
    id: "observability",
    name: "Observability",
    description: "Logging, tracing, and error visibility."
  }
];

export const builtInIntegrations: AvisIntegration[] = [
  zustandIntegration,
  tanstackQueryIntegration,
  djangoRestFrameworkIntegration,
  reactHookFormIntegration,
  zodIntegration,
  laravelSanctumIntegration,
  flutterRiverpodIntegration,
  rustTracingIntegration
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
