import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectProject } from "./project.js";
import { detectPythonProject } from "./python.js";
import { frameworks, packageManagers } from "../types/ids.js";

describe("detectPythonProject", () => {
  it("detects a uv Django project", async () => {
    const root = await createDjangoProject({
      "pyproject.toml": `[project]
dependencies = ["django>=5.0"]
`,
      "uv.lock": ""
    });

    const result = await detectPythonProject(root);

    expect(result.targets).toHaveLength(1);
    expect(result.targets[0]?.ecosystem.id).toBe("python");
    expect(result.targets[0]?.languages).toEqual(["python"]);
    expect(result.targets[0]?.frameworks[0]?.id).toBe(frameworks.django);
    expect(result.targets[0]?.packageManagers[0]?.id).toBe(packageManagers.uv);
  });

  it("is used by generic project detection when no Node project exists", async () => {
    const root = await createDjangoProject({
      "requirements.txt": "Django>=5.0\n"
    });

    const result = await detectProject(root);

    expect(result.targets[0]?.ecosystem.id).toBe("python");
    expect(result.targets[0]?.frameworks[0]?.id).toBe(frameworks.django);
  });
});

async function createDjangoProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-django-"));
  await mkdir(path.join(root, "config"), { recursive: true });
  await writeFile(path.join(root, "manage.py"), "");

  await Promise.all(
    Object.entries(files).map(([filename, contents]) =>
      writeFile(path.join(root, filename), contents)
    )
  );

  return root;
}
