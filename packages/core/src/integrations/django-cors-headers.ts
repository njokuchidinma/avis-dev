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

const integrationId = "django-cors-headers";
const packageName = "django-cors-headers";
const settingsApp = "corsheaders";
const middlewareName = "corsheaders.middleware.CorsMiddleware";

export const djangoCorsHeadersIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "django-cors-headers",
    description: "CORS middleware and settings integration for Django applications.",
    capability: "security",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.django],
      packageManagers: [packageManagers.pip, packageManagers.uv, packageManagers.poetry]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: [
      "runtime dependency",
      "corsheaders installed app",
      "CORS middleware"
    ],
    source: { owner: "avis" }
  },
  isCompatible: isDjangoCorsHeadersCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isDjangoCorsHeadersCompatible(context);
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
    const appConfigured = settingsPath
      ? await djangoSettingsIncludesValue(context.targetRoot, settingsPath, settingsApp)
      : false;
    const middlewareConfigured = settingsPath
      ? await djangoSettingsIncludesValue(context.targetRoot, settingsPath, middlewareName)
      : false;

    return {
      id: integrationId,
      title: "Add django-cors-headers",
      integrationId,
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-django-cors-headers",
                type: "dependency.add" as const,
                description: "Install django-cors-headers.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(settingsPath && !appConfigured
          ? [
              {
                id: "configure-cors-installed-app",
                type: "text.patch" as const,
                description: "Add corsheaders to INSTALLED_APPS.",
                path: settingsPath,
                search: "INSTALLED_APPS = [",
                replace: `INSTALLED_APPS = [\n    "${settingsApp}",`
              }
            ]
          : []),
        ...(settingsPath && !middlewareConfigured
          ? [
              {
                id: "configure-cors-middleware",
                type: "text.patch" as const,
                description: "Add CORS middleware near the top of MIDDLEWARE.",
                path: settingsPath,
                search: "MIDDLEWARE = [",
                replace: `MIDDLEWARE = [\n    "${middlewareName}",`
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
  verify: verifyDjangoCorsHeaders
};

function isDjangoCorsHeadersCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.python) {
    return {
      supported: false,
      reason: "django-cors-headers supports Python projects only."
    };
  }

  if (context.framework?.id !== frameworks.django) {
    return {
      supported: false,
      reason: "django-cors-headers requires a detected Django project."
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
    id: integrationId,
    title: "Add django-cors-headers",
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

async function verifyDjangoCorsHeaders(
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
  const appConfigured = settingsPath
    ? await djangoSettingsIncludesValue(context.targetRoot, settingsPath, settingsApp)
    : false;
  const middlewareConfigured = settingsPath
    ? await djangoSettingsIncludesValue(context.targetRoot, settingsPath, middlewareName)
    : false;
  const checks = [
    {
      id: "django-cors-headers-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "skipped",
      message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
      remediation: dependencyInstalled
        ? undefined
        : "Run avis add django-cors-headers."
    },
    {
      id: "django-cors-headers-installed-app",
      label: "corsheaders app configured",
      status: appConfigured ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: appConfigured
        ? undefined
        : settingsPath
          ? `${settingsPath} does not include ${settingsApp}.`
          : "Django settings.py was not found.",
      remediation: appConfigured
        ? undefined
        : "Run avis add django-cors-headers to configure INSTALLED_APPS."
    },
    {
      id: "django-cors-headers-middleware",
      label: "CORS middleware configured",
      status: middlewareConfigured ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: middlewareConfigured
        ? undefined
        : settingsPath
          ? `${settingsPath} does not include ${middlewareName}.`
          : "Django settings.py was not found.",
      remediation: middlewareConfigured
        ? undefined
        : "Run avis add django-cors-headers to configure MIDDLEWARE."
    }
  ] as const;
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId,
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [...checks],
    diagnostics: []
  };
}
