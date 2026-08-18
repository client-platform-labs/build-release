# Architecture

`build-release` standardizes how client apps are bootstrapped, built, verified, and shipped. It orchestrates tools; it does not become a bundler.

## Family constraints already decided

- Runtime: Node.js 24.x LTS + TypeScript.
- CLI framework: `commander`.
- Packaging: ESM-first npm packages under `@client-platform/*`, with Product `bin` entries plus family command `client-platform`.
- Plugin metadata: `package.json#clientPlatform`.
- Command loading: static core commands; heavy/optional paths via `import()`.
- Config: human-authored JSONC, validated with JSON Schema 2020-12 via Ajv.
- Documents carry `schemaVersion` and migrate before validation.

Family files:

- Workspace config: `client-platform.config.jsonc`
- Project manifest: `client-platform.manifest.jsonc`
- Build-release settings: `products.buildRelease` inside Workspace Config

## Product shape

```text
CLI  ->  task graph  ->  bundler adapters  ->  outDir + artifact-manifest.json  ->  verify
```

- **CLI**: `init`, `build`, `verify`, `doctor` (no remote `release` in deep MVP v1).
- **Artifact contract**: output directory + `artifact-manifest.json`.
- **Bundler adapters**: Vite first; webpack/Rspack later behind the same interface.
- **Presets**: default `web-vite`.

## Artifact manifest (v1)

Path: `<outDir>/artifact-manifest.json` (default `dist/artifact-manifest.json`).

Minimum fields:

- `schemaVersion`
- `entries`
- `files`
- optional `hash` per file
- optional `sourcemaps`

## Adapter interface (v1)

- `build(ctx)`
- `clean(ctx)`
- `resolveOutputs(ctx)` → manifest draft

Out of contract: `dev`, `watch`, `analyze`.

## `verify` v1

- manifest validates
- files exist and are non-empty
- entries resolve
- declared sourcemaps exist when listed

## Proposed package split

- `@client-platform/build-release` CLI package, bin `build-release`
- `@client-platform/build-core`
- `@client-platform/adapter-vite` / `@client-platform/adapter-rspack` / ...
- `@client-platform/preset-*`
- `examples/*`

This Product is also loadable by the Umbrella CLI `client-platform` through `package.json#clientPlatform`.

## Inputs and outputs

| Flow | Input | Output |
| --- | --- | --- |
| `init` | app or empty repo | `products.buildRelease`, manifest fields, Vite template |
| `build` | source + config | `outDir` + `artifact-manifest.json` |
| `verify` | artifacts + manifest | signed-off report or failures |
| `release` | deferred past deep MVP v1 | — |

## What this repo should own

- Build/verify lifecycle and artifact contracts.
- Bundler adapters.
- Presets and examples.

## What lives in the family kernel

Kernel is a separate repository, [`client-platform-labs/kernel`](https://github.com/client-platform-labs/kernel). It publishes `@client-platform/kernel` and `@client-platform/cli`. This product depends on the library; it does not reimplement it.

Kernel owns:

- CLI bootstrap and diagnostics.
- Config/manifest load, migrate, validate.
- Plugin registry and lazy loading.
- Workspace/project discovery.
