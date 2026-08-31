---
title: Avis Rust tracing Integration
description: Add tracing observability support to a supported Rust project with Avis.
---

Capability: observability

Status: stable integration manifest, alpha project support

Supported ecosystems:

- Rust

Supported package managers:

- Cargo

Package:

- `tracing`

Command:

```sh
avis add observability
avis add rust-tracing
```

## What Avis Does

- installs the `tracing` crate when it is not already present
- verifies dependency presence

## Files Avis May Create

None.

## Files Avis May Modify

None.

## Dependencies Added

- `tracing`

## Verification

`avis doctor` checks that `tracing` is installed.

## Purpose-First Usage

Rust tracing is the default recommendation for `avis add observability`, `avis add logging`, and `avis add tracing` in a compatible Rust project.

## Manual Setup Differences

Avis installs the crate. You still decide where to instrument code, which subscriber to use, how to format output, and whether to connect exporters or collectors.

## Links

- [tracing documentation](https://docs.rs/tracing/)
