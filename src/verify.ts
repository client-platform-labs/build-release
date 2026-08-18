import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadJsoncFile, loadProject } from "./config.js";
import { pathExists } from "./fs-utils.js";
import {
  ARTIFACT_MANIFEST_NAME,
  type ArtifactFile,
  type ArtifactManifest,
} from "./types.js";

export type VerifyResult = {
  ok: boolean;
  checks: string[];
  errors: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseArtifactManifest(value: unknown): ArtifactManifest | string {
  if (!isRecord(value)) {
    return "artifact-manifest.json must be an object";
  }
  if (typeof value.schemaVersion !== "string" || value.schemaVersion.length === 0) {
    return "artifact-manifest.json.schemaVersion must be a string";
  }
  if (!isRecord(value.entries)) {
    return "artifact-manifest.json.entries must be an object";
  }
  const entries: Record<string, string> = {};
  for (const [name, target] of Object.entries(value.entries)) {
    if (typeof target !== "string" || target.length === 0) {
      return `artifact-manifest.json.entries.${name} must be a path string`;
    }
    entries[name] = target;
  }
  if (!Array.isArray(value.files)) {
    return "artifact-manifest.json.files must be an array";
  }
  const files: ArtifactFile[] = [];
  for (const [index, item] of value.files.entries()) {
    if (typeof item === "string") {
      files.push({ path: item });
      continue;
    }
    if (!isRecord(item) || typeof item.path !== "string" || item.path.length === 0) {
      return `artifact-manifest.json.files[${index}] must have a path`;
    }
    if (item.hash !== undefined && typeof item.hash !== "string") {
      return `artifact-manifest.json.files[${index}].hash must be a string`;
    }
    files.push({
      path: item.path,
      hash: typeof item.hash === "string" ? item.hash : undefined,
    });
  }
  let sourcemaps: Record<string, string> | undefined;
  if (value.sourcemaps !== undefined) {
    if (!isRecord(value.sourcemaps)) {
      return "artifact-manifest.json.sourcemaps must be an object";
    }
    sourcemaps = {};
    for (const [source, mapPath] of Object.entries(value.sourcemaps)) {
      if (typeof mapPath !== "string" || mapPath.length === 0) {
        return `artifact-manifest.json.sourcemaps.${source} must be a path string`;
      }
      sourcemaps[source] = mapPath;
    }
  }
  return {
    schemaVersion: value.schemaVersion,
    entries,
    files,
    sourcemaps,
  };
}

function listedPaths(files: ArtifactFile[]): Set<string> {
  return new Set(files.map((file) => file.path));
}

export async function runVerify(cwd: string): Promise<VerifyResult> {
  const checks: string[] = [];
  const errors: string[] = [];
  const loaded = await loadProject(cwd);
  const outDir = path.resolve(cwd, loaded.settings.outDir);
  const manifestPath = path.join(outDir, ARTIFACT_MANIFEST_NAME);

  if (!(await pathExists(manifestPath))) {
    return {
      ok: false,
      checks,
      errors: [`missing ${ARTIFACT_MANIFEST_NAME} at ${manifestPath}`],
    };
  }
  checks.push(`found ${ARTIFACT_MANIFEST_NAME}`);

  const parsed = parseArtifactManifest(await loadJsoncFile(manifestPath));
  if (typeof parsed === "string") {
    return { ok: false, checks, errors: [parsed] };
  }
  checks.push("manifest schema ok");

  const listed = listedPaths(parsed.files);
  for (const file of parsed.files) {
    const abs = path.join(outDir, file.path);
    if (!(await pathExists(abs))) {
      errors.push(`missing file: ${file.path}`);
      continue;
    }
    const info = await stat(abs);
    if (!info.isFile()) {
      errors.push(`not a file: ${file.path}`);
      continue;
    }
    if (info.size <= 0) {
      errors.push(`empty file: ${file.path}`);
      continue;
    }
    if (file.hash) {
      const bytes = await readFile(abs);
      const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
      if (file.hash !== actual) {
        errors.push(`hash mismatch: ${file.path}`);
        continue;
      }
    }
  }
  if (errors.length === 0) {
    checks.push(`${parsed.files.length} files exist and are non-empty`);
  }

  for (const [name, target] of Object.entries(parsed.entries)) {
    if (!listed.has(target)) {
      errors.push(`entry ${name} does not resolve to a listed file: ${target}`);
      continue;
    }
    const abs = path.join(outDir, target);
    if (!(await pathExists(abs))) {
      errors.push(`entry ${name} path missing: ${target}`);
    }
  }
  if (Object.keys(parsed.entries).length > 0 && errors.length === 0) {
    checks.push("entries resolve");
  }

  if (parsed.sourcemaps) {
    for (const [source, mapPath] of Object.entries(parsed.sourcemaps)) {
      const abs = path.join(outDir, mapPath);
      if (!(await pathExists(abs))) {
        errors.push(`declared sourcemap missing for ${source}: ${mapPath}`);
      }
    }
    if (errors.length === 0) {
      checks.push("declared sourcemaps exist");
    }
  }

  return { ok: errors.length === 0, checks, errors };
}
