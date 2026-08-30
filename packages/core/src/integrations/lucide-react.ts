import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import { createDependencyOnlyIntegration } from "./dependency-only.js";

const packageName = "lucide-react";

export const lucideReactIntegration = createDependencyOnlyIntegration({
  packageName,
  planTitle: "Add Lucide React",
  dependencyOperationId: "add-lucide-react",
  dependencyDescription: "Install Lucide React icons.",
  compatibilityDescription: "Next.js projects",
  manifest: {
    id: "lucide-react",
    name: "Lucide React",
    description: "A consistent, tree-shakeable outline icon system for React interfaces.",
    capability: "icons",
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
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  }
});
