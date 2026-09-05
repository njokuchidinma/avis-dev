import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function findDjangoSettingsPath(root: string): Promise<string | undefined> {
  const managePy = await readOptionalFile(path.join(root, "manage.py"));
  const moduleMatch = managePy?.match(/DJANGO_SETTINGS_MODULE["'],\s*["']([^"']+)/);
  const settingsModule = moduleMatch?.[1];

  if (settingsModule) {
    const candidate = `${settingsModule.replaceAll(".", "/")}.py`;
    if (await pathExists(path.join(root, candidate))) {
      return candidate;
    }
  }

  return findSettingsFile(root);
}

export async function djangoSettingsIncludesValue(
  root: string,
  relativeSettingsPath: string,
  value: string
): Promise<boolean> {
  const contents = await readFile(path.join(root, relativeSettingsPath), "utf8");
  return contents.includes(`"${value}"`) || contents.includes(`'${value}'`);
}

async function findSettingsFile(root: string): Promise<string | undefined> {
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const candidate = path.join(root, entry.name, "settings.py");
    if (await pathExists(candidate)) {
      return `${entry.name}/settings.py`;
    }
  }

  return undefined;
}

async function readOptionalFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
