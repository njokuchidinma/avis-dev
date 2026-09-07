---
title: Gin Validator
description: Install-level validation support for Gin projects.
---

Status: stable manifest, alpha project support  
Setup maturity: install  
Capability: validation

## Use It

```sh
avis add validation
avis add gin-validator
```

## Supported Projects

- Gin
- Go modules

## What Avis Changes

Avis adds the compatible Go validation dependency through the Go package manager adapter.

## Verification and Repair

This is install-level support. Avis checks dependency intent, but does not yet generate handlers, DTOs, or request validation middleware.

## Still Manual

- struct tags
- request binding
- error response design
- localization
- endpoint-level validation rules
