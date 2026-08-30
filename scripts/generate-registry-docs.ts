import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { builtInCapabilities, builtInIntegrations } from "../packages/core/src/index.js";

const root = process.cwd();
const outputPath = path.join(
  root,
  "apps/docs/src/content/docs/generated/registry.md"
);

const content = `---
title: Generated Registry
description: Capability and integration metadata generated from Avis manifests.
---

This page is generated from Avis capability and integration manifests.

## Capabilities

| Capability | Description | Aliases | Defaults | Exclusive |
| --- | --- | --- | --- | --- |
${builtInCapabilities.map((capability) => `| \`${capability.id}\` | ${escapeMarkdownTable(capability.description ?? "")} | ${formatList(capability.aliases)} | ${formatDefaults(capability.defaultIntegrations)} | ${capability.exclusive ? "yes" : "no"} |`).join("\n")}

## Integrations

| Integration | Capability | Status | Trust | Ecosystems | Frameworks | Package Managers |
| --- | --- | --- | --- | --- | --- | --- |
${builtInIntegrations.map((integration) => `| \`${integration.manifest.id}\` | \`${integration.manifest.capability}\` | ${integration.manifest.status} | ${integration.manifest.trust} | ${formatList(integration.manifest.supports.ecosystems)} | ${formatList(integration.manifest.supports.frameworks)} | ${formatList(integration.manifest.supports.packageManagers)} |`).join("\n")}
`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, content, "utf8");
console.log(`Generated ${path.relative(root, outputPath)}.`);

function formatList(values: readonly string[] | undefined): string {
  return values && values.length > 0
    ? values.map((value) => `\`${value}\``).join(", ")
    : "any";
}

function formatDefaults(defaults: Record<string, string> | undefined): string {
  if (!defaults || Object.keys(defaults).length === 0) {
    return "none";
  }

  return Object.entries(defaults)
    .map(([ecosystem, integration]) => `\`${ecosystem}\`: \`${integration}\``)
    .join(", ");
}

function escapeMarkdownTable(value: string): string {
  return value.replaceAll("|", "\\|");
}
