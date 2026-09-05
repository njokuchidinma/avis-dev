import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";

export const axumTowerHttpIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "axum-tower-http",
    name: "Tower HTTP for Axum",
    description: "HTTP middleware layers for Axum services.",
    capability: "api",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.rust],
      frameworks: [frameworks.axum],
      packageManagers: [packageManagers.cargo]
    },
    dependencies: [{ name: "tower-http", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "tower-http",
  planTitle: "Add Tower HTTP for Axum",
  dependencyOperationId: "add-axum-tower-http",
  dependencyDescription: "Install tower-http.",
  compatibilityDescription: "Axum projects"
});
