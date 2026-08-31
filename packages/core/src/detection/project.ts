import type { DetectionResult } from "./types.js";
import { detectDartProject } from "./dart.js";
import { detectNodeProject } from "./node.js";
import { detectPhpProject } from "./php.js";
import { detectPythonProject } from "./python.js";
import { detectRustProject } from "./rust.js";

export async function detectProject(root: string): Promise<DetectionResult> {
  const results = await Promise.all([
    detectNodeProject(root),
    detectPythonProject(root),
    detectPhpProject(root),
    detectDartProject(root),
    detectRustProject(root)
  ]);

  for (const result of results) {
    if (result.targets.length > 0) {
      return result;
    }
  }

  const diagnostics = results.flatMap((result) => result.diagnostics);

  return {
    root,
    targets: [],
    evidence: [],
    diagnostics
  };
}
