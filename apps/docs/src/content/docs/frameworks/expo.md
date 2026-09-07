---
title: Using Avis with Expo
description: Current Avis support for Expo projects.
---

Status: alpha

## Detected Through

Avis recognizes Expo through Node package metadata and Expo project signals.

## Supported Package Managers

- npm
- pnpm
- yarn
- bun

## Supported Capabilities

- secure storage

## Current Integrations

- Expo SecureStore

## Purpose-First Commands

```sh
avis add secure-storage
```

## What Avis May Change

Current Expo support is install-level. Avis adds the compatible SecureStore dependency through the detected Node package manager.

## Not Handled By Avis

Avis does not configure native permissions, Expo plugins, app config, encryption policy, or mobile release settings.
