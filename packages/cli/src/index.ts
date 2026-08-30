#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  applyChangePlan,
  builtInCapabilities,
  builtInIntegrations,
  composeChangePlans,
  createProjectContext,
  detectProject,
  formatChangePlan,
  isEmptyChangePlan,
  recordAppliedIntegrationPlan,
  readAvisProjectState,
  runPackageManagerCommand,
  validateChangePlan,
  type AvisIntegration,
  type ProjectContext,
  type VerificationResult
} from "@avis/core";
import {
  createIntegrationRegistry,
  formatSupportGroupLabel,
  type IntegrationRecommendation,
  type IntegrationRegistry,
  type StackManifest
} from "@avis/registry";

const builtInStacks: StackManifest[] = [
  {
    id: "next-standard",
    name: "Next Standard",
    description: "Common Next.js application capabilities.",
    capabilities: [
      "state-management",
      "data-fetching",
      "validation",
      "forms",
      "icons"
    ]
  }
];

const registry = createIntegrationRegistry({
  capabilities: builtInCapabilities,
  integrations: builtInIntegrations,
  stacks: builtInStacks
});

interface DoctorEntry {
  integration: AvisIntegration;
  verification: VerificationResult;
}

interface CliOptions {
  yes: boolean;
  dryRun: boolean;
  json: boolean;
  strict: boolean;
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const { positionals, options } = parseArgs(args);
  const [command, subject] = positionals;

  if (!command) {
    await runAddInteractive();
    return;
  }

  if (command === "add" && subject) {
    await runAdd(subject, options);
    return;
  }

  if (command === "add") {
    await runAddInteractive();
    return;
  }

  if (command === "repair" && subject) {
    await runRepair(subject, options);
    return;
  }

  if (command === "repair") {
    console.error("Usage: avis repair <integration|capability>");
    process.exitCode = 1;
    return;
  }

  if (command === "list") {
    printList();
    return;
  }

  if (command === "show" && subject) {
    printShow(subject);
    return;
  }

  if (command === "show") {
    console.error("Usage: avis show <integration|capability>");
    process.exitCode = 1;
    return;
  }

  if (command === "doctor") {
    await runDoctor(options);
    return;
  }

  if (command === "stack") {
    await runStack(subject, positionals[2], options);
    return;
  }

  if (command === "integration") {
    await runIntegrationCommand(subject, positionals[2]);
    return;
  }

  printHelp();
}

async function runIntegrationCommand(
  action: string | undefined,
  integrationId: string | undefined
): Promise<void> {
  if (action !== "create" || !integrationId) {
    console.error("Usage: avis integration create <integration-id>");
    process.exitCode = 1;
    return;
  }

  await scaffoldIntegration(integrationId);
}

async function scaffoldIntegration(integrationId: string): Promise<void> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(integrationId)) {
    console.error("Integration id must use lowercase kebab-case.");
    process.exitCode = 1;
    return;
  }

  const root = path.join(process.cwd(), integrationId);
  if (await pathExists(root)) {
    console.error(`Refusing to overwrite existing path: ${integrationId}`);
    process.exitCode = 1;
    return;
  }

  await mkdir(path.join(root, "fixtures"), { recursive: true });
  await mkdir(path.join(root, "tests"), { recursive: true });
  await writeFile(path.join(root, "manifest.ts"), createManifestTemplate(integrationId), "utf8");
  await writeFile(path.join(root, "plan.ts"), createPlanTemplate(integrationId), "utf8");
  await writeFile(path.join(root, "verify.ts"), createVerifyTemplate(integrationId), "utf8");
  await writeFile(path.join(root, "fixtures/.gitkeep"), "", "utf8");
  await writeFile(path.join(root, "tests/integration.test.ts"), createTestTemplate(integrationId), "utf8");
  await writeFile(path.join(root, "README.md"), createIntegrationReadme(integrationId), "utf8");

  console.log(`Created integration scaffold at ${integrationId}`);
}

