import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createProjectContext, detectProject } from "../detection/index.js";
import { applyChangePlan } from "../planning/apply.js";
import { djangoRestFrameworkIntegration } from "./django-rest-framework.js";

describe("djangoRestFrameworkIntegration", () => {
  it("plans dependency and settings changes for a Django project", async () => {
    const root = await createDjangoProject({
      requirements: "Django>=5.0\n"
    });

    const context = createProjectContext(await detectProject(root));
    const plan = await djangoRestFrameworkIntegration.plan({ context });

    expect(plan.operations.map((operation) => operation.id)).toEqual([
      "add-django-rest-framework",
      "configure-drf-installed-app"
    ]);
  });

  it("does not duplicate dependency or settings operations", async () => {
    const root = await createDjangoProject({
      requirements: "Django>=5.0\ndjangorestframework>=3.15\n",
      settings: `INSTALLED_APPS = [
    "rest_framework",
    "django.contrib.admin",
]
`
    });

    const context = createProjectContext(await detectProject(root));
    const plan = await djangoRestFrameworkIntegration.plan({ context });

    expect(plan.operations).toEqual([]);
  });

  it("can patch settings and verify the local setup", async () => {
    const root = await createDjangoProject({
      requirements: "Django>=5.0\ndjangorestframework>=3.15\n"
    });

    const context = createProjectContext(await detectProject(root));
    const plan = await djangoRestFrameworkIntegration.plan({ context });

    await applyChangePlan(plan);

    const settings = await readFile(path.join(root, "config/settings.py"), "utf8");
    const secondPlan = await djangoRestFrameworkIntegration.plan({ context });
    const verification = await djangoRestFrameworkIntegration.verify?.(context);

    expect(settings).toContain('"rest_framework"');
    expect(secondPlan.operations).toEqual([]);
    expect(verification?.status).toBe("pass");
  });
});

async function createDjangoProject(options: {
  requirements: string;
  settings?: string;
}): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "avis-drf-"));
  await mkdir(path.join(root, "config"), { recursive: true });
  await writeFile(
    path.join(root, "manage.py"),
    `import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
`
  );
  await writeFile(path.join(root, "requirements.txt"), options.requirements);
  await writeFile(
    path.join(root, "config/settings.py"),
    options.settings ??
      `INSTALLED_APPS = [
    "django.contrib.admin",
]
`
  );

  return root;
}
