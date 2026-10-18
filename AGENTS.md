# Repository agent instructions

## Release publishing

- Never run `npm publish` locally. npm releases are built and published by
  `.github/workflows/publish.yml` through npm trusted publishing (OIDC).
- Never force, delete, move, or reuse a published version tag. If a version already exists, bump
  `package.json` and update the release notes.
- Before publishing, work on `main`, commit every intended release file, and leave the worktree
  clean. GitHub Actions handles tests, Windows / Linux x64 / macOS Helper packaging, npm publishing,
  and the GitHub Release.
- To pack an offline `.tgz` locally, use flat dependencies (never `npm pack` from a pnpm symlinked
  `node_modules`): `npm install --ignore-scripts --no-package-lock --omit=dev && npm pack`.
  See `docs/RELEASING.md`.
- npm OIDC trusted publishing cannot run `npm dist-tag`. Promoting a previously published alpha to
  `latest` is a separate package-owner action and must not be faked with a local publish.
