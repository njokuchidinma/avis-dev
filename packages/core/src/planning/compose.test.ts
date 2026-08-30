import { describe, expect, it } from "vitest";
import { composeChangePlans, detectPlanConflicts } from "./compose.js";
import type { ChangePlan } from "./change-plan.js";
import type { ProjectContext } from "../types/project-context.js";

describe("composeChangePlans", () => {
  it("merges dependency adds for a combined preview", () => {
    const combined = composeChangePlans(
      [
        plan("zustand", [
          {
            id: "add-zustand",
            type: "dependency.add",
            description: "Install Zustand.",
            dependencyType: "runtime",
            packageManager: "pnpm",
            packages: [{ name: "zustand" }]
          }
        ]),
        plan("zod", [
          {
            id: "add-zod",
            type: "dependency.add",
            description: "Install Zod.",
            dependencyType: "runtime",
            packageManager: "pnpm",
            packages: [{ name: "zod" }]
          }
        ])
      ],
      {
        id: "next-standard",
        title: "Use next-standard stack",
        integrationId: "stack:next-standard",
        target: context
      }
    );

    expect(combined.operations).toEqual([
      {
        id: "add-zustand",
        type: "dependency.add",
        description: "Install zustand, zod.",
        dependencyType: "runtime",
        packageManager: "pnpm",
        packages: [{ name: "zustand" }, { name: "zod" }]
      }
    ]);
  });

  it("flags incompatible file writes", () => {
    const diagnostics = detectPlanConflicts([
      plan("first", [
        {
          id: "create-provider-a",
          type: "file.create",
          description: "Create provider.",
          path: "src/providers/index.tsx",
          contents: "export const a = 1;\n",
          overwrite: "never"
        }
      ]),
      plan("second", [
        {
          id: "create-provider-b",
          type: "file.create",
          description: "Create provider.",
          path: "src/providers/index.tsx",
          contents: "export const b = 1;\n",
          overwrite: "never"
        }
      ])
    ]);

    expect(diagnostics).toEqual([
      {
        severity: "error",
        message:
          "Conflicting operations target src/providers/index.tsx: create-provider-a and create-provider-b."
      }
    ]);
  });
});

const context: ProjectContext = {
  workspaceRoot: "/project",
  targetRoot: "/project",
  targetId: "project",
  ecosystem: "node",
  languages: ["typescript"],
  framework: {
    id: "nextjs"
  },
  packageManager: {
    id: "pnpm"
  }
};

function plan(id: string, operations: ChangePlan["operations"]): ChangePlan {
  return {
    id,
    title: id,
    integrationId: id,
    target: context,
    operations,
    diagnostics: []
  };
}
