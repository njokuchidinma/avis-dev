---
title: Using Avis with Flutter
description: Current Avis support for Flutter projects.
---

Status: alpha

## Detected Through

Avis recognizes a Flutter project through:

- `pubspec.yaml`
- Flutter SDK dependency metadata
- Flutter configuration in the package manifest

## Supported Package Managers

- Dart pub

Avis uses Dart pub for Flutter project dependencies. Avis itself should not be added to `pubspec.yaml`.

## Supported Capabilities

- state management

## Current Integrations

- Flutter Riverpod

## Purpose-First Commands

```sh
avis add state-management
avis add state
avis add stores
```

## What Avis May Change

Avis installs Flutter Riverpod and creates a starter provider module when it is missing.

`avis doctor` verifies both the `flutter_riverpod` dependency and the starter provider module. If the dependency exists but the provider module is missing, Avis reports the integration as partially configured.

## Not Handled By Avis

Avis does not replace `flutter create`, routing architecture, app state modeling, code generation setup, platform configuration, or deployment configuration.

Framework scaffolders create the project. Avis equips it.
