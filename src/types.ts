export type BuildReleaseConfig = {
  adapter: string;
  outDir: string;
};

export type WorkspaceConfigFile = {
  schemaVersion: string;
  products?: {
    buildRelease?: Partial<BuildReleaseConfig> & Record<string, unknown>;
    [product: string]: unknown;
  };
  plugins?: string[];
};

export type ProjectManifestFile = {
  schemaVersion: string;
  targets?: string[];
  tooling?: string[];
  entry?: string;
  outDir?: string;
};

export type ArtifactFile = {
  path: string;
  hash?: string;
};

export type ArtifactManifest = {
  schemaVersion: string;
  entries: Record<string, string>;
  files: ArtifactFile[];
  sourcemaps?: Record<string, string>;
};

export type AdapterContext = {
  cwd: string;
  outDir: string;
  entry?: string;
};

export type BundlerAdapter = {
  build(ctx: AdapterContext): Promise<void>;
  clean(ctx: AdapterContext): Promise<void>;
  resolveOutputs(ctx: AdapterContext): Promise<ArtifactManifest>;
};

export const ARTIFACT_MANIFEST_NAME = "artifact-manifest.json";
export const CONFIG_FILE_NAME = "client-platform.config.jsonc";
export const MANIFEST_FILE_NAME = "client-platform.manifest.jsonc";
export const SCHEMA_VERSION = "0";
export const DEFAULT_OUT_DIR = "dist";
export const DEFAULT_ADAPTER = "vite";
export const DEFAULT_PRESET = "web-vite";
