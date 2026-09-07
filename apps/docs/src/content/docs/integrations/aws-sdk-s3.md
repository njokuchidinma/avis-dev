---
title: AWS S3 SDK
description: Configure-level object storage setup for Node projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: storage

## Use It

```sh
avis add storage
avis add aws-sdk-s3
```

## Supported Projects

- Node projects
- npm, pnpm, yarn, or bun

## What Avis Changes

Avis installs the AWS S3 SDK, creates a storage helper module, and adds example region/bucket environment entries.

## Verification and Repair

This is configure-level support. Avis verifies local scaffolding, but cloud IAM and bucket policy remain manual.

## Still Manual

- IAM permissions
- bucket creation
- object naming strategy
- signed URL policy
- CDN and CORS configuration
