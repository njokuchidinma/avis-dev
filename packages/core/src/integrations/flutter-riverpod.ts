import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createDartPackageManagerAdapter } from "../package-managers/dart.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const integrationId = "flutter-riverpod";
const packageName = "flutter_riverpod";
const providerPath = "lib/providers/counter_provider.dart";

export const flutterRiverpodIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "Flutter Riverpod",
    description: "Provider-based state management for Flutter applications.",
    capability: "state-management",
    version: "1.0.0",
    status: "experimental",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.dart],
      frameworks: [frameworks.flutter],
      packageManagers: [packageManagers.pub]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: ["runtime dependency", "starter provider module"],
    source: { owner: "avis" }
  },
  isCompatible: isFlutterRiverpodCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isFlutterRiverpodCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.pub;
    const packageManager = createDartPackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const providerExists = await pathExists(path.join(context.targetRoot, providerPath));

    return {
      id: integrationId,
      title: "Add Flutter Riverpod",
      integrationId,
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-flutter-riverpod",
                type: "dependency.add" as const,
                description: "Install Flutter Riverpod.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(providerExists
          ? []
          : [
              {
                id: "create-riverpod-provider",
                type: "file.create" as const,
                description: "Create a starter Riverpod provider.",
                path: providerPath,
                contents: createProviderContents(),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyFlutterRiverpod
};

function isFlutterRiverpodCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.dart) {
    return {
      supported: false,
      reason: "Flutter Riverpod integration supports Dart projects only."
    };
  }

  if (context.framework?.id !== frameworks.flutter) {
    return {
      supported: false,
      reason: "Flutter Riverpod integration requires a detected Flutter project."
    };
  }

  if (context.packageManager?.id !== packageManagers.pub) {
    return {
      supported: false,
      reason: "Flutter Riverpod integration requires Dart pub."
    };
  }

  return { supported: true };
}

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: integrationId,
    title: "Add Flutter Riverpod",
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

async function verifyFlutterRiverpod(
  context: ProjectContext
): Promise<VerificationResult> {
  const packageManager = createDartPackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.pub
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const providerExists = await pathExists(path.join(context.targetRoot, providerPath));
  const hasWarning = dependencyInstalled && !providerExists;

  return {
    integrationId,
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [
      {
        id: "flutter-riverpod-dependency",
        label: "dependency installed",
        status: dependencyInstalled ? "pass" : "skipped",
        message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
        remediation: dependencyInstalled ? undefined : "Run avis add flutter-riverpod."
      },
      {
        id: "flutter-riverpod-provider",
        label: "starter provider detected",
        status: providerExists ? "pass" : dependencyInstalled ? "warning" : "skipped",
        message: providerExists ? undefined : `${providerPath} was not found.`,
        remediation: providerExists
          ? undefined
          : "Run avis add flutter-riverpod to create a starter provider."
      }
    ],
    diagnostics: []
  };
}

function createProviderContents(): string {
  return `import 'package:flutter_riverpod/flutter_riverpod.dart';

final counterProvider = StateProvider<int>((ref) => 0);
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
