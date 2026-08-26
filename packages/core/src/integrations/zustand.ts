import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import { createNodePackageManagerAdapter } from "../package-managers/node.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

export const zustandIntegration: AvisIntegration = {
  id: "zustand",
  name: "Zustand",
  capability: "state-management",
  supports: {
    ecosystems: [ecosystems.node],
    frameworks: [frameworks.nextjs]
  },
  isCompatible: isZustandCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isZustandCompatible(context);
    if (!compatibility.supported) {
      return {
        id: "zustand",
        title: "Add Zustand",
        integrationId: "zustand",
        target: context,
        operations: [],
        diagnostics: [
          {
            severity: "error",
            message: compatibility.reason
          }
        ]
      };
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.npm;
    const packageManager = createNodePackageManagerAdapter(packageManagerId);
    const storePath = await getZustandStorePath(context);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      "zustand"
    );
    const storeExists = await pathExists(path.join(context.targetRoot, storePath));

    return {
      id: "zustand",
      title: "Add Zustand",
      integrationId: "zustand",
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-zustand",
                type: "dependency.add" as const,
                description: "Install Zustand.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: "zustand" }]
              }
            ]),
        ...(storeExists
          ? []
          : [
              {
                id: "create-zustand-store",
                type: "file.create" as const,
                description: "Create a starter Zustand store.",
                path: storePath,
                contents: createZustandStoreContents(context),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyZustand
};

function isZustandCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.node) {
    return {
      supported: false,
      reason: "Zustand integration currently supports Node projects only."
    };
  }

  if (context.framework?.id !== frameworks.nextjs) {
    return {
      supported: false,
      reason: "Zustand integration currently supports detected Next.js projects only."
    };
  }

  if (!context.packageManager) {
    return {
      supported: false,
      reason: "No supported Node package manager was detected."
    };
  }

  return { supported: true };
}

async function verifyZustand(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createNodePackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.npm
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(context, "zustand");
  const storePath = await getZustandStorePath(context);
  const storeExists = await pathExists(path.join(context.targetRoot, storePath));
  const checks = [
    {
      id: "zustand-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "fail",
      message: dependencyInstalled ? undefined : "zustand is missing from package.json."
    },
    {
      id: "zustand-store",
      label: "store detected",
      status: storeExists ? "pass" : "warning",
      message: storeExists ? undefined : `${storePath} was not found.`
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

async function getZustandStorePath(context: ProjectContext): Promise<string> {
  const hasSrcDirectory = await pathExists(path.join(context.targetRoot, "src"));
  const extension = context.languages.includes(languages.typescript) ? "ts" : "js";
  return hasSrcDirectory ? `src/stores/index.${extension}` : `stores/index.${extension}`;
}

function createZustandStoreContents(context: ProjectContext): string {
  if (context.languages.includes(languages.typescript)) {
    return `import { create } from "zustand";

interface AppState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}));
`;
  }

  return `import { create } from "zustand";

export const useAppStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}));
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
