import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createNodePackageManagerAdapter } from "../package-managers/node.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const packageName = "@tanstack/react-query";

export const tanstackQueryIntegration: AvisIntegration = {
  id: "tanstack-query",
  name: "TanStack Query",
  capability: "data-fetching",
  supports: {
    ecosystems: [ecosystems.node],
    frameworks: [frameworks.nextjs]
  },
  isCompatible: isTanStackQueryCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isTanStackQueryCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.npm;
    const packageManager = createNodePackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const providerPath = await getQueryProviderPath(context);
    const providerExists = await pathExists(path.join(context.targetRoot, providerPath));

    return {
      id: "tanstack-query",
      title: "Add TanStack Query",
      integrationId: "tanstack-query",
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-tanstack-query",
                type: "dependency.add" as const,
                description: "Install TanStack Query.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(providerExists
          ? []
          : [
              {
                id: "create-query-provider",
                type: "file.create" as const,
                description: "Create a TanStack Query provider.",
                path: providerPath,
                contents: createQueryProviderContents(context),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyTanStackQuery
};

function isTanStackQueryCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.node) {
    return {
      supported: false,
      reason: "TanStack Query integration currently supports Node projects only."
    };
  }

  if (context.framework?.id !== frameworks.nextjs) {
    return {
      supported: false,
      reason: "TanStack Query integration currently supports detected Next.js projects only."
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

function incompatiblePlan(context: ProjectContext, reason: string): ChangePlan {
  return {
    id: "tanstack-query",
    title: "Add TanStack Query",
    integrationId: "tanstack-query",
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

async function verifyTanStackQuery(
  context: ProjectContext
): Promise<VerificationResult> {
  const packageManager = createNodePackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.npm
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const providerPath = await getQueryProviderPath(context);
  const providerExists = await pathExists(path.join(context.targetRoot, providerPath));
  const checks = [
    {
      id: "tanstack-query-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "fail",
      message: dependencyInstalled ? undefined : `${packageName} is missing from package.json.`
    },
    {
      id: "tanstack-query-provider",
      label: "provider detected",
      status: providerExists ? "pass" : "warning",
      message: providerExists ? undefined : `${providerPath} was not found.`
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

async function getQueryProviderPath(context: ProjectContext): Promise<string> {
  const hasSrcDirectory = await pathExists(path.join(context.targetRoot, "src"));
  const hasAppDirectory =
    (await pathExists(path.join(context.targetRoot, "src/app"))) ||
    (await pathExists(path.join(context.targetRoot, "app")));
  const extension = context.languages.includes(languages.typescript) ? "tsx" : "jsx";

  if (hasAppDirectory) {
    return hasSrcDirectory ? `src/app/providers.${extension}` : `app/providers.${extension}`;
  }

  return hasSrcDirectory
    ? `src/providers/query-provider.${extension}`
    : `providers/query-provider.${extension}`;
}

function createQueryProviderContents(context: ProjectContext): string {
  const hasTypescript = context.languages.includes(languages.typescript);
  const propsType = hasTypescript ? ": { children: React.ReactNode }" : "";

  return `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
${hasTypescript ? 'import type React from "react";\n' : ""}
export function QueryProvider({ children }${propsType}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
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