async function runStack(
  action: string | undefined,
  stackId: string | undefined,
  options: CliOptions
): Promise<void> {
  switch (action) {
    case "list":
      printStackList();
      return;

    case "show":
      if (!stackId) {
        console.error("Usage: avis stack show <stack>");
        process.exitCode = 1;
        return;
      }
      printStackShow(stackId);
      return;

    case "use":
      if (!stackId) {
        console.error("Usage: avis stack use <stack>");
        process.exitCode = 1;
        return;
      }
      await runStackUse(stackId, options);
      return;

    default:
      console.error("Usage: avis stack <list|show|use>");
      process.exitCode = 1;
  }
}

function printStackList(): void {
  console.log("Stacks:");
  for (const stack of registry.stacks) {
    console.log(`- ${stack.id}: ${stack.name}`);
  }
}

function printStackShow(stackId: string): void {
  const stack = registry.findStackById(stackId);
  if (!stack) {
    console.error(`Unknown stack: ${stackId}`);
    process.exitCode = 1;
    return;
  }

  console.log(stack.name);
  if (stack.description) {
    console.log(stack.description);
  }
  console.log("");
  console.log("Capabilities:");
  for (const capability of stack.capabilities ?? []) {
    console.log(`- ${capability}`);
  }
  console.log("");
  console.log("Pinned integrations:");
  const pinnedIntegrations = stack.integrations ?? [];
  if (pinnedIntegrations.length === 0) {
    console.log("- none");
  }
  for (const integration of pinnedIntegrations) {
    console.log(`- ${integration}`);
  }
}

async function runStackUse(stackId: string, options: CliOptions): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const stack = registry.findStackById(stackId);
  if (!stack) {
    console.error(`Unknown stack: ${stackId}`);
    process.exitCode = 1;
    return;
  }

  const resolved = registry.resolveStack(stack.id, context);
  if (!resolved) {
    console.error(`Unknown stack: ${stackId}`);
    process.exitCode = 1;
    return;
  }

  if (resolved.diagnostics.length > 0) {
    console.error("Avis cannot use this stack:");
    for (const diagnostic of resolved.diagnostics) {
      console.error(`- ${diagnostic}`);
    }
    process.exitCode = 1;
    return;
  }

  const plans = await Promise.all(
    resolved.integrations.map((integration) => integration.plan({ context }))
  );
  const plan = composeChangePlans(plans, {
    id: `stack:${stack.id}`,
    title: `Use ${stack.name}`,
    integrationId: `stack:${stack.id}`,
    target: context
  });
  const validation = validateChangePlan(plan);

  console.log(formatDetectedProject(context));
  console.log("");
  console.log(`Stack: ${stack.name}`);
  console.log(
    `Resolved integrations: ${resolved.integrations
      .map((integration) => integration.manifest.id)
      .join(", ")}`
  );
  console.log("");
  console.log(formatChangePlan(plan));

  if (!validation.valid) {
    console.error("");
    console.error("Avis cannot apply this stack plan:");
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
    await printStackVerification(resolved.integrations, context);
    return;
  }

  const confirmed = options.yes || options.dryRun || (await confirm("Apply stack changes?"));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const result = await applyChangePlan(plan, {
    dryRun: options.dryRun,
    commandRunner: runPackageManagerCommand
  });

  for (const applied of result.applied) {
    console.log(`${applied.skipped ? "-" : "OK"} ${applied.message}`);
  }

  if (!options.dryRun) {
    for (const [index, integration] of resolved.integrations.entries()) {
      const integrationPlan = plans[index];
      if (integrationPlan) {
        await recordAppliedIntegrationPlan(integrationPlan, integration);
      }
    }
  }

  await printStackVerification(resolved.integrations, context);
}

async function runAdd(subject: string, options: CliOptions): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const integration = await resolveIntegration(subject, context, registry, options);

  if (!integration) {
    return;
  }

  await planConfirmApplyAndVerify(integration, context, options);
}

