---
title: Capabilities
description: The developer capabilities Avis can add to projects.
---

A capability is the category of development setup you want to add. An integration is the specific implementation Avis can install and configure.

Current built-in capabilities:

| Capability ID | Name | Description |
| --- | --- | --- |
| `state-management` | State Management | Client-side application state. |
| `data-fetching` | Data Fetching | Client-side server-state and API fetching. |
| `api` | API | API framework extensions and tooling. |
| `forms` | Forms | Form state and submission helpers. |
| `validation` | Validation | Runtime schema validation. |

Example:

```sh
avis add state-management
```

If exactly one compatible integration exists for the detected project and capability, Avis selects it. If multiple compatible integrations exist, Avis lists them and asks you to run a specific integration command.
