import { createHash } from "node:crypto";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";
import { toPosixPath } from "./fs-utils.js";
import {
  ARTIFACT_MANIFEST_NAME,
  SCHEMA_VERSION,
  type AdapterContext,
  type ArtifactFile,
  type ArtifactManifest,
  type BundlerAdapter,
} from "./types.js";

async function walkFiles(dir: string, root: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(abs, root)));
      continue;
    }
    if (entry.isFile()) {
      files.push(toPosixPath(path.relative(root, abs)));
    }
  }
  return files;
}

async function sha256File(absPath: string): Promise<string> {
  const bytes = await readFile(absPath);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function resolveEntries(
  relativeFiles: string[],
  entry: string | undefined,
): Record<string, string> {
  const entries: Record<string, string> = {};
  if (relativeFiles.includes("index.html")) {
    entries.index = "index.html";
  }
  if (entry) {
    const posixEntry = toPosixPath(entry);
    if (relativeFiles.includes(posixEntry) && posixEntry !== "index.html") {
      entries.app = posixEntry;
    }
  }
  if (Object.keys(entries).length === 0 && relativeFiles.length > 0) {
    entries.main = relativeFiles[0]!;
  }
  return entries;
}

function resolveSourcemaps(relativeFiles: string[]): Record<string, string> | undefined {
  const sourcemaps: Record<string, string> = {};
  for (const file of relativeFiles) {
    if (!file.endsWith(".map")) {
      continue;
    }
    const source = file.slice(0, -".map".length);
    if (relativeFiles.includes(source)) {
      sourcemaps[source] = file;
    }
  }
  return Object.keys(sourcemaps).length > 0 ? sourcemaps : undefined;
}

export const viteAdapter: BundlerAdapter = {
  async clean(ctx) {
    const outDir = path.resolve(ctx.cwd, ctx.outDir);
    await rm(outDir, { recursive: true, force: true });
  },

  async build(ctx) {
    await viteBuild({
      root: ctx.cwd,
      logLevel: "info",
      build: {
        outDir: ctx.outDir,
        emptyOutDir: true,
        sourcemap: true,
      },
    });
  },

  async resolveOutputs(ctx) {
    const outDir = path.resolve(ctx.cwd, ctx.outDir);
    const info = await stat(outDir);
    if (!info.isDirectory()) {
      throw new Error(`outDir is not a directory: ${outDir}`);
    }
    const relativeFiles = (await walkFiles(outDir, outDir))
      .filter((file) => file !== ARTIFACT_MANIFEST_NAME)
      .sort();
    const files: ArtifactFile[] = [];
    for (const rel of relativeFiles) {
      files.push({
        path: rel,
        hash: await sha256File(path.join(outDir, rel)),
      });
    }
    const manifest: ArtifactManifest = {
      schemaVersion: SCHEMA_VERSION,
      entries: resolveEntries(relativeFiles, ctx.entry),
      files,
    };
    const sourcemaps = resolveSourcemaps(relativeFiles);
    if (sourcemaps) {
      manifest.sourcemaps = sourcemaps;
    }
    return manifest;
  },
};
