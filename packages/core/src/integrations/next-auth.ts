import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { ChangePlan } from "../planning/change-plan.js";
import { createNodePackageManagerAdapter } from "../package-managers/node.js";
import { ecosystems, frameworks, languages, packageManagers } from "../types/ids.js";
import type { ProjectContext } from "../types/project-context.js";
import type { VerificationResult } from "../verification/types.js";
import type { AvisIntegration, CompatibilityResult } from "./types.js";

const integrationId = "next-auth";
const packageName = "next-auth";
const authSecretVariable = "AUTH_SECRET";

export const nextAuthIntegration: AvisIntegration = {
  manifest: {
    id: integrationId,
    name: "Auth.js for Next.js",
    description: "Authentication route handlers and server helpers for Next.js applications.",
    capability: "auth",
    version: "1.0.0",
    status: "experimental",
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
    configures: [
      "runtime dependency",
      "Auth.js configuration module",
      "Next.js auth route handler",
      "AUTH_SECRET example"
    ],
    documentation: {
      homepage: "https://authjs.dev/",
      quickstart: "https://authjs.dev/getting-started/installation?framework=next-js"
    },
    source: { owner: "avis" }
  },
  isCompatible: isNextAuthCompatible,
  plan: async ({ context }): Promise<ChangePlan> => {
    const compatibility = isNextAuthCompatible(context);
    if (!compatibility.supported) {
      return incompatiblePlan(context, compatibility.reason);
    }

    const packageManagerId = context.packageManager?.id ?? packageManagers.npm;
    const packageManager = createNodePackageManagerAdapter(packageManagerId);
    const dependencyInstalled = await packageManager.isDependencyInstalled(
      context,
      packageName
    );
    const authPath = await getAuthConfigPath(context);
    const routePath = await getAuthRoutePath(context);
    const authConfigExists = await pathExists(path.join(context.targetRoot, authPath));
    const routeExists = await pathExists(path.join(context.targetRoot, routePath));
    const envExampleHasSecret = await envFileIncludesVariable(
      context.targetRoot,
      ".env.local.example",
      authSecretVariable
    );

    return {
      id: integrationId,
      title: "Add Auth.js for Next.js",
      integrationId,
      target: context,
      operations: [
        ...(dependencyInstalled
          ? []
          : [
              {
                id: "add-next-auth",
                type: "dependency.add" as const,
                description: "Install Auth.js for Next.js.",
                dependencyType: "runtime" as const,
                packageManager: packageManagerId,
                packages: [{ name: packageName, version: "beta" }]
              }
            ]),
        ...(authConfigExists
          ? []
          : [
              {
                id: "create-next-auth-config",
                type: "file.create" as const,
                description: "Create the Auth.js configuration module.",
                path: authPath,
                contents: createAuthConfigContents(),
                overwrite: "never" as const
              }
            ]),
        ...(routeExists
          ? []
          : [
              {
                id: "create-next-auth-route",
                type: "file.create" as const,
                description: "Create the Next.js Auth.js route handler.",
                path: routePath,
                contents: createAuthRouteContents(),
                overwrite: "never" as const
              }
            ]),
        ...(envExampleHasSecret
          ? []
          : [
              {
                id: "document-auth-secret",
                type: "env.ensure" as const,
                description: "Document the required Auth.js secret variable.",
                path: ".env.local.example",
                variables: {
                  [authSecretVariable]: ""
                }
              }
            ])
      ],
      diagnostics: []
    };
  },
  verify: verifyNextAuth
};

function isNextAuthCompatible(context: ProjectContext): CompatibilityResult {
  if (context.ecosystem !== ecosystems.node) {
    return {
      supported: false,
      reason: "Auth.js for Next.js supports Node projects only."
    };
  }

  if (context.framework?.id !== frameworks.nextjs) {
    return {
      supported: false,
      reason: "Auth.js for Next.js requires a detected Next.js project."
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
    id: integrationId,
    title: "Add Auth.js for Next.js",
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

async function verifyNextAuth(context: ProjectContext): Promise<VerificationResult> {
  const packageManager = createNodePackageManagerAdapter(
    context.packageManager?.id ?? packageManagers.npm
  );
  const dependencyInstalled = await packageManager.isDependencyInstalled(
    context,
    packageName
  );
  const authPath = await getAuthConfigPath(context);
  const routePath = await getAuthRoutePath(context);
  const authConfigExists = await pathExists(path.join(context.targetRoot, authPath));
  const routeExists = await pathExists(path.join(context.targetRoot, routePath));
  const envExampleHasSecret = await envFileIncludesVariable(
    context.targetRoot,
    ".env.local.example",
    authSecretVariable
  );
  const checks = [
    {
      id: "next-auth-dependency",
      label: "dependency installed",
      status: dependencyInstalled ? "pass" : "skipped",
      message: dependencyInstalled ? undefined : `${packageName} is not installed.`,
      remediation: dependencyInstalled ? undefined : "Run avis add next-auth."
    },
    {
      id: "next-auth-config",
      label: "auth config detected",
      status: authConfigExists ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: authConfigExists ? undefined : `${authPath} was not found.`,
      remediation: authConfigExists
        ? undefined
        : "Run avis add next-auth to create the Auth.js config module."
    },
    {
      id: "next-auth-route",
      label: "auth route detected",
      status: routeExists ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: routeExists ? undefined : `${routePath} was not found.`,
      remediation: routeExists
        ? undefined
        : "Run avis add next-auth to create the route handler."
    },
    {
      id: "next-auth-secret",
      label: "secret documented",
      status: envExampleHasSecret ? "pass" : dependencyInstalled ? "warning" : "skipped",
      message: envExampleHasSecret
        ? undefined
        : ".env.local.example does not include AUTH_SECRET.",
      remediation: envExampleHasSecret
        ? undefined
        : "Run avis add next-auth to document AUTH_SECRET."
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

async function getAuthConfigPath(context: ProjectContext): Promise<string> {
  const hasSrcDirectory = await pathExists(path.join(context.targetRoot, "src"));
  const extension = context.languages.includes(languages.typescript) ? "ts" : "js";
  return hasSrcDirectory ? `src/auth.${extension}` : `auth.${extension}`;
}

async function getAuthRoutePath(context: ProjectContext): Promise<string> {
  const hasSrcDirectory = await pathExists(path.join(context.targetRoot, "src"));
  const extension = context.languages.includes(languages.typescript) ? "ts" : "js";
  return hasSrcDirectory
    ? `src/app/api/auth/[...nextauth]/route.${extension}`
    : `app/api/auth/[...nextauth]/route.${extension}`;
}

function createAuthConfigContents(): string {
  return `import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: []
});
`;
}

function createAuthRouteContents(): string {
  return `import { handlers } from "../../../../auth";

export const { GET, POST } = handlers;
`;
}

async function envFileIncludesVariable(
  root: string,
  relativePath: string,
  variableName: string
): Promise<boolean> {
  const contents = await readOptionalFile(path.join(root, relativePath));
  return contents
    ?.split(/\r?\n/)
    .some((line) => line.trim().startsWith(`${variableName}=`)) ?? false;
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
