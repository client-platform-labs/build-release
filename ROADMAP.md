# Roadmap

Deep MVP track for Client Platform Labs v1.

## Now

- Lock lifecycle language: bootstrap, build, verify, pack, release.
- Define artifact contracts.
- CLI surface (locked): `init`, `build`, `verify`, `doctor`.
- Default preset (locked): `web-vite`.

## Next

- Local MVP: init a Vite SPA, reproducible `build`, local `verify` without deploying.
- Bundler adapter interface with Vite 8 first.

## Later

- `release` and remote deploy adapters.
- `pack` as an explicit command if artifact graphs need it.
- Cache, incremental, and provenance features.

## Non-goals for v1

- Remote `release` in the first deep MVP.
- Owning a company CI product.
- Replacing Vite, webpack, or Rspack.
- App-specific release approvals.
