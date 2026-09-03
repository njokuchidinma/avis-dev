import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";

export const ginValidatorIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "gin-validator",
    name: "Go Playground Validator for Gin",
    description: "Struct and request validation helpers for Gin services.",
    capability: "validation",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.go],
      frameworks: [frameworks.gin],
      packageManagers: [packageManagers.go]
    },
    dependencies: [
      {
        name: "github.com/go-playground/validator/v10",
        type: "runtime"
      }
    ],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "github.com/go-playground/validator/v10",
  planTitle: "Add Go Playground Validator for Gin",
  dependencyOperationId: "add-gin-validator",
  dependencyDescription: "Install Go Playground Validator.",
  compatibilityDescription: "Gin projects"
});
