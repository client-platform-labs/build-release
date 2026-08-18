import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadProject } from "./config.js";
import { ARTIFACT_MANIFEST_NAME, type BundlerAdapter } from "./types.js";
import { viteAdapter } from "./vite-adapter.js";

function adapterFor(name: string): BundlerAdapter {
  if (name === "vite") {
    return viteAdapter;
  }
  throw new Error(`unsupported adapter: ${name} (supported: vite)`);
}

export async function runBuild(cwd: string): Promise<string> {
  const loaded = await loadProject(cwd);
  const adapter = adapterFor(loaded.settings.adapter);
  const ctx = {
    cwd,
    outDir: loaded.settings.outDir,
    entry: loaded.project.entry,
  };
  await adapter.clean(ctx);
  await adapter.build(ctx);
  const manifest = await adapter.resolveOutputs(ctx);
  const outDir = path.resolve(cwd, loaded.settings.outDir);
  await mkdir(outDir, { recursive: true });
  const manifestPath = path.join(outDir, ARTIFACT_MANIFEST_NAME);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifestPath;
}
