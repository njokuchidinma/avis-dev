import type { ChangePlan } from "../planning/change-plan.js";
import { createPhpPackageManagerAdapter } from "../package-managers/php.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const integrationId = "laravel-sanctum";
const packageName = "laravel/sanctum";

export const laravelSanctumIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "Laravel Sanctum",
    description: "Token and session authentication for Laravel applications.",
    capability: "auth",
    version: "1.0.0",
    status: "experimental",
    supports: {
      ecosystems: [ecosystems.php],
      frameworks: [frameworks.laravel],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  isCompatible: isLaravelSanctumCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isLaravelSanctumCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.composer;
    const packageManager = createPhpPackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );

    return {
      id: integrationId,
      title: "Add Laravel Sanctum",
      integrationId,
      target: context,
      operations: dependencyInstalled
        ? []
        : [
            {
              id: "add-laravel-sanctum",
              type: "dependency.add",
              description: "Install Laravel Sanctum.",
              dependencyType: "runtime",
              packageManager: packageManagerId,
              packages: [{ name: packageName }]
            }
          ],
      diagnostics: []
    };
  },
  verify: verifyLaravelSanctum
};

function isLaravelSanctumCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.php) {
    return {
      supported: false,
      reason: "Laravel Sanctum integration supports PHP projects only."
    };
  }

  if (context.framework?.id !== frameworks.laravel) {
    return {
      supported: false,
      reason: "Laravel Sanctum integration requires a detected Laravel project."
    };
  }

  if (context.packageManager?.id !== packageManagers.composer) {
    return {
      supported: false,
      reason: "Laravel Sanctum integration requires Composer."
    };
  }

  return { supported: true };
}

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: integrationId,
    title: "Add Laravel Sanctum",
    integrationId,
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

async function verifyLaravelSanctum(
  context: ProjectContext
): Promise<VerificationResult> {
  const packageManager = createPhpPackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.composer
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );

  return {
    integrationId,
    health: dependencyInstalled ? "healthy" : "not-installed",
    checks: [
      {
        id: "laravel-sanctum-dependency",
        label: "dependency installed",
        status: dependencyInstalled ? "pass" : "skipped",
        message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
        remediation: dependencyInstalled ? undefined : "Run avis add laravel-sanctum."
      }
    ],
    diagnostics: []
  };
}
