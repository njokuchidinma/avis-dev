#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  applyChangePlan,
  createProjectContext,
  detectProject,
  formatChangePlan,
  isEmptyChangePlan,
  runPackageManagerCommand,
  validateChangePlan,
  zustandIntegration,
  type AvisIntegration,
  type VerificationResult
} from "@avis/core";

const integrations = new Map<string, AvisIntegration>([
  [zustandIntegration.id, zustandIntegration]
]);

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const [command, subject] = argv;

  if (!command) {
    printHelp();
    return;
  }

  if (command === "add" && subject) {
    await runAdd(subject);
    return;
  }

  printHelp();
}

async function runAdd(subject: string): Promise<void> {
  const integration = integrations.get(subject);

  if (!integration) {
    console.error(`Unknown integration or capability: ${subject}`);
    process.exitCode = 1;
    return;
  }

  const detection = await detectProject(process.cwd());
  const target = detection.targets[0];

  if (!target) {
    console.error("Avis could not detect a supported project in this directory.");
    for (const diagnostic of detection.diagnostics) {
      console.error(`- ${diagnostic.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const context = createProjectContext(detection, target);
  const compatibility = integration.isCompatible(context);

  if (!compatibility.supported) {
    console.error(compatibility.reason);
    process.exitCode = 1;
    return;
  }

  const plan = await integration.plan({ context });
  const validation = validateChangePlan(plan);

  console.log(formatDetectedProject(context));
  console.log("");
  console.log(formatChangePlan(plan));

  if (!validation.valid) {
    console.error("");
    console.error("Avis cannot apply this plan:");
    for (const diagnostic of validation.diagnostics) {
      if (diagnostic.severity === "error") {
        console.error(`- ${diagnostic.message}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  if (isEmptyChangePlan(plan)) {
    console.log("");
    console.log("No changes required.");
    await printVerification(integration, context);
    return;
  }

  const confirmed = await confirm("Apply changes?");
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const result = await applyChangePlan(plan, {
    commandRunner: runPackageManagerCommand
  });

  for (const applied of result.applied) {
    console.log(`${applied.skipped ? "-" : "OK"} ${applied.message}`);
  }

  await printVerification(integration, context);
}

function printHelp(): void {
  console.log(`Avis

Usage:
  avis add zustand
`);
}

function formatDetectedProject(context: ReturnType<typeof createProjectContext>): string {
  return [
    "Detected:",
    `Framework: ${context.framework?.id ?? "unknown"}`,
    `Language: ${context.languages.join(", ") || "unknown"}`,
    `Ecosystem: ${context.ecosystem}`,
    `Package manager: ${context.packageManager?.id ?? "unknown"}`
  ].join("\n");
}

async function printVerification(
  integration: AvisIntegration,
  context: ReturnType<typeof createProjectContext>
): Promise<void> {
  if (!integration.verify) {
    return;
  }

  const verification = await integration.verify(context);
  console.log("");
  console.log(formatVerification(verification));
}

function formatVerification(result: VerificationResult): string {
  return [
    "Verification:",
    ...result.checks.map((check) => {
      const icon =
        check.status === "pass" ? "OK" : check.status === "warning" ? "WARN" : "FAIL";
      return `${icon} ${check.label}${check.message ? ` - ${check.message}` : ""}`;
    })
  ].join("\n");
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(`${question} [y/N] `);
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

runCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
