import path from "node:path";
import { writeProjectManifest, writeWorkspaceConfig } from "./config.js";
import { writeFileIfMissing } from "./fs-utils.js";
import {
  DEFAULT_ADAPTER,
  DEFAULT_OUT_DIR,
  DEFAULT_PRESET,
} from "./types.js";

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web-vite</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;

const MAIN_JS = `const app = document.getElementById("app");
if (app) {
  app.textContent = "Hello from web-vite";
}
`;

const VITE_CONFIG = `/** @type {import("vite").UserConfig} */
export default {
  build: {
    outDir: "dist",
    sourcemap: true,
  },
};
`;

const PACKAGE_JSON = `{
  "private": true,
  "type": "module"
}
`;

export async function initWebVite(cwd: string, preset: string): Promise<string[]> {
  if (preset !== DEFAULT_PRESET) {
    throw new Error(`unsupported preset: ${preset} (supported: ${DEFAULT_PRESET})`);
  }

  const written: string[] = [];
  const configPath = await writeWorkspaceConfig(cwd, {
    adapter: DEFAULT_ADAPTER,
    outDir: DEFAULT_OUT_DIR,
  });
  written.push(path.relative(cwd, configPath) || path.basename(configPath));

  const manifestPath = await writeProjectManifest(cwd, {
    targets: ["web"],
    tooling: ["vite"],
    entry: "index.html",
    outDir: DEFAULT_OUT_DIR,
  });
  written.push(path.relative(cwd, manifestPath) || path.basename(manifestPath));

  const scaffold: Record<string, string> = {
    "package.json": PACKAGE_JSON,
    "index.html": INDEX_HTML,
    "src/main.js": MAIN_JS,
    "vite.config.js": VITE_CONFIG,
  };
  for (const [rel, contents] of Object.entries(scaffold)) {
    const abs = path.join(cwd, rel);
    if (await writeFileIfMissing(abs, contents)) {
      written.push(rel);
    }
  }
  return written;
}
