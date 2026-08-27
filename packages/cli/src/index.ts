#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  applyChangePlan,
  builtInCapabilities,
  builtInIntegrations,
  createProjectContext,
  detectProject,
  formatChangePlan,
  isEmptyChangePlan,
  runPackageManagerCommand,
  validateChangePlan,
  type AvisIntegration,
  type ProjectContext,
  type VerificationResult
} from "@avis/core";
import {
  createIntegrationRegistry,
  formatSupportGroupLabel,
  type IntegrationRegistry
} from "@avis/registry";

const registry = createIntegrationRegistry({
  capabilities: builtInCapabilities,
  integrations: builtInIntegrations
});

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const [command, subject] = args;

  if (!command) {
    await runAddInteractive();
    return;
  }

  if (command === "add" && subject) {
    await runAdd(subject);
    return;
  }

  if (command === "add") {
    await runAddInteractive();
    return;
  }

  if (command === "list") {
    printList();
    return;
  }

  if (command === "doctor") {
    await runDoctor();
    return;
  }

  printHelp();
}

async function runAdd(subject: string): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const integration = await resolveIntegration(subject, context, registry);

  if (!integration) {
    process.exitCode = 1;
    return;
  }

  await planConfirmApplyAndVerify(integration, context);
}

async function runAddInteractive(): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    printHelp();
    return;
  }

  console.log(formatDetectedProject(context));
  console.log("");
  console.log("Capabilities:");
  for (const capability of builtInCapabilities) {
    const compatible = registry.findCompatibleIntegrationsForCapability(
      capability.id,
      context
    );
    console.log(
      `- ${capability.id}${compatible.length > 0 ? ` (${compatible.length} compatible)` : ""}`
    );
  }
  console.log("");
  console.log("Run one of:");
  console.log("  avis add state-management");
  console.log("  avis add data-fetching");
  console.log("  avis add forms");
  console.log("  avis add validation");
  console.log("  avis add api");
  console.log("  avis add zustand");
}

async function detectSingleProjectContext(): Promise<ProjectContext | undefined> {
  const detection = await detectProject(process.cwd());
  const target = detection.targets[0];

  if (!target) {
    console.error("Avis could not detect a supported project in this directory.");
    for (const diagnostic of detection.diagnostics) {
      console.error(`- ${diagnostic.message}`);
    }
    process.exitCode = 1;
    return undefined;
  }

  return createProjectContext(detection, target);
}

async function resolveIntegration(
  subject: string,
  context: ProjectContext,
  integrationRegistry: IntegrationRegistry
): Promise<AvisIntegration | undefined> {
  const directIntegration = integrationRegistry.findIntegrationById(subject);
  if (directIntegration) {
    const compatibility = directIntegration.isCompatible(context);
    if (!compatibility.supported) {
      console.error(compatibility.reason);
      printSupportedTargets(integrationRegistry);
      return undefined;
    }

    return directIntegration;
  }

  const capability = integrationRegistry.findCapabilityById(subject);
  if (!capability) {
    console.error(`Unknown integration or capability: ${subject}`);
    printKnownCommands();
    return undefined;
  }

  const compatible = integrationRegistry.findCompatibleIntegrationsForCapability(
    capability.id,
    context
  );
  if (compatible.length === 1) {
    return compatible[0];
  }

  if (compatible.length === 0) {
    console.error(
      `No compatible ${capability.name} integrations are available for this project yet.`
    );
    printSupportedTargets(integrationRegistry);
    return undefined;
  }

  console.log(`${capability.name} integrations:`);
  for (const integration of compatible) {
    console.log(`- ${integration.id} (${integration.name})`);
  }
  console.log("");
  console.log(`Run avis add <integration>, for example: avis add ${compatible[0]?.id}`);
  return undefined;
}

async function planConfirmApplyAndVerify(
  integration: AvisIntegration,
  context: ProjectContext
): Promise<void> {
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

async function runDoctor(): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  console.log("Avis Project Health");
  console.log("");
  console.log(formatDetectedProject(context));

  const compatibleIntegrations = registry.integrations.filter(
    (integration) => integration.isCompatible(context).supported && integration.verify
  );

  if (compatibleIntegrations.length === 0) {
    console.log("");
    console.log("No compatible verifiers are available for this project yet.");
    printSupportedTargets(registry);
    return;
  }

  for (const integration of compatibleIntegrations) {
    const verification = await integration.verify?.(context);
    if (!verification) {
      continue;
    }

    console.log("");
    console.log(`${integration.name}: ${verification.status.toUpperCase()}`);
    console.log(formatVerification(verification));
  }
}

function printHelp(): void {
  console.log(`Avis

Usage:
  avis
  avis add
  avis add <capability>
  avis add zustand
  avis list
  avis doctor
`);
}

function printList(): void {
  console.log("Capabilities:");
  for (const capability of registry.capabilities) {
    console.log(`- ${capability.id}: ${capability.name}`);
  }

  console.log("");
  console.log("Integrations:");
  for (const integration of registry.integrations) {
    console.log(`- ${integration.id}: ${integration.name} (${integration.capability})`);
  }
}

function printKnownCommands(): void {
  console.log("");
  console.log("Known capabilities:");
  for (const capability of registry.capabilities) {
    console.log(`- ${capability.id}`);
  }

  console.log("");
  console.log("Known integrations:");
  for (const integration of registry.integrations) {
    console.log(`- ${integration.id}`);
  }
}

function printSupportedTargets(integrationRegistry: IntegrationRegistry): void {
  console.log("");
  console.log("Available integrations currently support:");
  for (const group of integrationRegistry.getSupportGroups()) {
    const integrations = group.integrations
      .map((integration) => integration.id)
      .join(", ");
    console.log(`- ${formatSupportGroupLabel(group)}: ${integrations}`);
  }
}

function formatDetectedProject(context: ProjectContext): string {
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
  context: ProjectContext
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
