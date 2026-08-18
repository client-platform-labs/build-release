# Roadmap

Deep MVP track for Client Platform Labs v1.

## Now

- Artifact contract (locked): `outDir` + `artifact-manifest.json` (entries, files, optional hashes).
- `verify` (locked): existence, non-empty, entry resolution, optional sourcemaps.
- Adapter surface (locked): `build` / `clean` / `resolveOutputs`; first adapter Vite 8.
- CLI surface (locked): `init`, `build`, `verify`, `doctor`.
- Default preset (locked): `web-vite` → `products.buildRelease` + manifest targets/tooling/entry/outDir.

## Next

- Local MVP: init Vite SPA, reproducible `build`, local `verify` without deploying.
- Emit `dist/artifact-manifest.json` from `resolveOutputs`.

## Later

- `release` and remote deploy adapters.
- Mandatory hashes, size budgets, provenance.
- `pack` if artifact graphs need an explicit command.

## Non-goals for v1

- Remote `release`.
- Signing / SLSA.
- Owning company CI.
- Replacing Vite/webpack/Rspack.
- Adapter `dev`/`watch` as part of the contract.
