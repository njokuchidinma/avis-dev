import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const targetPath = path.join(root, "distribution/native-targets.json");
const outputPath = path.join(root, "dist/native-manifest.json");

const manifest = JSON.parse(await readFile(targetPath, "utf8"));

if (manifest.schemaVersion !== 1) {
  throw new Error("Unsupported native target manifest schema version.");
}

if (!Array.isArray(manifest.targets) || manifest.targets.length === 0) {
  throw new Error("Native target manifest must contain at least one target.");
}

for (const target of manifest.targets) {
  for (const field of ["id", "platform", "arch", "artifactName"]) {
    if (typeof target[field] !== "string" || target[field].trim() === "") {
      throw new Error(`Native target is missing required field: ${field}.`);
    }
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: manifest.schemaVersion,
      generatedAt: new Date().toISOString(),
      targets: manifest.targets
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Generated ${path.relative(root, outputPath)} for ${manifest.targets.length} native targets.`);
