import type { DetectionResult } from "./types.js";
import { ecosystemAdapters } from "../ecosystems/catalog.js";

export async function detectProject(root: string): Promise<DetectionResult> {
  const results = await Promise.all(
    ecosystemAdapters.map((adapter) => adapter.detect(root))
  );

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
