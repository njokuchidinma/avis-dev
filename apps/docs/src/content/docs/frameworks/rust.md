---
title: Using Avis with Rust
description: Current Avis support for Rust projects.
---

Status: alpha

## Detected Through

Avis recognizes a Rust project through:

- `Cargo.toml`

## Supported Package Managers

- Cargo

Avis uses Cargo for Rust project dependencies. Avis itself should not be added to `Cargo.toml`.

## Supported Capabilities

- observability
- logging
- tracing

## Current Integrations

- Rust tracing

## Purpose-First Commands

```sh
avis add observability
avis add logging
avis add tracing
```

## What Avis May Change

Avis installs the `tracing` crate when it is not already present.

`avis doctor` verifies that the `tracing` dependency is installed. Instrumentation calls, subscriber setup, log formatting, exporters, and runtime-specific wiring remain Rust application decisions.

## Not Handled By Avis

Avis does not replace `cargo new`, workspace layout, async runtime choices, subscriber architecture, telemetry exporters, or release configuration.

Framework scaffolders create the project. Avis equips it.
