---
title: Avis Flutter Riverpod Integration
description: Add Flutter Riverpod state management to a supported Flutter project with Avis.
---

Capability: state management

Status: stable integration manifest, alpha project support

Supported ecosystems:

- Dart

Supported frameworks:

- Flutter

Supported package managers:

- Dart pub

Package:

- `flutter_riverpod`

Command:

```sh
avis add state-management
avis add flutter-riverpod
```

## What Avis Does

- installs Flutter Riverpod when it is not already present
- creates a starter provider module when it does not already exist
- verifies dependency and starter provider presence

## Files Avis May Create

- `lib/providers/counter_provider.dart`

## Files Avis May Modify

None.

## Dependencies Added

- `flutter_riverpod`

## Verification

`avis doctor` checks:

- `flutter_riverpod` dependency installed
- starter provider module detected

If the dependency exists but the starter provider file is missing, Avis reports the integration as partially configured.

## Purpose-First Usage

Flutter Riverpod is the default recommendation for `avis add state-management` in a compatible Flutter project.

## Links

- [Riverpod documentation](https://riverpod.dev/)
