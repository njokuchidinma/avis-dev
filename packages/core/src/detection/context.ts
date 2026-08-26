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
    languages: target.languages,
    framework: target.frameworks[0]
      ? {
          id: target.frameworks[0].id,
          version: target.frameworks[0].version
        }
      : undefined,
    packageManager: target.packageManagers[0]
      ? {
          id: target.packageManagers[0].id,
          version: target.packageManagers[0].version
        }
      : undefined
  };
}
