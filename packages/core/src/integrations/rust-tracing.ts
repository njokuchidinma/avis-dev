import type { ChangePlan } from "../planning/change-plan.js";
import { createRustPackageManagerAdapter } from "../package-managers/rust.js";
import { ecosystems, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const integrationId = "rust-tracing";
const packageName = "tracing";

export const rustTracingIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "Rust tracing",
    description: "Structured diagnostics instrumentation for Rust applications.",
    capability: "observability",
    version: "1.0.0",
    status: "experimental",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.rust],
      packageManagers: [packageManagers.cargo]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  isCompatible: isRustTracingCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isRustTracingCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.cargo;
    const packageManager = createRustPackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );

    return {
      id: integrationId,
      title: "Add Rust tracing",
      integrationId,
      target: context,
      operations: dependencyInstalled
        ? []
        : [
            {
              id: "add-rust-tracing",
              type: "dependency.add",
              description: "Install tracing.",
              dependencyType: "runtime",
              packageManager: packageManagerId,
              packages: [{ name: packageName }]
            }
          ],
      diagnostics: []
    };
  },
  verify: verifyRustTracing
};

function isRustTracingCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.rust) {
    return {
      supported: false,
      reason: "Rust tracing integration supports Rust projects only."
    };
  }

  if (context.packageManager?.id !== packageManagers.cargo) {
    return {
      supported: false,
      reason: "Rust tracing integration requires Cargo."
    };
  }

  return { supported: true };
}

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: integrationId,
    title: "Add Rust tracing",
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

async function verifyRustTracing(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createRustPackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.cargo
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
        id: "rust-tracing-dependency",
        label: "dependency installed",
        status: dependencyInstalled ? "pass" : "skipped",
        message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
        remediation: dependencyInstalled ? undefined : "Run avis add rust-tracing."
      }
    ],
    diagnostics: []
  };
}
