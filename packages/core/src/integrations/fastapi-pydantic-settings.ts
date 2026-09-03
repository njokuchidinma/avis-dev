import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";

export const fastapiPydanticSettingsIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "fastapi-pydantic-settings",
    name: "Pydantic Settings for FastAPI",
    description: "Typed environment and application settings for FastAPI projects.",
    capability: "configuration",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.python],
      frameworks: [frameworks.fastapi],
      packageManagers: [
        packageManagers.pip,
        packageManagers.uv,
        packageManagers.poetry
      ]
    },
    dependencies: [{ name: "pydantic-settings", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "pydantic-settings",
  planTitle: "Add Pydantic Settings for FastAPI",
  dependencyOperationId: "add-fastapi-pydantic-settings",
  dependencyDescription: "Install pydantic-settings.",
  compatibilityDescription: "FastAPI projects"
});