async function runRepair(subject: string, options: CliOptions): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const integration = await resolveIntegration(subject, context, registry, options);
  if (!integration) {
    return;
  }

  if (!integration.verify) {
    console.error(`${integration.manifest.name} does not expose a verifier yet.`);
    process.exitCode = 1;
    return;
  }

  const verification = await integration.verify(context);
  if (verification.health === "healthy") {
    console.log(`${integration.manifest.name} is already healthy.`);
    console.log("");
    console.log(formatVerification(verification));
    return;
  }

  await planConfirmApplyAndVerify(integration, context, options);
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
  console.log("  avis add auth");
  console.log("  avis add observability");
  console.log("  avis add icons");
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
  integrationRegistry: IntegrationRegistry,
  options: CliOptions
): Promise<AvisIntegration | undefined> {
  const directIntegration = integrationRegistry.findIntegrationById(subject);
  if (directIntegration) {
    const compatibility = directIntegration.isCompatible(context);
    if (!compatibility.supported) {
      console.error(compatibility.reason);
      printSupportedTargets(integrationRegistry);
      process.exitCode = 1;
      return undefined;
    }

    return directIntegration;
  }

  const capability = integrationRegistry.findCapabilityByQuery(subject);
  if (!capability) {
    console.error(`Unknown integration or capability: ${subject}`);
    printKnownCommands();
    process.exitCode = 1;
    return undefined;
  }

  const recommendations = integrationRegistry.recommendIntegrationsForCapability(
    capability.id,
    context
  );
  if (recommendations.length === 1) {
    return recommendations[0]?.integration;
  }

  if (recommendations.length === 0) {
    console.error(
      `No compatible ${capability.name} integrations are available for this project yet.`
    );
    printSupportedTargets(integrationRegistry);
    process.exitCode = 1;
    return undefined;
  }

  printCapabilityRecommendations(capability.name, recommendations);

  const recommended = recommendations[0];
  if (!recommended) {
    return undefined;
  }

  if (options.yes || options.dryRun) {
    return recommended.integration;
  }

  const confirmed = await confirm(
    `Use recommended integration ${recommended.integration.manifest.id}?`
  );
  if (confirmed) {
    return recommended.integration;
  }

  console.log("");
  console.log(
    `Run avis add <integration>, for example: avis add ${recommended.integration.manifest.id}`
  );
  return undefined;
}

async function planConfirmApplyAndVerify(
  integration: AvisIntegration,
  context: ProjectContext,
  options: CliOptions
): Promise<void> {
  const compatibility = integration.isCompatible(context);

  if (!compatibility.supported) {
    console.error(compatibility.reason);
    process.exitCode = 1;
    return;
  }

  const conflicts = await registry.findInstalledCapabilityConflicts(integration, context);
  if (conflicts.length > 0) {
    console.log("Conflict warnings:");
    for (const conflict of conflicts) {
      console.log(`- ${conflict}`);
    }
    console.log("");
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

  const confirmed = options.yes || options.dryRun || (await confirm("Apply changes?"));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const result = await applyChangePlan(plan, {
    dryRun: options.dryRun,
    commandRunner: runPackageManagerCommand
  });

  for (const applied of result.applied) {
    console.log(`${applied.skipped ? "-" : "OK"} ${applied.message}`);
  }

  if (!options.dryRun) {
    await recordAppliedIntegrationPlan(plan, integration);
  }

  await printVerification(integration, context);
}

async function runDoctor(options: CliOptions): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const entries = await collectDoctorEntries(context);
  const state = await readAvisProjectState(context.targetRoot);

  if (options.json) {
    console.log(JSON.stringify(formatDoctorJson(context, entries, state), null, 2));
  } else {
    printDoctorReport(context, entries, Object.keys(state.integrations));
  }

  if (
    options.strict &&
    entries.some((entry) => !["healthy", "not-installed"].includes(entry.verification.health))
  ) {
    process.exitCode = 1;
  }
}

async function collectDoctorEntries(context: ProjectContext): Promise<DoctorEntry[]> {
  const compatibleIntegrations = registry.integrations.filter(
    (integration) => integration.isCompatible(context).supported && integration.verify
  );

  const entries: DoctorEntry[] = [];

  for (const integration of compatibleIntegrations) {
    const verification = await integration.verify?.(context);
    if (!verification) {
      continue;
    }

    entries.push({ integration, verification });
  }

  return entries;
}

