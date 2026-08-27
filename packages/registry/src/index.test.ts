import { describe, expect, it } from "vitest";
import type { AvisIntegration, ProjectContext } from "@avis/core";
import {
  IntegrationRegistry,
  validateIntegrationManifest,
  validateStackManifest
} from "./index.js";

describe("IntegrationRegistry", () => {
  it("finds compatible integrations for a project context", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "state-management",
          name: "State Management"
        }
      ],
      integrations: [nextIntegration]
    });

    expect(registry.findCompatibleIntegrations(nextContext)).toEqual([nextIntegration]);
    expect(registry.findCompatibleIntegrations(unknownNodeContext)).toEqual([]);
  });

  it("groups integrations by supported ecosystem and framework", () => {
    const registry = new IntegrationRegistry({
      capabilities: [],
      integrations: [nextIntegration]
    });

    expect(registry.getSupportGroups()).toEqual([
      {
        ecosystem: "node",
        framework: "nextjs",
        integrations: [nextIntegration]
      }
    ]);
  });
});

describe("manifest validation", () => {
  it("validates integration manifests", () => {
    expect(
      validateIntegrationManifest({
        id: "",
        name: "Broken",
        capability: "",
        supports: {
          ecosystems: []
        }
      })
    ).toEqual({
      valid: false,
      errors: [
        "Integration id is required.",
        "Integration capability is required.",
        "Integration must support at least one ecosystem."
      ]
    });
  });

  it("validates stack manifests", () => {
    expect(
      validateStackManifest({
        id: "web-app",
        name: "Web App",
        integrations: []
      })
    ).toEqual({
      valid: false,
      errors: ["Stack must include at least one integration."]
    });
  });
});

const nextContext: ProjectContext = {
  workspaceRoot: "/project",
  targetRoot: "/project",
  targetId: "project",
  ecosystem: "node",
  languages: ["typescript"],
  framework: {
    id: "nextjs"
  },
  packageManager: {
    id: "pnpm"
  }
};

const unknownNodeContext: ProjectContext = {
  ...nextContext,
  framework: undefined
};

const nextIntegration: AvisIntegration = {
  id: "zustand",
  name: "Zustand",
  capability: "state-management",
  supports: {
    ecosystems: ["node"],
    frameworks: ["nextjs"]
  },
  isCompatible: (context) =>
    context.framework?.id === "nextjs"
      ? { supported: true }
      : { supported: false, reason: "Expected Next.js." },
  plan: async () => {
    throw new Error("Not needed for registry tests.");
  }
};
