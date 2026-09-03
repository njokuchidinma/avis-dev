import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";

export const reactRouterDomIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "react-router-dom",
    name: "React Router DOM",
    description: "Declarative browser routing for React applications.",
    capability: "routing",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      frameworks: [frameworks.react],
      packageManagers: [
        packageManagers.npm,
        packageManagers.pnpm,
        packageManagers.yarn,
        packageManagers.bun
      ]
    },
    dependencies: [{ name: "react-router-dom", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "react-router-dom",
  planTitle: "Add React Router DOM",
  dependencyOperationId: "add-react-router-dom",
  dependencyDescription: "Install React Router DOM.",
  compatibilityDescription: "React projects"
});
