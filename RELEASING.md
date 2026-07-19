## Local Dev Release

For small-community macOS prereleases, use the local `./local-release` script instead of CI.

```bash
./local-release v0.0.1-dev
./local-release v0.0.1-dev --push
./local-release v0.0.1-dev --push --auto
```

- Tags must match `vX.Y.Z-dev`
- The script updates `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` to `X.Y.Z`
- Build-only mode creates the local `.dmg` and leaves version edits in your working tree
- `--push` creates a git tag, pushes it, creates a GitHub prerelease, and uploads the `.dmg`
- `--auto` only works with `--push` and auto-commits managed version changes when the dirty state is limited to the release version files
- These `-dev` releases are not notarized yet, so macOS may require manual approval on first open

## Android (APK)

Prerequisites: Android SDK (platform + build-tools), NDK (r27 tested), JDK 17+, and the Rust Android targets.

```bash
export ANDROID_HOME=<sdk-path>
export NDK_HOME=$ANDROID_HOME/ndk/<version>
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

pnpm tauri:android:build:apk                # release APK, all architectures
pnpm tauri android build --apk --target aarch64 --debug   # debug APK, arm64 only
```

- The Gradle project lives in `src-tauri/gen/android` (committed; build outputs are gitignored). Regenerate it with `pnpm tauri android init` if needed
- APKs land in `src-tauri/gen/android/app/build/outputs/apk/`
- Release APKs are unsigned until a keystore is configured in `src-tauri/gen/android/app/build.gradle.kts` (see the [Tauri signing guide](https://tauri.app/distribute/sign/android/)); debug APKs are auto-signed with the debug keystore and installable right away