import { describe, expect, it } from "vitest";
import { validateChangePlan } from "./validation.js";
import type { ChangePlan } from "./change-plan.js";

describe("validateChangePlan", () => {
  it("rejects operations that escape the project root", () => {
    const result = validateChangePlan({
      ...basePlan,
      operations: [
        {
          id: "unsafe-file",
          type: "file.create",
          description: "Create a file outside the project.",
          path: "../outside.ts",
          contents: "",
          overwrite: "never"
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.message).toContain("unsafe path");
  });

  it("rejects duplicate operation ids", () => {
    const result = validateChangePlan({
      ...basePlan,
      operations: [
        {
          id: "same",
          type: "dependency.add",
          description: "Install one package.",
          packages: [{ name: "zustand" }],
          dependencyType: "runtime"
        },
        {
          id: "same",
          type: "dependency.add",
          description: "Install another package.",
          packages: [{ name: "jotai" }],
          dependencyType: "runtime"
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.message.includes("Duplicate"))).toBe(
      true
    );
  });
});

const basePlan: ChangePlan = {
  id: "test-plan",
  title: "Test plan",
  integrationId: "test",
  target: {
    workspaceRoot: "/project",
    targetRoot: "/project",
    targetId: "test",
    ecosystem: "node",
    languages: ["typescript"],
    framework: {
      id: "nextjs"
    },
    packageManager: {
      id: "pnpm"
    }
  },
  operations: [],
  diagnostics: []
};
