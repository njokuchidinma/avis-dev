import type { ChangePlan } from "../planning/change-plan.js";
import { createPythonPackageManagerAdapter } from "../package-managers/python.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import {
  djangoSettingsIncludesValue,
  findDjangoSettingsPath
} from "./django-settings.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const packageName = "djangorestframework";
const settingsApp = "rest_framework";

export const djangoRestFrameworkIntegration: AvisIntegration = {
  manifest: {
    id: "django-rest-framework",
    name: "Django REST Framework",
    description: "API toolkit for Django projects.",
    capability: "api",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    setupMaturity: "configure",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: [packageManagers.pip, packageManagers.uv, packageManagers.poetry]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: ["runtime dependency", "rest_framework installed app"],
    source: { owner: "avis" }
  },
  isCompatible: isDjangoRestFrameworkCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isDjangoRestFrameworkCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.pip;
    const packageManager = createPythonPackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const settingsPath = await findDjangoSettingsPath(context.targetRoot);
    const settingsConfigured = settingsPath
      ? await djangoSettingsIncludesValue(context.targetRoot, settingsPath, settingsApp)
      : false;

    return {
      id: "django-rest-framework",
      title: "Add Django REST Framework",
      integrationId: "django-rest-framework",
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-django-rest-framework",
                type: "dependency.add" as const,
                description: "Install Django REST Framework.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(settingsPath && !settingsConfigured
          ? [
              {
                id: "configure-drf-installed-app",
                type: "text.patch" as const,
                description: "Add rest_framework to INSTALLED_APPS.",
                path: settingsPath,
                search: "INSTALLED_APPS = [",
                replace: `INSTALLED_APPS = [\n    "${settingsApp}",`
              }
            ]
          : [])
      ],
      diagnostics: settingsPath
        ? []
        : [
            {
              severity: "warning",
              message: "Could not find a Django settings.py file to configure."
            }
          ]
    };
  },
  verify: verifyDjangoRestFramework
};

function isDjangoRestFrameworkCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.python) {
    return {
      supported: false,
      reason: "Django REST Framework integration supports Python projects only."
    };
  }

  if (context.framework?.id !== frameworks.django) {
    return {
      supported: false,
      reason: "Django REST Framework integration requires a detected Django project."
    };
  }

  if (!context.packageManager) {
    return {
      supported: false,
      reason: "No supported Python package manager was detected."
    };
  }

  return { supported: true };
}

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: "django-rest-framework",
    title: "Add Django REST Framework",
    integrationId: "django-rest-framework",
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

async function verifyDjangoRestFramework(
  context: ProjectContext
): Promise<VerificationResult> {
  const packageManager = createPythonPackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.pip
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const settingsPath = await findDjangoSettingsPath(context.targetRoot);
  const settingsConfigured = settingsPath
    ? await djangoSettingsIncludesValue(context.targetRoot, settingsPath, settingsApp)
    : false;
  const checks = [
    {
      id: "drf-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "skipped",
      message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
      remediation: dependencyInstalled
        ? undefined
        : "Run avis add django-rest-framework."
    },
    {
      id: "drf-installed-app",
      label: "rest_framework configured",
      status: settingsConfigured ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: settingsConfigured
        ? undefined
        : settingsPath
          ? `${settingsPath} does not include ${settingsApp}.`
          : "Django settings.py was not found.",
      remediation: settingsConfigured
        ? undefined
        : "Run avis add django-rest-framework to configure INSTALLED_APPS."
    }
  ] as const;
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId: "django-rest-framework",
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [...checks],
    diagnostics: []
  };
}
