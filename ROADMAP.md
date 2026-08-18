# Roadmap

This is the first delivery map for `build-release`. Shared-kernel ownership is still an open family decision.

## Now

- Keep the repository charter current.
- Lock the lifecycle language: bootstrap, build, verify, pack, release.
- Define artifact contracts: what a build emits, where it lives, and how it is addressed.
- Define the first CLI surface: `init`, `build`, `verify`, `release`, `doctor`.

## Next

- Ship a local MVP that can bootstrap a standard app, produce a reproducible build, and run preflight checks without deploying anywhere.
- Add bundler adapters behind a stable task interface.
- Add environment overlays for `dev` / `test` / `prod` without rewriting task graphs.

## Later

- Add release-target adapters (static hosting, app stores, internal artifact registries).
- Add cache, incremental, and provenance features.
- Align package layout with the family shared kernel once that boundary is decided.

## Non-goals for v1

- Owning a company's CI product.
- Replacing Vite, webpack, or Rspack.
- Encoding app-specific release approvals into the toolkit.
