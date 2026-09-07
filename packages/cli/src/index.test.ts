import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
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
});

async function captureStdout(action: () => Promise<void>): Promise<string> {
  let output = "";
  const spy = vi.spyOn(console, "log").mockImplementation((message = "") => {
    output += `${String(message)}\n`;
  });

  await action();
  spy.mockRestore();
  return output;
}

async function captureStderr(action: () => Promise<void>): Promise<string> {
  let output = "";
  const spy = vi.spyOn(console, "error").mockImplementation((message = "") => {
    output += `${String(message)}\n`;
  });

  await action();
  spy.mockRestore();
  return output;
}
