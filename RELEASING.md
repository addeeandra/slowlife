## Local Dev Release

For small-community prereleases, use the local `./local-release` script instead of CI.
It runs on macOS and Linux and bundles for whichever platform you run it on.

```bash
./local-release v0.0.1-dev
./local-release v0.0.1-dev --push
./local-release v0.0.1-dev --push --auto
```

- Tags must match `vX.Y.Z-dev`
- The script updates `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` to `X.Y.Z`
- Build-only mode creates the local bundles and leaves version edits in your working tree
- `--push` creates a git tag, pushes it, creates a GitHub prerelease, and uploads every bundle it finds
- `--auto` only works with `--push` and auto-commits managed version changes when the dirty state is limited to the release version files
- These `-dev` releases are not notarized yet, so macOS may require manual approval on first open

### Bundles per platform

| Host | Uploaded artifacts |
|------|--------------------|
| macOS | `.dmg` |
| Linux | `.deb`, `.rpm`, `.AppImage` |

Because a run only bundles for its host, publishing both macOS and Linux artifacts under
one tag means running the script on macOS first and attaching the Linux bundles to the
existing release afterwards:

```bash
gh release upload v0.0.1-dev \
  src-tauri/target/release/bundle/deb/*.deb \
  src-tauri/target/release/bundle/rpm/*.rpm \
  src-tauri/target/release/bundle/appimage/*.AppImage
```

AppImage bundling downloads `linuxdeploy` tooling on first run, so that step needs network
access and `xdg-utils` installed.