function printDoctorReport(
  context: ProjectContext,
  entries: DoctorEntry[],
  rememberedIntegrationIds: string[]
): void {
  console.log("Avis Project Health");
  console.log("");
  console.log(formatDetectedProject(context));

  if (entries.length === 0) {
    console.log("");
    console.log("No compatible verifiers are available for this project yet.");
    printSupportedTargets(registry);
    return;
  }

  console.log("");
  console.log(formatDoctorSummary(entries));
  if (rememberedIntegrationIds.length > 0) {
    console.log(
      `Avis remembers applying: ${rememberedIntegrationIds.sort().join(", ")}`
    );
  }

  for (const health of doctorHealthOrder) {
    const group = entries.filter((entry) => entry.verification.health === health);
    if (group.length === 0) {
      continue;
    }

    console.log("");
    console.log(formatHealthLabel(health));

    for (const entry of group) {
      console.log("");
      console.log(entry.integration.manifest.name);
      console.log(formatVerification(entry.verification));
    }
  }
}

function formatDoctorJson(
  context: ProjectContext,
  entries: DoctorEntry[],
  state: Awaited<ReturnType<typeof readAvisProjectState>>
): unknown {
  return {
    status: getOverallDoctorStatus(entries),
    project: {
      targetId: context.targetId,
      ecosystem: context.ecosystem,
      framework: context.framework?.id,
      packageManager: context.packageManager?.id,
      languages: context.languages
    },
    integrations: entries.map((entry) => ({
      id: entry.integration.manifest.id,
      name: entry.integration.manifest.name,
      capability: entry.integration.manifest.capability,
      health: entry.verification.health,
      checks: entry.verification.checks,
      diagnostics: entry.verification.diagnostics
    })),
    state: {
      schemaVersion: state.schemaVersion,
      rememberedIntegrations: Object.entries(state.integrations).map(
        ([id, record]) => ({
          id,
          integrationVersion: record.integrationVersion,
          appliedAt: record.appliedAt,
          files: record.files.map((file) => ({
            path: file.path,
            createdByAvis: file.createdByAvis,
            modifiedByAvis: file.modifiedByAvis
          })),
          dependencies: record.dependencies.map((dependency) => ({
            name: dependency.name,
            packageManager: dependency.packageManager,
            dependencyType: dependency.dependencyType
          }))
        })
      )
    }
  };
}

