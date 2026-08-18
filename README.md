# build-release

Client platform build and release engineering toolkit for frontend projects.

## Vision

`build-release` standardizes how frontend applications are built, packaged, and verified. It orchestrates tools (Vite first); it does not become a bundler.

## Scope

v1 covers local bootstrap, build, and artifact verification:

- `init` — apply the `web-vite` preset
- `build` — run the Vite adapter, then write `artifact-manifest.json`
- `verify` — check the artifact contract
- `doctor` — light environment/config diagnostics

Remote release, signing/SLSA, and adapter `dev`/`watch` are out of scope.

## Local development

Requires Node.js 24.x LTS. This package depends on a local `../kernel` checkout via `file:` during scaffolding.

```bash
# from sibling kernel repo first:
#   cd ../kernel && npm install && npm run build
npm install
npm run build
node ./bin/build-release.js --help
```

CLI surface: `init`, `build`, `verify`, `doctor`. Default preset: `web-vite`.

## init → build → verify

Run the CLI against an app directory (empty is fine). `init` writes family config plus a minimal Vite SPA.

```bash
# from this repo, after npm install && npm run build
DEMO=$(mktemp -d)
cd "$DEMO"

node /path/to/build-release/bin/build-release.js init
node /path/to/build-release/bin/build-release.js build
node /path/to/build-release/bin/build-release.js verify
```

`init` writes:

- `client-platform.config.jsonc` with `products.buildRelease` (`adapter=vite`, `outDir=dist`)
- `client-platform.manifest.jsonc` with `targets`, `tooling`, `entry`, `outDir`
- `package.json` (`"type": "module"`), `index.html`, `src/main.js`, `vite.config.js` (skipped if those files already exist)

`build` runs Vite, then writes `<outDir>/artifact-manifest.json` (`schemaVersion`, `entries`, `files`, optional hashes, optional sourcemaps).

`verify` exits non-zero unless:

- the manifest exists and validates
- every listed file exists and is non-empty
- every entry resolves to a listed file
- declared sourcemaps exist

## Documents

- [Roadmap](./ROADMAP.md)
- [Architecture](./docs/architecture.md)

## Working Principles

- one command surface, many adapters
- predictable outputs and reproducible builds
- automation by default, manual escape hatches where needed
- clear boundaries between core workflow and target-specific integrations
