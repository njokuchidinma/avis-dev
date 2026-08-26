import type { DetectionResult } from "./types.js";
import { detectNodeProject } from "./node.js";
import { detectPythonProject } from "./python.js";

export async function detectProject(root: string): Promise<DetectionResult> {
  const nodeResult = await detectNodeProject(root);
  if (nodeResult.targets.length > 0) {
    return nodeResult;
  }

  const pythonResult = await detectPythonProject(root);
  if (pythonResult.targets.length > 0) {
    return pythonResult;
  }

  return {
    root,
    targets: [],
    evidence: [],
    diagnostics: [...nodeResult.diagnostics, ...pythonResult.diagnostics]
  };
}
