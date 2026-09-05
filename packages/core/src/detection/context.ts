import type { DetectionResult, ProjectTarget } from "./types.js";
import type { ProjectContext } from "../types/project-context.js";

export function createProjectContext(
  detection: DetectionResult,
  target: ProjectTarget = detection.targets[0]
): ProjectContext {
  if (!target) {
    throw new Error("Cannot create a ProjectContext without a detected project target.");
  }

  return {
    workspaceRoot: detection.root,
    targetRoot: target.root,
    targetId: target.id,
    ecosystem: target.ecosystem.id,
    ecosystemConfidence: target.ecosystem.confidence,
    languages: target.languages,
    framework: target.frameworks[0]
      ? {
          id: target.frameworks[0].id,
          version: target.frameworks[0].version,
          confidence: target.frameworks[0].confidence
        }
      : undefined,
    frameworks: target.frameworks.map((framework) => ({
      id: framework.id,
      version: framework.version,
      confidence: framework.confidence
    })),
    packageManager: target.packageManagers[0]
      ? {
          id: target.packageManagers[0].id,
          version: target.packageManagers[0].version,
          confidence: target.packageManagers[0].confidence
      }
      : undefined,
    packageManagers: target.packageManagers.map((packageManager) => ({
      id: packageManager.id,
      version: packageManager.version,
      confidence: packageManager.confidence
    })),
    projectType: target.projectTypes[0]
      ? {
          id: target.projectTypes[0].id,
          confidence: target.projectTypes[0].confidence
        }
      : undefined,
    projectTypes: target.projectTypes.map((projectType) => ({
      id: projectType.id,
      confidence: projectType.confidence
    }))
  };
}
