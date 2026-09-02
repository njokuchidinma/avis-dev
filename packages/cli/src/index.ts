#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
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
  loadLocalIntegrations,
  localIntegrationManifestFile,
  localIntegrationPlanFile,
  localIntegrationRegistryPath,
  localIntegrationVerifyFile,
  recordAppliedIntegrationPlan,
  readAvisProjectState,
  readLocalIntegrationRegistry,
  registerLocalIntegration,
  resolveInsideRoot,
  runPackageManagerCommand,
  validateChangePlan,
  type AvisIntegration,
  type Diagnostic,
  type ProjectContext,
  type VerificationResult
} from "@avis/core";
import {
  createIntegrationRegistry,
  formatSupportGroupLabel,
  type IntegrationRecommendation,
  type IntegrationRegistry,
  type StackManifest,
  validateStackManifest
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


interface DoctorEntry {
  integration: AvisIntegration;
  verification: VerificationResult;
}

interface RuntimeRegistry {
  registry: IntegrationRegistry;
  diagnostics: Diagnostic[];
}

interface CliOptions {
  yes: boolean;
  dryRun: boolean;
  json: boolean;
  strict: boolean;
}

async function createRuntimeRegistry(projectRoot = process.cwd()): Promise<RuntimeRegistry> {
  const local = await loadLocalIntegrations(projectRoot);

  return {
    registry: createIntegrationRegistry({
      capabilities: builtInCapabilities,
      integrations: [...builtInIntegrations, ...local.integrations],
      stacks: builtInStacks
    }),
    diagnostics: local.diagnostics
  };
}

function printRuntimeDiagnostics(diagnostics: Diagnostic[]): void {
  for (const diagnostic of diagnostics) {
    const prefix = diagnostic.severity === "error" ? "Error" : "Warning";
    console.error(`${prefix}: ${diagnostic.message}`);
  }
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
    await printList();
    return;
  }

  if (command === "show" && subject) {
    await printShow(subject);
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


  if (command === "search" && subject) {
    await printSearch(positionals.slice(1).join(" "));
    return;
  }

  if (command === "search") {
    console.error("Usage: avis search <query>");
    process.exitCode = 1;
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
  value: string | undefined
): Promise<void> {
  switch (action) {
    case "create":
      if (!value) {
        console.error("Usage: avis integration create <integration-id>");
        process.exitCode = 1;
        return;
      }
      await scaffoldIntegration(value);
      return;

    case "add":
      if (!value) {
        console.error("Usage: avis integration add <local-path>");
        process.exitCode = 1;
        return;
      }
      await addLocalIntegration(value);
      return;

    case "list":
      await printLocalIntegrationList();
      return;

    default:
      console.error("Usage: avis integration <create|add|list>");
      process.exitCode = 1;
  }
}

async function addLocalIntegration(integrationPath: string): Promise<void> {
  await registerLocalIntegration(process.cwd(), integrationPath);
  const local = await loadLocalIntegrations(process.cwd());
  printRuntimeDiagnostics(local.diagnostics);

  console.log(`Registered local integration: ${integrationPath}`);
  console.log(`Registry: ${localIntegrationRegistryPath}`);
}

async function printLocalIntegrationList(): Promise<void> {
  const registryFile = await readLocalIntegrationRegistry(process.cwd());

  console.log("Local integrations:");
  if (registryFile.integrations.length === 0) {
    console.log("- none");
    return;
  }

  const loaded = await loadLocalIntegrations(process.cwd());
  printRuntimeDiagnostics(loaded.diagnostics);

  for (const entry of registryFile.integrations) {
    const integration = loaded.integrations.find(
      (candidate) => candidate.manifest.source?.path?.endsWith(entry.path)
    );
    const label = integration
      ? `${integration.manifest.id}: ${integration.manifest.name} (${formatTrustLabel(integration.manifest.trust)})`
      : entry.path;
    console.log(`- ${label}`);
  }
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
  await writeFile(
    path.join(root, localIntegrationManifestFile),
    createManifestTemplate(integrationId),
    "utf8"
  );
  await writeFile(
    path.join(root, localIntegrationPlanFile),
    createPlanTemplate(integrationId),
    "utf8"
  );
  await writeFile(
    path.join(root, localIntegrationVerifyFile),
    createVerifyTemplate(integrationId),
    "utf8"
  );
  await writeFile(path.join(root, "fixtures/.gitkeep"), "", "utf8");
  await writeFile(
    path.join(root, "tests/README.md"),
    createTestTemplate(integrationId),
    "utf8"
  );
  await writeFile(path.join(root, "README.md"), createIntegrationReadme(integrationId), "utf8");

  console.log(`Created integration scaffold at ${integrationId}`);
}

async function runStack(
  action: string | undefined,
  stackId: string | undefined,
  options: CliOptions
): Promise<void> {
  switch (action) {
    case "create":
      if (!stackId) {
        console.error("Usage: avis stack create <stack-id|path>");
        process.exitCode = 1;
        return;
      }
      await runStackCreate(stackId);
      return;

    case "list":
      await printStackList();
      return;

    case "show":
      if (!stackId) {
        console.error("Usage: avis stack show <stack|path>");
        process.exitCode = 1;
        return;
      }
      await printStackShow(stackId);
      return;

    case "use":
      if (!stackId) {
        console.error("Usage: avis stack use <stack|path>");
        process.exitCode = 1;
        return;
      }
      await runStackUse(stackId, options);
      return;

    default:
      console.error("Usage: avis stack <create|list|show|use>");
      process.exitCode = 1;
  }
}

async function runStackCreate(stackIdOrPath: string): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const integrations = runtime.registry
    .findAvailableCapabilities(context)
    .flatMap((capability) => {
      const recommended = runtime.registry.recommendIntegrationsForCapability(
        capability.id,
        context
      )[0]?.integration;
      return recommended ? [recommended.manifest.id] : [];
    });

  if (integrations.length === 0) {
    console.error("No compatible integrations are available to export as a stack.");
    process.exitCode = 1;
    return;
  }

  const stack: StackManifest = {
    id: stackIdFromPath(stackIdOrPath),
    name: toTitleCase(stackIdFromPath(stackIdOrPath)),
    description: `Reusable stack generated for ${context.framework?.id ?? context.ecosystem}.`,
    integrations
  };
  const validation = validateStackManifest(stack);
  if (!validation.valid) {
    console.error("Avis cannot create this stack:");
    for (const error of validation.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const outputPath = stackOutputPath(stackIdOrPath);
  const absolutePath = resolveInsideRoot(process.cwd(), outputPath);
  if (await pathExists(absolutePath)) {
    console.error(`Refusing to overwrite existing stack file: ${outputPath}`);
    process.exitCode = 1;
    return;
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(stack, null, 2)}\n`, "utf8");
  console.log(`Created stack file: ${outputPath}`);
}

async function printStackList(): Promise<void> {
  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  console.log("Stacks:");
  for (const stack of runtime.registry.stacks) {
    console.log(`- ${stack.id}: ${stack.name}`);
  }
}

async function printStackShow(stackId: string): Promise<void> {
  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const stack = await findStackManifest(stackId, runtime.registry);
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

async function findStackManifest(
  stackIdOrPath: string,
  integrationRegistry: IntegrationRegistry
): Promise<StackManifest | undefined> {
  const builtInStack = integrationRegistry.findStackById(stackIdOrPath);
  if (builtInStack) {
    return builtInStack;
  }

  const absolutePath = resolveInsideRoot(process.cwd(), stackIdOrPath);
  if (!(await pathExists(absolutePath))) {
    return undefined;
  }

  return readStackManifestFile(stackIdOrPath);
}

async function readStackManifestFile(stackPath: string): Promise<StackManifest> {
  const absolutePath = resolveInsideRoot(process.cwd(), stackPath);
  const parsed = JSON.parse(await readFile(absolutePath, "utf8")) as unknown;

  if (!isStackManifest(parsed)) {
    throw new Error("Stack file must contain id, name, and integrations or capabilities.");
  }

  const validation = validateStackManifest(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid stack file: ${validation.errors.join(" ")}`);
  }

  return parsed;
}

function isStackManifest(value: unknown): value is StackManifest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    (record.description === undefined || typeof record.description === "string") &&
    (record.capabilities === undefined || isStringArray(record.capabilities)) &&
    (record.integrations === undefined || isStringArray(record.integrations))
  );
}

