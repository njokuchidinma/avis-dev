# Native Distribution

Avis is currently distributed through npm during alpha. V2 keeps npm support but defines the standalone target matrix so release automation can produce native artifacts consistently.

Target metadata lives in `distribution/native-targets.json`.

Current targets:

- macOS ARM64
- macOS x64
- Linux x64
- Linux ARM64
- Windows x64

Generate the release manifest:

```sh
pnpm build:native-manifest
```

This writes `dist/native-manifest.json`. It does not compile standalone binaries yet; it verifies and exports the target matrix that future binary packaging should consume.
