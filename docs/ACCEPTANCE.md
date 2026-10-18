# Acceptance records

> Validation records for this fork. Upstream history before 0.1.0 is in
> [QCYTSN/dsh-dafeiyu](https://github.com/QCYTSN/dsh-dafeiyu). Use the
> [updating guide](UPDATING.md) for installation.

## 2026-10-18 · First Lanjiang release / 0.1.0

- Rendered 16 clips / 2,052 frames offline with `tools/render` on a 256 × 352
  canvas at 24 fps; loop clips are 8 seconds and join seamlessly.
- Passed 112 JavaScript and 59 Python tests locally.
- Installed through the real DSH plugin manager; it requires `pnpm` on PATH.
  The offline archive is packed from flat dependencies
  (`npm install --ignore-scripts --no-package-lock --omit=dev && npm pack`).
- Not covered: macOS multi-monitor dragging and font appearance, and a real
  Desktop API-key account.
