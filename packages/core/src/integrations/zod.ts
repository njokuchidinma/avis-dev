import { access } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createNodePackageManagerAdapter } from "../package-managers/node.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const packageName = "zod";

export const zodIntegration: AvisIntegration = {
  manifest: {
    id: "zod",
    name: "Zod",
    description: "Runtime schema validation and static type inference for TypeScript applications.",
    capability: "validation",
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
    configures: ["runtime dependency", "starter schema module"],
    source: { owner: "avis" }
  },
  isCompatible: isZodCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isZodCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.npm;
    const packageManager = createNodePackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const schemaPath = await getSchemaPath(context);
    const schemaExists = await pathExists(path.join(context.targetRoot, schemaPath));

    return {
      id: "zod",
      title: "Add Zod",
      integrationId: "zod",
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-zod",
                type: "dependency.add" as const,
                description: "Install Zod.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName }]
              }
            ]),
        ...(schemaExists
          ? []
          : [
              {
                id: "create-zod-schema",
                type: "file.create" as const,
                description: "Create a starter Zod schema.",
                path: schemaPath,
                contents: createSchemaContents(context),
                overwrite: "never" as const
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyZod
};

function isZodCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.node) {
    return {
      supported: false,
      reason: "Zod integration currently supports Node projects only."
    };
  }

  if (context.framework?.id !== frameworks.nextjs) {
    return {
      supported: false,
      reason: "Zod integration currently supports detected Next.js projects only."
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
    id: "zod",
    title: "Add Zod",
    integrationId: "zod",
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

async function verifyZod(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createNodePackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.npm
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const schemaPath = await getSchemaPath(context);
  const schemaExists = await pathExists(path.join(context.targetRoot, schemaPath));
  const checks = [
    {
      id: "zod-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "skipped",
      message: dependencyInstalled ? undefined : "zod is not installed.",
      remediation: dependencyInstalled ? undefined : "Run avis add zod."
    },
    {
      id: "zod-schema",
      label: "schema detected",
      status: schemaExists ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: schemaExists ? undefined : `${schemaPath} was not found.`,
      remediation: schemaExists ? undefined : "Run avis add zod to create a starter schema."
    }
  ] as const;
  const hasWarning = checks.some((check) => check.status === "warning");

  return {
    integrationId: "zod",
    health: dependencyInstalled ? (hasWarning ? "partial" : "healthy") : "not-installed",
    checks: [...checks],
    diagnostics: []
  };
}

async function getSchemaPath(context: ProjectContext): Promise<string> {
  const hasSrcDirectory = await pathExists(path.join(context.targetRoot, "src"));
  const extension = context.languages.includes(languages.typescript) ? "ts" : "js";
  return hasSrcDirectory ? `src/schemas/index.${extension}` : `schemas/index.${extension}`;
}

function createSchemaContents(context: ProjectContext): string {
  const hasTypescript = context.languages.includes(languages.typescript);

  return `import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1)
});
${hasTypescript ? "\nexport type User = z.infer<typeof userSchema>;\n" : ""}`;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
