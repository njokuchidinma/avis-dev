import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyChangePlan,
  createProjectContext,
  detectProject,
  djangoRestFrameworkIntegration,
  recordAppliedIntegrationPlan
} from "@avis/core";
import { runCli } from "./index.js";

describe("Avis CLI E2E", () => {
  const originalCwd = process.cwd();
  const originalExitCode = process.exitCode;

  afterEach(() => {
    process.chdir(originalCwd);
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it("prints help without entering interactive add flow", async () => {
    const output = await captureStdout(() => runCli(["--help"]));

    expect(output).toContain("Usage:");
    expect(output).toContain("avis doctor [--json] [--strict]");
    expect(process.exitCode).toBe(originalExitCode);
  });

  it("shows capability defaults, native support, and setup maturity", async () => {
    const output = await captureStdout(() => runCli(["show", "api-documentation"]));

    expect(output).toContain("Framework defaults: django: drf-spectacular");
    expect(output).toContain(
      "Native framework support: fastapi: FastAPI exposes OpenAPI and Swagger UI natively."
    );
  });

  it("refuses repair for integrations without repair plan support", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-cli-e2e-"));
    await mkdir(root, { recursive: true });
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify(
        {
          name: "next-app",
          packageManager: "pnpm@11.24.0",
          dependencies: {
            next: "16.0.0",
            react: "20.0.0",
            "lucide-react": "^0.468.0"
          }
        },
        null,
        2
      )
    );
    await writeFile(path.join(root, "pnpm-lock.yaml"), "");
    process.chdir(root);

    const errorOutput = await captureStderr(() => runCli(["repair", "lucide-react"]));

    expect(errorOutput).toContain(
      "Lucide React does not declare repair plan support yet."
    );
    expect(process.exitCode).toBe(1);
  });

  it("refuses repair when an Avis-touched file was modified by the user", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "avis-cli-repair-safety-"));
    await mkdir(path.join(root, "config"), { recursive: true });
    await writeFile(
      path.join(root, "requirements.txt"),
      "Django>=5.0\ndjangorestframework>=3.15\n",
      "utf8"
    );
    await writeFile(
      path.join(root, "manage.py"),
      `import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
`,
      "utf8"
    );
    await writeFile(
      path.join(root, "config/settings.py"),
      createBareDjangoSettings(),
      "utf8"
    );
    process.chdir(root);

    const context = createProjectContext(await detectProject(root));
    const setupPlan = await djangoRestFrameworkIntegration.plan({ context });
    await applyChangePlan(setupPlan);
    await recordAppliedIntegrationPlan(setupPlan, djangoRestFrameworkIntegration);
    await writeFile(
      path.join(root, "config/settings.py"),
      `${createBareDjangoSettings()}\n# user changed this file after Avis setup\n`,
      "utf8"
    );

    await captureStderr(() =>
      runCli(["repair", "django-rest-framework", "--yes"])
    );

    expect(await readFile(path.join(root, "config/settings.py"), "utf8")).not.toContain(
      '"rest_framework"'
    );
    expect(process.exitCode).toBe(1);
  });
});

async function captureStdout(action: () => Promise<void>): Promise<string> {
  let output = "";
  const spy = vi.spyOn(console, "log").mockImplementation((...messages) => {
    output += `${messages.map(String).join(" ")}\n`;
  });

  await action();
  spy.mockRestore();
  return output;
}

async function captureStderr(action: () => Promise<void>): Promise<string> {
  let output = "";
  const spy = vi.spyOn(console, "error").mockImplementation((...messages) => {
    output += `${messages.map(String).join(" ")}\n`;
  });

  await action();
  spy.mockRestore();
  return output;
}

function createBareDjangoSettings(): string {
  return `INSTALLED_APPS = [
    "django.contrib.admin",
]
`;
}
