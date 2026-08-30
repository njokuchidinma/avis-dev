import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import { createDependencyOnlyIntegration } from "./dependency-only.js";

const packageName = "@heroicons/react";

export const heroiconsReactIntegration = createDependencyOnlyIntegration({
  packageName,
  planTitle: "Add Heroicons React",
  dependencyOperationId: "add-heroicons-react",
  dependencyDescription: "Install Heroicons React.",
  compatibilityDescription: "Next.js projects",
  manifest: {
    id: "heroicons-react",
    name: "Heroicons React",
    description: "Tailwind-friendly outline and solid icons for React applications.",
    capability: "icons",
    version: "1.0.0",
    status: "stable",
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  }
});
