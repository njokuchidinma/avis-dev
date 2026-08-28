---
title: Compatibility
description: How integrations decide whether they can run.
---

Compatibility is checked against the detected project context before planning.

Current integrations check:

- ecosystem
- framework
- package manager

Examples:

- Next.js integrations require the Node ecosystem, detected Next.js framework, and a supported Node package manager.
- Django REST Framework requires the Python ecosystem, detected Django framework, and a supported Python package manager.

If compatibility fails, Avis prints the reason and supported targets.