function stackOutputPath(stackIdOrPath: string): string {
  return stackIdOrPath.endsWith(".json") || stackIdOrPath.includes(path.sep)
    ? stackIdOrPath
    : `${stackIdOrPath}.stack.json`;
}

function stackIdFromPath(stackIdOrPath: string): string {
  return path
    .basename(stackOutputPath(stackIdOrPath))
    .replace(/\.stack\.json$/, "")
    .replace(/\.json$/, "");
}

async function runStackUse(stackId: string, options: CliOptions): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const stack = await findStackManifest(stackId, runtime.registry);
  if (!stack) {
    console.error(`Unknown stack: ${stackId}`);
    process.exitCode = 1;
    return;
  }

  const stackRegistry = runtime.registry.findStackById(stack.id)
    ? runtime.registry
    : createIntegrationRegistry({
        capabilities: runtime.registry.capabilities,
        integrations: runtime.registry.integrations,
        stacks: [...runtime.registry.stacks, stack]
      });
  const resolved = stackRegistry.resolveStack(stack.id, context);
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

  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const integration = await resolveIntegration(subject, context, runtime.registry, options);

  if (!integration) {
    return;
  }

  await planConfirmApplyAndVerify(integration, context, runtime.registry, options);
}

async function runRepair(subject: string, options: CliOptions): Promise<void> {
  const context = await detectSingleProjectContext();
  if (!context) {
    return;
  }

  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const integration = await resolveIntegration(subject, context, runtime.registry, options);
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

  await planConfirmApplyAndVerify(integration, context, runtime.registry, options);
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
  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);
  for (const capability of runtime.registry.findAvailableCapabilities(context)) {
    const compatible = runtime.registry.findCompatibleIntegrationsForCapability(
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
    printKnownCommands(integrationRegistry);
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
  integrationRegistry: IntegrationRegistry,
  options: CliOptions
): Promise<void> {
  const compatibility = integration.isCompatible(context);

  if (!compatibility.supported) {
    console.error(compatibility.reason);
    process.exitCode = 1;
    return;
  }

  const conflicts = await integrationRegistry.findInstalledCapabilityConflicts(integration, context);
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

  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const entries = await collectDoctorEntries(context, runtime.registry);
  const state = await readAvisProjectState(context.targetRoot);

  if (options.json) {
    console.log(JSON.stringify(formatDoctorJson(context, entries, state), null, 2));
  } else {
    printDoctorReport(context, entries, Object.keys(state.integrations), runtime.registry);
  }

  if (
    options.strict &&
    entries.some((entry) => !["healthy", "not-installed"].includes(entry.verification.health))
  ) {
    process.exitCode = 1;
  }
}

async function collectDoctorEntries(
  context: ProjectContext,
  integrationRegistry: IntegrationRegistry
): Promise<DoctorEntry[]> {
  const compatibleIntegrations = integrationRegistry.integrations.filter(
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
  rememberedIntegrationIds: string[],
  integrationRegistry: IntegrationRegistry
): void {
  console.log("Avis Project Health");
  console.log("");
  console.log(formatDetectedProject(context));

  if (entries.length === 0) {
    console.log("");
    console.log("No compatible verifiers are available for this project yet.");
    printSupportedTargets(integrationRegistry);
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
      status: entry.integration.manifest.status,
      trust: entry.integration.manifest.trust,
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
  avis search <query>
  avis show <integration|capability>
  avis stack create <stack-id|path>
  avis stack list
  avis stack show <stack|path>
  avis stack use <stack|path>
  avis integration create <integration-id>
  avis integration add <local-path>
  avis integration list
  avis doctor [--json] [--strict]
`);
}

async function printSearch(query: string): Promise<void> {
  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);
  const results = runtime.registry.search(query);

  console.log(`Search results for "${query}":`);
  if (results.length === 0) {
    console.log("- none");
    return;
  }

  for (const result of results) {
    const detail = result.description ? ` - ${result.description}` : "";
    console.log(`- ${result.kind}: ${result.id} (${result.name})${detail}`);
  }
}

async function printList(): Promise<void> {
  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  console.log("Capabilities:");
  for (const capability of runtime.registry.capabilities) {
    console.log(`- ${capability.id}: ${capability.name}`);
  }

  console.log("");
  console.log("Integrations:");
  for (const integration of runtime.registry.integrations) {
    console.log(
      `- ${integration.manifest.id}: ${integration.manifest.name} (${integration.manifest.capability}, ${formatStatusLabel(integration.manifest.status)}, ${formatTrustLabel(integration.manifest.trust)})`
    );
  }
}

async function printShow(subject: string): Promise<void> {
  const runtime = await createRuntimeRegistry();
  printRuntimeDiagnostics(runtime.diagnostics);

  const integration = runtime.registry.findIntegrationById(subject);
  if (integration) {
    printIntegrationDetails(integration);
    return;
  }

  const capability = runtime.registry.findCapabilityByQuery(subject);
  if (capability) {
    const integrations = runtime.registry.integrations.filter(
      (candidate) => candidate.manifest.capability === capability.id
    );

    console.log(capability.name);
    if (capability.description) {
      console.log(capability.description);
    }

    console.log("");
    console.log("Capability");
    console.log(`- ID: ${capability.id}`);
    console.log(`- Aliases: ${formatList(capability.aliases)}`);
    console.log(`- Exclusive: ${capability.exclusive ? "yes" : "no"}`);
    console.log(
      `- Defaults: ${formatCapabilityDefaults(capability.defaultIntegrations)}`
    );

    console.log("");
    console.log("Integrations:");
    if (integrations.length === 0) {
      console.log("- none");
      return;
    }

    for (const candidate of integrations) {
      console.log(
        `- ${candidate.manifest.id}: ${candidate.manifest.name} (${formatStatusLabel(candidate.manifest.status)}, ${formatTrustLabel(candidate.manifest.trust)})`
      );
    }
    return;
  }

  console.error(`Unknown integration or capability: ${subject}`);
  printKnownCommands(runtime.registry);
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
  console.log(`- Trust: ${formatTrustLabel(manifest.trust)}`);
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

function printKnownCommands(integrationRegistry: IntegrationRegistry): void {
  console.log("");
  console.log("Known capabilities:");
  for (const capability of integrationRegistry.capabilities) {
    console.log(`- ${capability.id}`);
  }

  console.log("");
  console.log("Known integrations:");
  for (const integration of integrationRegistry.integrations) {
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
    console.log(`   Status: ${formatStatusLabel(recommendation.integration.manifest.status)}`);
    console.log(`   Trust: ${formatTrustLabel(recommendation.integration.manifest.trust)}`);
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

function formatCapabilityDefaults(
  defaults: Partial<Record<string, string>> | undefined
): string {
  const entries = Object.entries(defaults ?? {}).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );

  if (entries.length === 0) {
    return "none";
  }

  return entries
    .map(([ecosystem, integration]) => `${ecosystem}: ${integration}`)
    .join(", ");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
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

function formatTrustLabel(trust: AvisIntegration["manifest"]["trust"]): string {
  switch (trust) {
    case "official":
      return "Official";
    case "verified":
      return "Verified";
    case "community":
      return "Community";
    case "local":
      return "Local";
    case "experimental":
      return "Experimental";
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
  return `${JSON.stringify(
    {
      id: integrationId,
      name: toTitleCase(integrationId),
      description: "Describe the project capability this integration provides.",
      capability: "replace-with-capability-id",
      version: "0.1.0",
      status: "experimental",
      trust: "local",
      supports: {
        ecosystems: ["node"],
        frameworks: ["nextjs"],
        packageManagers: ["npm", "pnpm", "yarn", "bun"]
      },
      dependencies: [],
      configurationOptions: [],
      configures: [],
      repair: "unsupported",
      documentation: {
        quickstart: "README.md"
      },
      source: {
        owner: "local"
      }
    },
    null,
    2
  )}\n`;
}

function createPlanTemplate(integrationId: string): string {
  return `${JSON.stringify(
    {
      title: `Add ${toTitleCase(integrationId)}`,
      operations: []
    },
    null,
    2
  )}\n`;
}

function createVerifyTemplate(integrationId: string): string {
  return `${JSON.stringify(
    {
      health: "unknown",
      checks: [
        {
          id: `${integrationId}-manual-check`,
          label: "integration verification",
          status: "skipped",
          message: "Add project inspection checks before relying on this integration."
        }
      ]
    },
    null,
    2
  )}\n`;
}

function createTestTemplate(integrationId: string): string {
  return `# ${toTitleCase(integrationId)} Tests

Add fixture projects and regression notes here. Before sharing this integration, verify:

- manifest capability is specific
- support metadata matches real projects
- ChangePlan operations are idempotent
- every file path stays inside the target project
- verification reflects installed, partial, and missing states
`;
}

function createIntegrationReadme(integrationId: string): string {
  return `# ${toTitleCase(integrationId)}

Describe the capability this integration provides, the projects it supports, the files it may create or modify, and how verification works.

Before this integration is ready, add:

- manifest metadata in \`${localIntegrationManifestFile}\`
- safe ChangePlan operations in \`${localIntegrationPlanFile}\`
- verifier checks in \`${localIntegrationVerifyFile}\`
- fixtures
- tests

Register locally from a project root with:

\`\`\`sh
avis integration add ./${integrationId}
\`\`\`
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
