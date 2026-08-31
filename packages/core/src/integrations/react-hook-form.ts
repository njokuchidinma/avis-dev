import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createNodePackageManagerAdapter } from "../package-managers/node.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const packageName = "react-hook-form";

export const reactHookFormIntegration: AvisIntegration = {
  manifest: {
    id: "react-hook-form",
    name: "React Hook Form",
    description: "Performant React form state and validation wiring.",
    capability: "forms",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      frameworks: [frameworks.nextjs],
      packageManagers: [
        packageManagers.npm,
        packageManagers.pnpm,
        packageManagers.yarn,
        packageManagers.bun
      ]
    },
    dependencies: [{ name: packageName, type: "runtime" }],
    configures: ["runtime dependency", "starter form component"],
    source: { owner: "avis" }
  },
  isCompatible: isReactHookFormCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isReactHookFormCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.npm;
    const packageManager = createNodePackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const componentPath = await getFormComponentPath(context);
    const componentExists = await pathExists(path.join(context.targetRoot, componentPath));

    return {
      id: "react-hook-form",
      title: "Add React Hook Form",
      integrationId: "react-hook-form",
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-react-hook-form",
                type: "dependency.add" as const,
                description: "Install React Hook Form.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(componentExists
          ? []
          : [
              {
                id: "create-example-form",
                type: "file.create" as const,
                description: "Create a starter React Hook Form component.",
                path: componentPath,
                contents: createFormComponentContents(context),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyReactHookForm
};

function isReactHookFormCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.node) {
    return {
      supported: false,
      reason: "React Hook Form integration currently supports Node projects only."
    };
  }

  if (context.framework?.id !== frameworks.nextjs) {
    return {
      supported: false,
      reason: "React Hook Form integration currently supports detected Next.js projects only."
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
    id: "react-hook-form",
    title: "Add React Hook Form",
    integrationId: "react-hook-form",
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

async function verifyReactHookForm(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createNodePackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.npm
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const componentPath = await getFormComponentPath(context);
  const componentExists = await pathExists(path.join(context.targetRoot, componentPath));
  const checks = [
    {
      id: "react-hook-form-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "skipped",
      message: dependencyInstalled
        ? undefined
        : "react-hook-form is not installed.",
      remediation: dependencyInstalled ? undefined : "Run avis add react-hook-form."
    },
    {
      id: "react-hook-form-component",
      label: "example form detected",
      status: componentExists ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: componentExists ? undefined : `${componentPath} was not found.`,
      remediation: componentExists
        ? undefined
        : "Run avis add react-hook-form to create a starter form component."
    }
  ] as const;
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId: "react-hook-form",
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [...checks],
    diagnostics: []
  };
}

async function getFormComponentPath(context: ProjectContext): Promise<string> {
  const hasSrcDirectory = await pathExists(path.join(context.targetRoot, "src"));
  const extension = context.languages.includes(languages.typescript) ? "tsx" : "jsx";
  return hasSrcDirectory
    ? `src/components/example-form.${extension}`
    : `components/example-form.${extension}`;
}

function createFormComponentContents(context: ProjectContext): string {
  const hasTypescript = context.languages.includes(languages.typescript);
  const generic = hasTypescript ? "<FormValues>" : "";

  return `"use client";

import { useForm } from "react-hook-form";
${hasTypescript ? "\ninterface FormValues {\n  email: string;\n}\n" : ""}
export function ExampleForm() {
  const { handleSubmit, register } = useForm${generic}();

  return (
    <form onSubmit={handleSubmit((values) => console.log(values))}>
      <input type="email" {...register("email")} />
      <button type="submit">Submit</button>
    </form>
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
