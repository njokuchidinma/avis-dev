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

  it("finds capabilities by aliases", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "icons",
          name: "Icons",
          aliases: ["icon", "icon-pack"]
        }
      ],
      integrations: []
    });

    expect(registry.findCapabilityByQuery("icon")?.id).toBe("icons");
    expect(registry.findCapabilityByQuery("Icon Pack")?.id).toBe("icons");
  });

  it("recommends the ecosystem default before alternatives", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "icons",
          name: "Icons",
          defaultIntegrations: {
            node: "lucide-react"
          }
        }
      ],
      integrations: [reactIconsIntegration, lucideReactIntegration]
    });

    const recommendations = registry.recommendIntegrationsForCapability(
      "icons",
      nextContext
    );

    expect(recommendations.map((entry) => entry.integration.manifest.id)).toEqual([
      "lucide-react",
      "react-icons"
    ]);
    expect(recommendations[0]?.recommended).toBe(true);
    expect(recommendations[0]?.reasons).toContain(
      "default recommendation for this ecosystem"
    );
  });
});

describe("manifest validation", () => {
  it("validates integration manifests", () => {
    expect(
      validateIntegrationManifest({
        id: "",
        name: "Broken",
        description: "",
        capability: "",
        version: "",
        status: "stable",
        supports: {
          ecosystems: []
        }
      })
    ).toEqual({
      valid: false,
      errors: [
        "Integration id is required.",
        "Integration capability is required.",
        "Integration description is required.",
        "Integration version is required.",
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
  manifest: {
    id: "zustand",
    name: "Zustand",
    description: "State management.",
    capability: "state-management",
    version: "1.0.0",
    status: "stable",
    supports: {
      ecosystems: ["node"],
      frameworks: ["nextjs"]
    }
  },
  isCompatible: (context) =>
    context.framework?.id === "nextjs"
      ? { supported: true }
      : { supported: false, reason: "Expected Next.js." },
  plan: async () => {
    throw new Error("Not needed for registry tests.");
  }
};

const lucideReactIntegration: AvisIntegration = {
  manifest: {
    id: "lucide-react",
    name: "Lucide React",
    description: "Icons.",
    capability: "icons",
    version: "1.0.0",
    status: "stable",
    supports: {
      ecosystems: ["node"],
      frameworks: ["nextjs"]
    },
    dependencies: [{ name: "lucide-react", type: "runtime" }],
    source: { owner: "avis" }
  },
  isCompatible: nextIntegration.isCompatible,
  plan: nextIntegration.plan
};

const reactIconsIntegration: AvisIntegration = {
  manifest: {
    id: "react-icons",
    name: "React Icons",
    description: "Icons.",
    capability: "icons",
    version: "1.0.0",
    status: "stable",
    supports: {
      ecosystems: ["node"],
      frameworks: ["nextjs"]
    },
    dependencies: [{ name: "react-icons", type: "runtime" }],
    source: { owner: "avis" }
  },
  isCompatible: nextIntegration.isCompatible,
  plan: nextIntegration.plan
};
