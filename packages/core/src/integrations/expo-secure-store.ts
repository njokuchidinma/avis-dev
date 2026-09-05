import { createDependencyOnlyIntegration } from "./dependency-only.js";
import { ecosystems, frameworks, packageManagers } from "../types/ids.js";

export const expoSecureStoreIntegration = createDependencyOnlyIntegration({
  manifest: {
    id: "expo-secure-store",
    name: "Expo SecureStore",
    description: "Encrypted key-value storage for Expo applications.",
    capability: "secure-storage",
    version: "1.0.0",
    status: "stable",
    trust: "official",
    supports: {
      ecosystems: [ecosystems.node],
      frameworks: [frameworks.expo],
      packageManagers: [
        packageManagers.npm,
        packageManagers.pnpm,
        packageManagers.yarn,
        packageManagers.bun
      ]
    },
    dependencies: [{ name: "expo-secure-store", type: "runtime" }],
    configures: ["runtime dependency"],
    source: { owner: "avis" }
  },
  packageName: "expo-secure-store",
  planTitle: "Add Expo SecureStore",
  dependencyOperationId: "add-expo-secure-store",
  dependencyDescription: "Install Expo SecureStore.",
  compatibilityDescription: "Expo projects"
});
