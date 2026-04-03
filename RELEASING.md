## Local Dev Release

For small-community macOS prereleases, use the local `./local-release` script instead of CI.

```bash
./local-release v0.0.1-dev
./local-release v0.0.1-dev --push
./local-release v0.0.1-dev --push --auto
```

- Tags must match `vX.Y.Z-dev`
- The script updates both `package.json` and `src-tauri/tauri.conf.json` to `X.Y.Z`
- Build-only mode creates the local `.dmg` and leaves version edits in your working tree
- `--push` creates a git tag, pushes it, creates a GitHub prerelease, and uploads the `.dmg`
- `--auto` only works with `--push` and auto-commits managed version changes when the dirty state is limited to the release version files
- These `-dev` releases are not notarized yet, so macOS may require manual approval on first open