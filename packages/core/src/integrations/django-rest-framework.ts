import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createPythonPackageManagerAdapter } from "../package-managers/python.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const packageName = "djangorestframework";
const settingsApp = "rest_framework";

export const djangoRestFrameworkIntegration: AvisIntegration = {
  id: "django-rest-framework",
  name: "Django REST Framework",
  capability: "api",
  supports: {
    ecosystems: [ecosystems.python],
    frameworks: [frameworks.django]
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
      ? await djangoSettingsIncludesApp(context.targetRoot, settingsPath, settingsApp)
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
    ? await djangoSettingsIncludesApp(context.targetRoot, settingsPath, settingsApp)
    : false;
  const checks = [
    {
      id: "drf-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "fail",
      message: dependencyInstalled ? undefined : `${packageName} is missing.`
    },
    {
      id: "drf-installed-app",
      label: "rest_framework configured",
      status: settingsConfigured ? "pass" : "warning",
      message: settingsConfigured
        ? undefined
        : settingsPath
          ? `${settingsPath} does not include ${settingsApp}.`
          : "Django settings.py was not found."
    }
  ] as const;
  const hasFailure = checks.some((check) => check.status === "fail");
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    status: hasFailure ? "fail" : hasWarning ? "warning" : "pass",
    checks: [...checks],
    diagnostics: []
  };
}

async function findDjangoSettingsPath(root: string): Promise<string | undefined> {
  const managePy = await readOptionalFile(path.join(root, "manage.py"));
  const moduleMatch = managePy?.match(/DJANGO_SETTINGS_MODULE["'],\s*["']([^"']+)/);
  const settingsModule = moduleMatch?.[1];

  if (settingsModule) {
    const candidate = `${settingsModule.replaceAll(".", "/")}.py`;
    if (await pathExists(path.join(root, candidate))) {
      return candidate;
    }
  }

  return findSettingsFile(root);
}

async function findSettingsFile(root: string): Promise<string | undefined> {
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const candidate = path.join(root, entry.name, "settings.py");
    if (await pathExists(candidate)) {
      return `${entry.name}/settings.py`;
    }
  }

  return undefined;
}

async function djangoSettingsIncludesApp(
  root: string,
  relativeSettingsPath: string,
  appName: string
): Promise<boolean> {
  const contents = await readFile(path.join(root, relativeSettingsPath), "utf8");
  return contents.includes(`"${appName}"`) || contents.includes(`'${appName}'`);
}

async function readOptionalFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
