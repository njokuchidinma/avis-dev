import { ecosystems, frameworks, packageManagers } from "../types/ids.js";
import { createDependencyOnlyIntegration } from "./dependency-only.js";

export const reduxToolkitIntegration = createDependencyOnlyIntegration({
  packageNames: ["@reduxjs/toolkit", "react-redux"],
  planTitle: "Add Redux Toolkit",
  dependencyOperationId: "add-redux-toolkit",
  dependencyDescription: "Install Redux Toolkit and React Redux.",
  compatibilityDescription: "Next.js projects",
  manifest: {
    id: "redux-toolkit",
    name: "Redux Toolkit",
    description: "Opinionated Redux state management for larger React applications.",
    capability: "state-management",
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
    dependencies: [
      { name: "@reduxjs/toolkit", type: "runtime" },
      { name: "react-redux", type: "runtime" }
    ],
    configures: ["runtime dependencies"],
    source: { owner: "avis" }
  }
});
