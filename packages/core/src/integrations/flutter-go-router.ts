import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createDartPackageManagerAdapter } from "../package-managers/dart.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const integrationId = "flutter-go-router";
const packageName = "go_router";
const routerPath = "lib/router/app_router.dart";

export const flutterGoRouterIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "GoRouter for Flutter",
    description: "Declarative routing for Flutter applications.",
    capability: "routing",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.dart],
      frameworks: [frameworks.flutter],
      packageManagers: [packageManagers.pub]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: ["runtime dependency", "starter router module"],
    source: { owner: "avis" }
  },
  isCompatible: isFlutterGoRouterCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isFlutterGoRouterCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.pub;
    const packageManager = createDartPackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const routerExists = await pathExists(path.join(context.targetRoot, routerPath));

    return {
      id: integrationId,
      title: "Add GoRouter for Flutter",
      integrationId,
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-flutter-go-router",
                type: "dependency.add" as const,
                description: "Install GoRouter.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(routerExists
          ? []
          : [
              {
                id: "create-flutter-router",
                type: "file.create" as const,
                description: "Create a starter GoRouter module.",
                path: routerPath,
                contents: createRouterContents(),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyFlutterGoRouter
};

function isFlutterGoRouterCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.dart) {
    return {
      supported: false,
      reason: "GoRouter integration supports Dart projects only."
    };
  }

  if (context.framework?.id !== frameworks.flutter) {
    return {
      supported: false,
      reason: "GoRouter integration requires a detected Flutter project."
    };
  }

  if (context.packageManager?.id !== packageManagers.pub) {
    return {
      supported: false,
      reason: "GoRouter integration requires Dart pub."
    };
  }

  return { supported: true };
}

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: integrationId,
    title: "Add GoRouter for Flutter",
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

async function verifyFlutterGoRouter(
  context: ProjectContext
): Promise<VerificationResult> {
  const packageManager = createDartPackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.pub
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const routerExists = await pathExists(path.join(context.targetRoot, routerPath));
  const hasWarning = dependencyInstalled && !routerExists;

  return {
    integrationId,
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [
      {
        id: "flutter-go-router-dependency",
        label: "dependency installed",
        status: dependencyInstalled ? "pass" : "skipped",
        message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
        remediation: dependencyInstalled
          ? undefined
          : "Run avis add flutter-go-router."
      },
      {
        id: "flutter-go-router-module",
        label: "router module detected",
        status: routerExists ? "pass" : dependencyInstalled ? "warning" : "skipped",
        message: routerExists ? undefined : `${routerPath} was not found.`,
        remediation: routerExists
          ? undefined
          : "Run avis add flutter-go-router to create a starter router module."
      }
    ],
    diagnostics: []
  };
}

function createRouterContents(): string {
  return `import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const Placeholder(),
    ),
  ],
);
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
