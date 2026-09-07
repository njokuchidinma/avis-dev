---
title: django-anymail
description: Configure-level transactional email setup for Django projects.
---

Status: stable manifest, alpha project support  
Setup maturity: configure  
Capability: email

## Use It

```sh
avis add email
avis add django-anymail
```

## Supported Projects

- Django
- pip, uv, or Poetry

## What Avis Changes

Avis installs `django-anymail`, creates an email settings helper, and adds example environment entries for provider API keys and default sender configuration.

## Verification and Repair

This is configure-level support. Avis verifies dependency and helper presence, but provider selection and production email settings stay manual.

## Still Manual

- choosing Mailgun, Postmark, Brevo, Resend, or another Anymail provider
- importing the helper into settings
- setting real API keys outside source control
- configuring domains, SPF, DKIM, and DMARC
