import type { ChangePlan } from "./change-plan.js";
import type { Operation } from "./operations.js";

export function formatChangePlan(plan: ChangePlan): string {
  const lines = [`Avis will make these changes:`, ""];

  if (plan.operations.length === 0) {
    lines.push("No changes required.");
    return lines.join("\n");
  }

  for (const operation of plan.operations) {
    lines.push(formatOperation(operation));
  }

  return lines.join("\n");
}

function formatOperation(operation: Operation): string {
  switch (operation.type) {
    case "dependency.add":
      return `Dependencies\n+ ${operation.packages
        .map((pkg) => (pkg.version ? `${pkg.name}@${pkg.version}` : pkg.name))
        .join(", ")}`;

    case "dependency.remove":
      return `Dependencies\n- ${operation.packages.join(", ")}`;

    case "file.create":
      return `Files\n+ ${operation.path}`;

    case "json.merge":
      return `Configuration\n~ ${operation.path}`;

    case "text.patch":
      return `Files\n~ ${operation.path}`;

    case "env.ensure":
      return `Environment\n~ ${operation.path}`;
  }
}
