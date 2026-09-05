import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createPhpPackageManagerAdapter } from "../package-managers/php.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const integrationId = "laravel-pest";
const pestPackage = "pestphp/pest";
const laravelPluginPackage = "pestphp/pest-plugin-laravel";
const pestBootstrapPath = "tests/Pest.php";
const featureTestPath = "tests/Feature/AvisPestTest.php";

export const laravelPestIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "Pest for Laravel",
    description: "Pest testing setup and starter feature test for Laravel applications.",
    capability: "testing",
    version: "1.0.0",
    status: "stable",
    trust: "community",
    supports: {
      ecosystems: [ecosystems.php],
      frameworks: [frameworks.laravel],
      packageManagers: [packageManagers.composer]
    },
    dependencies: [
      { name: pestPackage, type: "development" },
      { name: laravelPluginPackage, type: "development" }
    ],
    configures: ["development dependencies", "Pest bootstrap", "starter feature test"],
    source: { owner: "avis" }
  },
  isCompatible: isLaravelPestCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isLaravelPestCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManager = createPhpPackageManagerAdapter(packageManagers.composer);
    const missingPackages = await getMissingPackages(context, packageManager);
    const pestBootstrapExists = await pathExists(
      path.join(context.targetRoot, pestBootstrapPath)
    );
    const featureTestExists = await pathExists(
      path.join(context.targetRoot, featureTestPath)
    );

    return {
      id: integrationId,
      title: "Add Pest for Laravel",
      integrationId,
      target: context,
      operations: [
        ...(missingPackages.length > 0
          ? [
              {
                id: "add-laravel-pest",
                type: "dependency.add" as const,
                description: "Install Pest and the Laravel Pest plugin.",
                dependencyType: "development" as const,
                packageManager: packageManagers.composer,
                packages: missingPackages.map((name) => ({ name }))
              }
            ]
          : []),
        ...(pestBootstrapExists
          ? []
          : [
              {
                id: "create-laravel-pest-bootstrap",
                type: "file.create" as const,
                description: "Create Pest's Laravel bootstrap file.",
                path: pestBootstrapPath,
                contents: createPestBootstrapContents(),
                overwrite: "never" as const
              }
            ]),
        ...(featureTestExists
          ? []
          : [
              {
                id: "create-laravel-pest-feature-test",
                type: "file.create" as const,
                description: "Create a starter Laravel Pest feature test.",
                path: featureTestPath,
                contents: createFeatureTestContents(),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyLaravelPest
};

function isLaravelPestCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.php) {
    return {
      supported: false,
      reason: "Pest for Laravel supports PHP projects only."
    };
  }

  if (context.framework?.id !== frameworks.laravel) {
    return {
      supported: false,
      reason: "Pest for Laravel requires a detected Laravel project."
    };
  }

  if (context.packageManager?.id !== packageManagers.composer) {
    return {
      supported: false,
      reason: "Pest for Laravel requires Composer."
    };
  }

  return { supported: true };
}

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: integrationId,
    title: "Add Pest for Laravel",
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

async function verifyLaravelPest(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createPhpPackageManagerAdapter(packageManagers.composer);
  const missingPackages = await getMissingPackages(context, packageManager);
  const dependenciesInstalled = missingPackages.length === 0;
  const pestBootstrapExists = await pathExists(
    path.join(context.targetRoot, pestBootstrapPath)
  );
  const featureTestExists = await pathExists(
    path.join(context.targetRoot, featureTestPath)
  );
  const checks = [
    {
      id: "laravel-pest-dependencies",
      label: "dependencies installed",
      status: dependenciesInstalled ? "pass" : "skipped",
      message: dependenciesInstalled
        ? undefined
        : `${missingPackages.join(", ")} is not installed.`,
      remediation: dependenciesInstalled ? undefined : "Run avis add laravel-pest."
    },
    {
      id: "laravel-pest-bootstrap",
      label: "Pest bootstrap detected",
      status: pestBootstrapExists ? "pass" : dependenciesInstalled ? "warning" : "skipped",
      message: pestBootstrapExists ? undefined : `${pestBootstrapPath} was not found.`,
      remediation: pestBootstrapExists
        ? undefined
        : "Run avis add laravel-pest to create Pest.php."
    },
    {
      id: "laravel-pest-feature-test",
      label: "starter feature test detected",
      status: featureTestExists ? "pass" : dependenciesInstalled ? "warning" : "skipped",
      message: featureTestExists ? undefined : `${featureTestPath} was not found.`,
      remediation: featureTestExists
        ? undefined
        : "Run avis add laravel-pest to create a starter feature test."
    }
  ] as const;
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId,
    health: dependenciesInstalled
      ? hasWarning
        ? "partial"
        : "healthy"
      : "not-installed",
    checks: [...checks],
    diagnostics: []
  };
}

async function getMissingPackages(
  context: ProjectContext,
  packageManager: ReturnType<typeof createPhpPackageManagerAdapter>
): Promise<string[]> {
  const packages = [pestPackage, laravelPluginPackage];
  const installed = await Promise.all(
    packages.map((packageName) =>
      packageManager.isDependencyInstalled(context, packageName)
    )
  );

  return packages.filter((_, index) => !installed[index]);
}

function createPestBootstrapContents(): string {
  return `<?php

pest()->extend(Tests\\TestCase::class)->in('Feature');
`;
}

function createFeatureTestContents(): string {
  return `<?php

it('returns a successful response', function () {
    $this->get('/')->assertSuccessful();
});
`;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
