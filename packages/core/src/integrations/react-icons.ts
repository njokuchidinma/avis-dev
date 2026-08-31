import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import { createDependencyOnlyIntegration } from "./dependency-only.js";

const packageName = "react-icons";

export const reactIconsIntegration = createDependencyOnlyIntegration({
  packageName,
  planTitle: "Add React Icons",
  dependencyOperationId: "add-react-icons",
  dependencyDescription: "Install React Icons.",
  compatibilityDescription: "Next.js projects",
  manifest: {
    id: "react-icons",
    name: "React Icons",
    description: "A broad aggregator for popular icon packs in React applications.",
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
