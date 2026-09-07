import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "avis-npm-artifact-smoke-"));
const installRoot = path.join(workspaceRoot, "consumer-project");
const npmCache = path.join(workspaceRoot, "npm-cache");

let tarballPath;

try {
  tarballPath = await packArtifact();
  await createConsumerProject();
  await installArtifact(tarballPath);
  runSmokeCommands();
  console.log("npm artifact smoke test passed.");
} finally {
  if (tarballPath) {
    await rm(tarballPath, { force: true });
  }
  await rm(workspaceRoot, { recursive: true, force: true });
}

async function packArtifact() {
  const result = run("npm", ["pack", "--json"], {
    cwd: repositoryRoot,
    env: smokeEnvironment()
  });
  const packed = parsePackOutput(result.stdout);
  const filename = packed[0]?.filename;
  if (!filename || typeof filename !== "string") {
    throw new Error("npm pack did not report a tarball filename.");
  }

  return path.resolve(repositoryRoot, filename);
}

async function createConsumerProject() {
  await mkdir(installRoot, { recursive: true });
  await writeFile(
    path.join(installRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "avis-artifact-smoke-consumer",
        private: true,
        packageManager: "npm@11.0.0",
        dependencies: {}
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function installArtifact(tarballPath) {
  run("npm", ["install", "--no-audit", "--no-fund", tarballPath], {
    cwd: installRoot,
    env: smokeEnvironment()
  });
}

function runSmokeCommands() {
  const avisBin = path.join(
    installRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "avis.cmd" : "avis"
  );
  const commands = [
    {
      label: "avis --version",
      args: ["--version"],
      expect: /avis \d+\.\d+\.\d+/
    },
    {
      label: "avis --help",
      args: ["--help"],
      expect: /Usage:/
    },
    {
      label: "avis list",
      args: ["list"],
      expect: /Capabilities:/
    },
    {
      label: "avis search authentication",
      args: ["search", "authentication"],
      expect: /Search results for "authentication":/
    },
    {
      label: "avis doctor",
      args: ["doctor"],
      expect: /Avis Project Health/
    },
    {
      label: "avis stack list",
      args: ["stack", "list"],
      expect: /Stacks:/
    },
    {
      label: "avis integration list",
      args: ["integration", "list"],
      expect: /Local integrations:/
    }
  ];

  for (const command of commands) {
    const result = run(avisBin, command.args, {
      cwd: installRoot,
      env: smokeEnvironment()
    });

    if (!command.expect.test(result.stdout)) {
      throw new Error(
        `${command.label} did not include expected output ${command.expect}.\n\nstdout:\n${result.stdout}\n\nstderr:\n${result.stderr}`
      );
    }
  }
}

function run(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}.\n\nstdout:\n${result.stdout}\n\nstderr:\n${result.stderr}`
    );
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function parsePackOutput(stdout) {
  const jsonText = extractTrailingJsonArray(stdout);

  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // npm should emit JSON with --json; fall through to a clear error.
  }

  throw new Error(`Could not parse npm pack output as JSON.\n\n${stdout}`);
}

function extractTrailingJsonArray(stdout) {
  const trimmed = stdout.trim();
  if (trimmed.startsWith("[")) {
    return trimmed;
  }

  const arrayStart = trimmed.lastIndexOf("\n[");
  if (arrayStart >= 0) {
    return trimmed.slice(arrayStart + 1);
  }

  return trimmed;
}

function smokeEnvironment() {
  return {
    ...process.env,
    npm_config_cache: npmCache
  };
}
