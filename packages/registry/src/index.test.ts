import { describe, expect, it } from "vitest";
import type { AvisIntegration, ProjectContext } from "@avis/core";
import {
  builtInCapabilities,
  builtInIntegrations,
  detectableDartFrameworkIds,
  detectableGoFrameworkIds,
  detectableNodeFrameworkIds,
  detectablePhpFrameworkIds,
  detectablePythonFrameworkIds,
  detectableRustFrameworkIds,
  ecosystems,
  frameworkDefinitions,
  frameworks,
  packageManagers,
  projectTypes
} from "@avis/core";
import {
  IntegrationRegistry,
  validateIntegrationManifest,
  validateRegistryCatalog,
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

  it("finds only relevant capabilities with compatible integrations", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "icons",
          name: "Icons"
        },
        {
          id: "database",
          name: "Database"
        }
      ],
      integrations: [lucideReactIntegration]
    });

    expect(registry.findAvailableCapabilities(nextContext).map((capability) => capability.id)).toEqual([
      "icons"
    ]);
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
    expect(recommendations[0]?.reasons).toContain("configure setup maturity");
  });

  it("prefers framework defaults over ecosystem defaults", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "auth",
          name: "Authentication",
          defaultIntegrations: {
            node: "ecosystem-auth"
          },
          defaultFrameworkIntegrations: {
            nextjs: "next-auth"
          }
        }
      ],
      integrations: [ecosystemAuthIntegration, nextAuthRegistryIntegration]
    });

    const recommendations = registry.recommendIntegrationsForCapability(
      "auth",
      nextContext
    );

    expect(recommendations.map((entry) => entry.integration.manifest.id)).toEqual([
      "next-auth",
      "ecosystem-auth"
    ]);
    expect(recommendations[0]?.reasons).toContain(
      "default recommendation for this framework"
    );
  });

  it("reports native framework capability support separately from integrations", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "api-documentation",
          name: "API Documentation",
          nativeFrameworkSupport: {
            fastapi: "FastAPI exposes OpenAPI natively."
          }
        }
      ],
      integrations: []
    });

    expect(
      registry.findNativeCapabilitySupport("api-documentation", {
        ...nextContext,
        ecosystem: "python",
        framework: {
          id: "fastapi"
        },
        frameworks: [
          {
            id: "fastapi"
          }
        ]
      })
    ).toEqual({
      capability: {
        id: "api-documentation",
        name: "API Documentation",
        nativeFrameworkSupport: {
          fastapi: "FastAPI exposes OpenAPI natively."
        }
      },
      framework: "fastapi",
      description: "FastAPI exposes OpenAPI natively."
    });
  });

  it("resolves stacks through capability recommendations", () => {
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
      integrations: [reactIconsIntegration, lucideReactIntegration],
      stacks: [
        {
          id: "next-standard",
          name: "Next Standard",
          capabilities: ["icons"]
        }
      ]
    });

    expect(
      registry.resolveStack("next-standard", nextContext)?.integrations.map(
        (integration) => integration.manifest.id
      )
    ).toEqual(["lucide-react"]);
  });

  it("detects conflicts for exclusive capabilities", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "state-management",
          name: "State Management",
          exclusive: true
        }
      ],
      integrations: [nextIntegration, alternateStateIntegration]
    });

    expect(
      registry.detectIntegrationConflicts([nextIntegration, alternateStateIntegration])
    ).toEqual([
      "Capability state-management is exclusive, but stack selects zustand, redux-toolkit."
    ]);
  });

  it("detects installed alternatives for exclusive capabilities", async () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "state-management",
          name: "State Management",
          exclusive: true
        }
      ],
      integrations: [nextIntegration, installedAlternateStateIntegration]
    });

    await expect(
      registry.findInstalledCapabilityConflicts(nextIntegration, nextContext)
    ).resolves.toEqual([
      "Detected existing state-management integration redux-toolkit with health healthy. Adding zustand may duplicate project architecture."
    ]);
  });

  it("searches capabilities, integrations, and stacks", () => {
    const registry = new IntegrationRegistry({
      capabilities: [
        {
          id: "icons",
          name: "Icons",
          aliases: ["icon-pack"]
        }
      ],
      integrations: [lucideReactIntegration],
      stacks: [
        {
          id: "next-standard",
          name: "Next Standard",
          description: "Common Next.js app capabilities.",
          capabilities: ["icons"]
        }
      ]
    });

    expect(registry.search("icon").map((result) => `${result.kind}:${result.id}`)).toEqual([
      "capability:icons",
      "integration:lucide-react",
      "stack:next-standard"
    ]);
    expect(registry.search("icon package")[0]?.id).toBe("icons");
    expect(registry.search("api-auth").map((result) => result.id)).not.toContain(
      "lucide-react"
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
        trust: "official",
        setupMaturity: undefined as never,
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
        "Integration setup maturity is invalid.",
        "Integration must support at least one ecosystem."
      ]
    });
  });

  it("accepts local integration trust metadata", () => {
    expect(
      validateIntegrationManifest({
        id: "company-auth",
        name: "Company Auth",
        description: "Internal auth package.",
        capability: "auth",
        version: "0.1.0",
        status: "experimental",
        trust: "local",
        setupMaturity: "install",
        supports: {
          ecosystems: ["node"]
        },
        source: {
          owner: "local",
          path: "company-auth"
        }
      })
    ).toEqual({
      valid: true,
      errors: []
    });
  });

  it("rejects invalid setup maturity metadata", () => {
    expect(
      validateIntegrationManifest({
        id: "company-auth",
        name: "Company Auth",
        description: "Internal auth package.",
        capability: "auth",
        version: "0.1.0",
        status: "experimental",
        trust: "local",
        setupMaturity: "deep" as never,
        supports: {
          ecosystems: ["node"]
        }
      })
    ).toEqual({
      valid: false,
      errors: ["Integration setup maturity is invalid."]
    });
  });

  it("validates catalog references and detectable framework coverage", () => {
    expect(
      validateRegistryCatalog({
        capabilities: [
          {
            id: "icons",
            name: "Icons",
            defaultIntegrations: {
              node: "lucide-react"
            }
          }
        ],
        integrations: [lucideReactIntegration],
        knownEcosystemIds: ["node"],
        knownFrameworkIds: ["nextjs"],
        knownPackageManagerIds: ["pnpm"],
        detectableFrameworkIds: ["nextjs"]
      })
    ).toEqual({
      valid: true,
      errors: []
    });

    expect(
      validateRegistryCatalog({
        capabilities: [
          {
            id: "icons",
            name: "Icons",
            defaultIntegrations: {
              node: "missing-icons"
            }
          }
        ],
        integrations: [
          {
            ...lucideReactIntegration,
            manifest: {
              ...lucideReactIntegration.manifest,
              capability: "missing-capability",
              supports: {
                ecosystems: ["node"],
                frameworks: ["missing-framework"],
                packageManagers: ["missing-pm"]
              }
            }
          }
        ],
        knownEcosystemIds: ["node"],
        knownFrameworkIds: ["nextjs"],
        knownPackageManagerIds: ["pnpm"],
        detectableFrameworkIds: ["nextjs", "fastify"]
      }).errors
    ).toEqual([
      "Capability icons defaults to unknown integration missing-icons.",
      "Integration lucide-react references unknown capability missing-capability.",
      "Integration lucide-react supports unknown framework missing-framework.",
      "Integration lucide-react supports unknown package manager missing-pm.",
      "Detectable framework fastify is missing from the framework catalog."
    ]);
  });

  it("rejects managed integrations without verifier and repair support", () => {
    expect(
      validateRegistryCatalog({
        capabilities: [
          {
            id: "auth",
            name: "Authentication"
          }
        ],
        integrations: [
          {
            ...nextAuthRegistryIntegration,
            manifest: {
              ...nextAuthRegistryIntegration.manifest,
              setupMaturity: "managed",
              repair: "unsupported"
            }
          }
        ]
      }).errors
    ).toEqual([
      "Integration next-auth is managed but does not expose a verifier.",
      "Integration next-auth is managed but does not declare repair plan support.",
      "Integration next-auth is managed but does not declare non-dependency configuration behavior."
    ]);
  });

  it("validates the built-in release catalog contract", () => {
    const result = validateRegistryCatalog({
      capabilities: builtInCapabilities,
      integrations: builtInIntegrations,
      knownEcosystemIds: Object.values(ecosystems),
      knownFrameworkIds: Object.values(frameworks),
      knownPackageManagerIds: Object.values(packageManagers),
      knownProjectTypeIds: Object.values(projectTypes),
      detectableFrameworkIds: [
        ...detectableNodeFrameworkIds,
        ...detectablePythonFrameworkIds,
        ...detectablePhpFrameworkIds,
        ...detectableDartFrameworkIds,
        ...detectableRustFrameworkIds,
        ...detectableGoFrameworkIds
      ],
      frameworkDefinitions,
      managedIntegrationFixtureIds: [
        "django-rest-framework",
        "django-cors-headers"
      ]
    });

    expect(result).toEqual({
      valid: true,
      errors: []
    });
  });

  it("rejects invalid framework definitions and missing managed fixture coverage", () => {
    expect(
      validateRegistryCatalog({
        capabilities: [
          {
            id: "auth",
            name: "Authentication",
            defaultFrameworkIntegrations: {
              nextjs: "python-auth"
            },
            defaultProjectTypeIntegrations: {
              kiosk: "python-auth"
            }
          }
        ],
        integrations: [
          {
            manifest: {
              id: "python-auth",
              name: "Python Auth",
              description: "Python auth.",
              capability: "auth",
              version: "1.0.0",
              status: "stable",
              trust: "official",
              setupMaturity: "managed",
              repair: "plan",
              supports: {
                ecosystems: ["python"]
              },
              configures: ["runtime dependency", "auth settings"]
            },
            isCompatible: () => ({ supported: true }),
            plan: unusedPlan,
            verify: async () => ({
              integrationId: "python-auth",
              health: "healthy",
              checks: [],
              diagnostics: []
            })
          }
        ],
        knownEcosystemIds: ["node", "python"],
        knownFrameworkIds: ["nextjs", "fastify"],
        knownProjectTypeIds: ["backend"],
        detectableFrameworkIds: ["fastify"],
        frameworkDefinitions: [
          {
            id: "nextjs",
            name: "Next.js",
            ecosystem: "node",
            supportTier: "tier-1",
            defaultProjectType: "kiosk",
            relevantCapabilities: ["missing-capability"]
          }
        ],
        managedIntegrationFixtureIds: []
      }).errors
    ).toEqual([
      "Framework nextjs references unknown project type kiosk.",
      "Framework nextjs references unknown capability missing-capability.",
      "Capability auth defaults to python-auth for framework nextjs, but that integration does not support node.",
      "Capability auth has unknown default project type kiosk.",
      "Integration python-auth is managed but is missing release fixture coverage.",
      "Detectable framework fastify is missing from the framework catalog."
    ]);
  });

  it("keeps built-in framework recommendations ahead of ecosystem defaults", () => {
    const registry = new IntegrationRegistry({
      capabilities: builtInCapabilities,
      integrations: builtInIntegrations
    });

    expect(
      registry.recommendIntegrationsForCapability("auth", builtInNextContext)[0]
        ?.integration.manifest.id
    ).toBe("next-auth");
    expect(
      registry.recommendIntegrationsForCapability("auth", builtInDjangoContext)[0]
        ?.integration.manifest.id
    ).toBe("django-simple-jwt");
    expect(
      registry.recommendIntegrationsForCapability("auth", builtInLaravelContext)[0]
        ?.integration.manifest.id
    ).toBe("laravel-sanctum");
    expect(
      registry.recommendIntegrationsForCapability(
        "api-documentation",
        builtInDjangoContext
      )[0]?.integration.manifest.id
    ).toBe("drf-spectacular");
    expect(
      registry.recommendIntegrationsForCapability(
        "api-documentation",
        builtInExpressContext
      )[0]?.integration.manifest.id
    ).toBe("swagger-ui-express");
    expect(
      registry.findNativeCapabilitySupport(
        "api-documentation",
        builtInFastApiContext
      )?.description
    ).toContain("FastAPI exposes OpenAPI");
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
      errors: ["Stack must include at least one integration or capability."]
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

const nextCompatibleIntegration: AvisIntegration["isCompatible"] = (context) =>
  context.framework?.id === "nextjs"
    ? { supported: true }
    : { supported: false, reason: "Expected Next.js." };

const unusedPlan: AvisIntegration["plan"] = async () => {
  throw new Error("Not needed for registry tests.");
};

const alternateStateIntegration: AvisIntegration = {
  manifest: {
    id: "redux-toolkit",
    name: "Redux Toolkit",
    description: "State management.",
    capability: "state-management",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    setupMaturity: "configure",
    supports: {
      ecosystems: ["node"],
      frameworks: ["nextjs"]
    }
  },
  isCompatible: nextCompatibleIntegration,
  plan: unusedPlan
};

const installedAlternateStateIntegration: AvisIntegration = {
  ...alternateStateIntegration,
  verify: async () => ({
    integrationId: "redux-toolkit",
    health: "healthy",
    checks: [],
    diagnostics: []
  })
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
    trust: "official",
    setupMaturity: "configure",
    supports: {
      ecosystems: ["node"],
      frameworks: ["nextjs"]
    }
  },
  isCompatible: nextCompatibleIntegration,
  plan: unusedPlan
};

const lucideReactIntegration: AvisIntegration = {
  manifest: {
    id: "lucide-react",
    name: "Lucide React",
    description: "Icons.",
    capability: "icons",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    setupMaturity: "configure",
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
    trust: "official",
    setupMaturity: "configure",
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

const ecosystemAuthIntegration: AvisIntegration = {
  manifest: {
    id: "ecosystem-auth",
    name: "Ecosystem Auth",
    description: "Generic Node auth.",
    capability: "auth",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    setupMaturity: "install",
    supports: {
      ecosystems: ["node"]
    }
  },
  isCompatible: () => ({ supported: true }),
  plan: unusedPlan
};

const nextAuthRegistryIntegration: AvisIntegration = {
  manifest: {
    id: "next-auth",
    name: "Auth.js",
    description: "Next.js auth.",
    capability: "auth",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    setupMaturity: "configure",
    supports: {
      ecosystems: ["node"],
      frameworks: ["nextjs"]
    }
  },
  isCompatible: nextCompatibleIntegration,
  plan: unusedPlan
};

const builtInNextContext: ProjectContext = createBuiltInContext(
  ecosystems.node,
  frameworks.nextjs,
  packageManagers.pnpm,
  projectTypes.fullstack
);

const builtInExpressContext: ProjectContext = createBuiltInContext(
  ecosystems.node,
  frameworks.express,
  packageManagers.pnpm,
  projectTypes.backend
);

const builtInDjangoContext: ProjectContext = createBuiltInContext(
  ecosystems.python,
  frameworks.django,
  packageManagers.uv,
  projectTypes.backend
);

const builtInFastApiContext: ProjectContext = createBuiltInContext(
  ecosystems.python,
  frameworks.fastapi,
  packageManagers.uv,
  projectTypes.backend
);

const builtInLaravelContext: ProjectContext = createBuiltInContext(
  ecosystems.php,
  frameworks.laravel,
  packageManagers.composer,
  projectTypes.backend
);

function createBuiltInContext(
  ecosystem: ProjectContext["ecosystem"],
  frameworkId: NonNullable<ProjectContext["framework"]>["id"],
  packageManagerId: NonNullable<ProjectContext["packageManager"]>["id"],
  projectTypeId: NonNullable<ProjectContext["projectType"]>["id"]
): ProjectContext {
  const framework = { id: frameworkId, confidence: "high" as const };
  const packageManager = { id: packageManagerId, confidence: "high" as const };
  const projectType = { id: projectTypeId, confidence: "high" as const };

  return {
    workspaceRoot: "/project",
    targetRoot: "/project",
    targetId: "project",
    ecosystem,
    languages: [],
    framework,
    frameworks: [framework],
    packageManager,
    packageManagers: [packageManager],
    projectType,
    projectTypes: [projectType]
  };
}
