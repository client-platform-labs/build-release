# Architecture

`build-release` standardizes how client apps are bootstrapped, built, verified, and shipped. It orchestrates tools; it does not become a bundler.

## Family constraints already decided

- Runtime: Node.js 24.x LTS + TypeScript.
- CLI framework: `commander`.
- Packaging: ESM-first npm packages with a `bin` entry.
- Command loading: static core commands; heavy/optional paths via `import()`.
- Config: human-authored JSONC, validated with JSON Schema 2020-12 via Ajv.
- Documents carry `schemaVersion` and migrate before validation.

Exact family config filenames are not locked yet.

## Product shape

```text
CLI  ->  task graph  ->  bundler/package-manager adapters  ->  artifacts  ->  release adapters
```

- **CLI**: the user-facing lifecycle.
- **Task graph**: named, cacheable, dependency-aware steps.
- **Bundler adapters**: Vite, webpack, Rspack, Metro, and others behind one interface.
- **Release adapters**: where artifacts go after they pass verify.
- **Presets**: app-type defaults (SPA, MPA, library, hybrid shell).

## Proposed package split

- `build-release` CLI package
- `@.../build-core`
- `@.../adapter-vite` / `@.../adapter-rspack` / ...
- `@.../preset-*`
- `examples/*`

## Inputs and outputs

| Flow | Input | Output |
| --- | --- | --- |
| `init` | app or empty repo | config, scripts, baseline pipeline |
| `build` | source + config | addressable artifacts |
| `verify` | artifacts + policies | signed-off report or failures |
| `release` | verified artifacts + target | published/deployed result |

## What this repo should own

- Build/release lifecycle and artifact contracts.
- Bundler and deploy adapters.
- Verify policies that are about shipping, not product analytics.
- Presets and examples.

## What should probably live in a family kernel

- CLI bootstrap and diagnostics.
- Config/manifest load, migrate, validate.
- Plugin registry and lazy loading.
- Workspace/project discovery.

That split is pending `shared kernel boundaries`.
