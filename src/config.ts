import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseJsonc, stringifyJsonc } from "./jsonc.js";
import {
  CONFIG_FILE_NAME,
  DEFAULT_ADAPTER,
  DEFAULT_OUT_DIR,
  MANIFEST_FILE_NAME,
  SCHEMA_VERSION,
  type BuildReleaseConfig,
  type ProjectManifestFile,
  type WorkspaceConfigFile,
} from "./types.js";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadJsoncFile(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, "utf8");
  try {
    return parseJsonc(text);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSONC: ${filePath} (${reason})`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseWorkspaceConfig(value: unknown): WorkspaceConfigFile {
  if (!isRecord(value) || typeof value.schemaVersion !== "string") {
    throw new Error(`${CONFIG_FILE_NAME} must include string schemaVersion`);
  }
  return value as WorkspaceConfigFile;
}

export function parseProjectManifest(value: unknown): ProjectManifestFile {
  if (!isRecord(value) || typeof value.schemaVersion !== "string") {
    throw new Error(`${MANIFEST_FILE_NAME} must include string schemaVersion`);
  }
  return value as ProjectManifestFile;
}

export function resolveBuildReleaseConfig(
  workspace: WorkspaceConfigFile,
  project: ProjectManifestFile,
): BuildReleaseConfig {
  const product = workspace.products?.buildRelease ?? {};
  const adapter =
    typeof product.adapter === "string" && product.adapter.length > 0
      ? product.adapter
      : DEFAULT_ADAPTER;
  const outDir =
    (typeof product.outDir === "string" && product.outDir) ||
    (typeof project.outDir === "string" && project.outDir) ||
    DEFAULT_OUT_DIR;
  return { adapter, outDir };
}

export type LoadedProject = {
  cwd: string;
  configPath: string;
  manifestPath: string;
  workspace: WorkspaceConfigFile;
  project: ProjectManifestFile;
  settings: BuildReleaseConfig;
};

export async function loadProject(cwd: string): Promise<LoadedProject> {
  const configPath = path.join(cwd, CONFIG_FILE_NAME);
  const manifestPath = path.join(cwd, MANIFEST_FILE_NAME);
  if (!(await exists(configPath))) {
    throw new Error(`missing ${CONFIG_FILE_NAME}; run \`build-release init\``);
  }
  if (!(await exists(manifestPath))) {
    throw new Error(`missing ${MANIFEST_FILE_NAME}; run \`build-release init\``);
  }
  const workspace = parseWorkspaceConfig(await loadJsoncFile(configPath));
  const project = parseProjectManifest(await loadJsoncFile(manifestPath));
  return {
    cwd,
    configPath,
    manifestPath,
    workspace,
    project,
    settings: resolveBuildReleaseConfig(workspace, project),
  };
}

export async function writeJsoncFile(
  filePath: string,
  value: unknown,
  header: string,
): Promise<void> {
  await writeFile(filePath, stringifyJsonc(value, header), "utf8");
}

export async function writeWorkspaceConfig(
  cwd: string,
  patch: BuildReleaseConfig,
): Promise<string> {
  const configPath = path.join(cwd, CONFIG_FILE_NAME);
  const existing = (await exists(configPath))
    ? parseWorkspaceConfig(await loadJsoncFile(configPath))
    : { schemaVersion: SCHEMA_VERSION };
  const next: WorkspaceConfigFile = {
    ...existing,
    schemaVersion: existing.schemaVersion || SCHEMA_VERSION,
    products: {
      ...existing.products,
      buildRelease: {
        ...(isRecord(existing.products?.buildRelease)
          ? existing.products.buildRelease
          : {}),
        adapter: patch.adapter,
        outDir: patch.outDir,
      },
    },
  };
  await writeJsoncFile(
    configPath,
    next,
    "// Client Platform workspace config",
  );
  return configPath;
}

export async function writeProjectManifest(
  cwd: string,
  patch: Pick<ProjectManifestFile, "targets" | "tooling" | "entry" | "outDir">,
): Promise<string> {
  const manifestPath = path.join(cwd, MANIFEST_FILE_NAME);
  const existing = (await exists(manifestPath))
    ? parseProjectManifest(await loadJsoncFile(manifestPath))
    : { schemaVersion: SCHEMA_VERSION };
  const next: ProjectManifestFile = {
    ...existing,
    schemaVersion: existing.schemaVersion || SCHEMA_VERSION,
    targets: patch.targets ?? existing.targets,
    tooling: patch.tooling ?? existing.tooling,
    entry: patch.entry ?? existing.entry,
    outDir: patch.outDir ?? existing.outDir,
  };
  await writeJsoncFile(
    manifestPath,
    next,
    "// Client Platform project manifest",
  );
  return manifestPath;
}