function printHelp(): void {
  console.log(`Avis

Usage:
  avis
  avis add
  avis add <capability>
  avis add zustand
  avis repair <integration>
  avis list
  avis show <integration|capability>
  avis stack list
  avis stack show <stack>
  avis stack use <stack>
  avis integration create <integration-id>
  avis doctor [--json] [--strict]
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
    console.log(
      `- ${integration.manifest.id}: ${integration.manifest.name} (${integration.manifest.capability})`
    );
  }
}

function printShow(subject: string): void {
  const integration = registry.findIntegrationById(subject);
  if (integration) {
    printIntegrationDetails(integration);
    return;
  }

  const capability = registry.findCapabilityByQuery(subject);
  if (capability) {
    const integrations = registry.integrations.filter(
      (candidate) => candidate.manifest.capability === capability.id
    );

    console.log(capability.name);
    if (capability.description) {
      console.log(capability.description);
    }

    console.log("");
    console.log("Integrations:");
    if (integrations.length === 0) {
      console.log("- none");
      return;
    }

    for (const candidate of integrations) {
      console.log(
        `- ${candidate.manifest.id}: ${candidate.manifest.name} (${formatStatusLabel(candidate.manifest.status)})`
      );
    }
    return;
  }

  console.error(`Unknown integration or capability: ${subject}`);
  printKnownCommands();
  process.exitCode = 1;
}

function printIntegrationDetails(integration: AvisIntegration): void {
  const manifest = integration.manifest;

  console.log(manifest.name);
  console.log(manifest.description);
  console.log("");
  console.log("Identity");
  console.log(`- ID: ${manifest.id}`);
  console.log(`- Capability: ${manifest.capability}`);
  console.log(`- Version: ${manifest.version}`);
  console.log(`- Status: ${formatStatusLabel(manifest.status)}`);
  console.log("");
  console.log("Supports");
  console.log(`- Ecosystems: ${formatList(manifest.supports.ecosystems)}`);
  console.log(`- Frameworks: ${formatList(manifest.supports.frameworks)}`);
  console.log(`- Package managers: ${formatList(manifest.supports.packageManagers)}`);

  if (manifest.dependencies && manifest.dependencies.length > 0) {
    console.log("");
    console.log("Dependencies");
    for (const dependency of manifest.dependencies) {
      const optional = dependency.optional ? ", optional" : "";
      console.log(`- ${dependency.name} (${dependency.type}${optional})`);
    }
  }

  if (manifest.configures && manifest.configures.length > 0) {
    console.log("");
    console.log("Avis Configures");
    for (const configuredItem of manifest.configures) {
      console.log(`- ${configuredItem}`);
    }
  }

  if (manifest.documentation?.homepage || manifest.documentation?.quickstart) {
    console.log("");
    console.log("Documentation");
    if (manifest.documentation.homepage) {
      console.log(`- Homepage: ${manifest.documentation.homepage}`);
    }
    if (manifest.documentation.quickstart) {
      console.log(`- Quickstart: ${manifest.documentation.quickstart}`);
    }
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
    console.log(`- ${integration.manifest.id}`);
  }
}

function printSupportedTargets(integrationRegistry: IntegrationRegistry): void {
  console.log("");
  console.log("Available integrations currently support:");
  for (const group of integrationRegistry.getSupportGroups()) {
    const integrations = group.integrations
      .map((integration) => integration.manifest.id)
      .join(", ");
    console.log(`- ${formatSupportGroupLabel(group)}: ${integrations}`);
  }
}

function printCapabilityRecommendations(
  capabilityName: string,
  recommendations: IntegrationRecommendation[]
): void {
  console.log(`${capabilityName} integrations:`);
  for (const [index, recommendation] of recommendations.entries()) {
    const marker = recommendation.recommended || index === 0 ? "recommended" : "alternative";
    console.log("");
    console.log(`${index + 1}. ${recommendation.integration.manifest.name} (${marker})`);
    console.log(`   ID: ${recommendation.integration.manifest.id}`);
    console.log(`   ${recommendation.integration.manifest.description}`);
    console.log("   Why:");
    for (const reason of recommendation.reasons) {
      console.log(`   - ${reason}`);
    }
  }
  console.log("");
  console.log(`Recommended: ${recommendations[0]?.integration.manifest.id}`);
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

function formatList(values: readonly string[] | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "any";
}

function formatStatusLabel(status: AvisIntegration["manifest"]["status"]): string {
  switch (status) {
    case "experimental":
      return "Experimental";
    case "stable":
      return "Stable";
    case "deprecated":
      return "Deprecated";
  }
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

async function printStackVerification(
  integrations: AvisIntegration[],
  context: ProjectContext
): Promise<void> {
  for (const integration of integrations) {
    if (!integration.verify) {
      continue;
    }

    console.log("");
    console.log(integration.manifest.name);
    await printVerification(integration, context);
  }
}

function formatVerification(result: VerificationResult): string {
  return [
    "Verification:",
    ...result.checks.map((check) => {
      const icon =
        check.status === "pass"
          ? "OK"
          : check.status === "warning"
            ? "WARN"
            : check.status === "skipped"
              ? "SKIP"
              : "FAIL";
      const detail = check.message ? ` - ${check.message}` : "";
      const remediation = check.remediation ? ` (${check.remediation})` : "";
      return `${icon} ${check.label}${detail}${remediation}`;
    })
  ].join("\n");
}

const doctorHealthOrder: VerificationResult["health"][] = [
  "broken",
  "partial",
  "unknown",
  "healthy",
  "not-installed"
];

function formatDoctorSummary(entries: DoctorEntry[]): string {
  const counts = new Map<VerificationResult["health"], number>();
  for (const entry of entries) {
    const currentCount = counts.get(entry.verification.health) ?? 0;
    counts.set(entry.verification.health, currentCount + 1);
  }

  const parts = doctorHealthOrder
    .map((health) => {
      const count = counts.get(health) ?? 0;
      return count > 0 ? `${formatHealthLabel(health).toLowerCase()}: ${count}` : undefined;
    })
    .filter((part): part is string => part !== undefined);

  return `Summary: ${parts.length > 0 ? parts.join(", ") : "no integrations checked"}`;
}

function getOverallDoctorStatus(entries: DoctorEntry[]): VerificationResult["health"] {
  for (const health of doctorHealthOrder) {
    if (entries.some((entry) => entry.verification.health === health)) {
      return health;
    }
  }

  return "unknown";
}

function createManifestTemplate(integrationId: string): string {
  return `import type { AvisIntegrationManifest } from "@avis/core";

export const manifest = {
  id: "${integrationId}",
  name: "${toTitleCase(integrationId)}",
  description: "Describe the project capability this integration provides.",
  capability: "replace-with-capability-id",
  version: "0.1.0",
  status: "experimental",
  supports: {
    ecosystems: ["node"]
  },
  dependencies: [],
  configures: [],
  source: {
    owner: "community"
  }
} satisfies AvisIntegrationManifest;
`;
}

function createPlanTemplate(integrationId: string): string {
  return `import type { ChangePlan, IntegrationPlanRequest } from "@avis/core";
import { manifest } from "./manifest.js";

export async function plan({ context }: IntegrationPlanRequest): Promise<ChangePlan> {
  return {
    id: manifest.id,
    title: "Add ${toTitleCase(integrationId)}",
    integrationId: manifest.id,
    target: context,
    operations: [],
    diagnostics: []
  };
}
`;
}

function createVerifyTemplate(integrationId: string): string {
  return `import type { ProjectContext, VerificationResult } from "@avis/core";
import { manifest } from "./manifest.js";

export async function verify(_context: ProjectContext): Promise<VerificationResult> {
  return {
    integrationId: manifest.id,
    health: "unknown",
    checks: [
      {
        id: "${integrationId}-manual-check",
        label: "integration verification",
        status: "skipped",
        message: "Add project inspection checks before submitting this integration."
      }
    ],
    diagnostics: []
  };
}
`;
}

function createTestTemplate(integrationId: string): string {
  return `import { describe, expect, it } from "vitest";
import { manifest } from "../manifest.js";

describe("${integrationId}", () => {
  it("declares a capability", () => {
    expect(manifest.capability).not.toBe("replace-with-capability-id");
  });
});
`;
}

function createIntegrationReadme(integrationId: string): string {
  return `# ${toTitleCase(integrationId)}

Describe the capability this integration provides, the projects it supports, the files it may create or modify, and how verification works.

Before this integration is ready, add:

- manifest metadata
- compatibility checks
- ChangePlan generation
- verifier checks
- fixtures
- tests
`;
}

function toTitleCase(value: string): string {
  return value
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function formatHealthLabel(health: VerificationResult["health"]): string {
  switch (health) {
    case "not-installed":
      return "NOT INSTALLED";
    case "healthy":
      return "HEALTHY";
    case "partial":
      return "PARTIAL";
    case "broken":
      return "BROKEN";
    case "unknown":
      return "UNKNOWN";
  }
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

function parseArgs(args: string[]): { positionals: string[]; options: CliOptions } {
  const options: CliOptions = {
    yes: false,
    dryRun: false,
    json: false,
    strict: false
  };
  const positionals: string[] = [];

  for (const arg of args) {
    switch (arg) {
      case "--yes":
      case "-y":
        options.yes = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--strict":
        options.strict = true;
        break;
      default:
        positionals.push(arg);
    }
  }

  return { positionals, options };
}

runCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
