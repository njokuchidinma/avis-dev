import type { ChangePlan } from "../planning/change-plan.js";
import { createPackageManagerAdapter } from "../package-managers/factory.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type {
  AvisIntegration,
  AvisIntegrationManifest,
  CompatibilityResult
} from "./types.js";

export interface DependencyOnlyIntegrationOptions {
  manifest: AvisIntegrationManifest;
  packageName: string;
  planTitle: string;
  dependencyOperationId: string;
  dependencyDescription: string;
  compatibilityDescription: string;
}

export function createDependencyOnlyIntegration(
  options: DependencyOnlyIntegrationOptions
): AvisIntegration {
  return {
    manifest: options.manifest,
    isCompatible: (context) => isCompatible(context, options),
    plan: async ({ context }): Promise<ChangePlan> => {
      const compatibility = isCompatible(context, options);
      if (!compatibility.supported) {
        return incompatiblePlan(context, options, compatibility.reason);
      }

      const packageManagerId = context.packageManager?.id;
      if (!packageManagerId) {
        throw new Error("Cannot plan dependency integration without a package manager.");
      }

      const packageManager = createPackageManagerAdapter(packageManagerId);
      const dependencyInstalled = await packageManager.isDependencyInstalled(
        context,
        options.packageName
      );

      return {
        id: options.manifest.id,
        title: options.planTitle,
        integrationId: options.manifest.id,
        target: context,
        operations: dependencyInstalled
          ? []
          : [
              {
                id: options.dependencyOperationId,
                type: "dependency.add",
                description: options.dependencyDescription,
                dependencyType: "runtime",
                packageManager: packageManagerId,
                packages: [{ name: options.packageName }]
              }
            ],
        diagnostics: []
      };
    },
    verify: async (context): Promise<VerificationResult> =>
      verifyDependencyOnlyIntegration(context, options)
  };
}

function isCompatible(
  context: ProjectContext,
  options: DependencyOnlyIntegrationOptions
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

function incompatiblePlan(
  context: ProjectContext,
  options: DependencyOnlyIntegrationOptions,
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

async function verifyDependencyOnlyIntegration(
  context: ProjectContext,
  options: DependencyOnlyIntegrationOptions
): Promise<VerificationResult> {
  if (!context.packageManager) {
    return {
      integrationId: options.manifest.id,
      health: "unknown",
      checks: [
        {
          id: `${options.manifest.id}-package-manager`,
          label: "package manager detected",
          status: "skipped",
          message: "No supported package manager was detected.",
          remediation: `Run avis add ${options.manifest.id} in a supported project.`
        }
      ],
      diagnostics: []
    };
  }

  const packageManager = createPackageManagerAdapter(context.packageManager.id);
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    options.packageName
  );

  return {
    integrationId: options.manifest.id,
    health: dependencyInstalled ? "healthy" : "not-installed",
    checks: [
      {
        id: `${options.manifest.id}-dependency`,
        label: "dependency installed",
        status: dependencyInstalled ? "pass" : "skipped",
        message: dependencyInstalled ? undefined : `${options.packageName} is not installed.`,
        remediation: dependencyInstalled
          ? undefined
          : `Run avis add ${options.manifest.id}.`
      }
    ],
    diagnostics: []
  };
}
