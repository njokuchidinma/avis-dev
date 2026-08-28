---
title: Introduction
description: What Avis is, where it fits, and what it is designed to do.
---

Avis is a source-available, ecosystem-agnostic CLI for safely adding development capabilities to existing projects.

Framework scaffolders create the project. Avis equips it after initialization.

Avis does not replace tools like `create-next-app`, `flutter create`, `django-admin startproject`, `cargo new`, `rails new`, `dotnet new`, Laravel installers, or Spring Initializr. Use those tools first. Then use Avis when you want to add a common capability with a repeatable setup flow.

Avis currently focuses on:

- detecting an existing project
- listing compatible capabilities and integrations
- generating a ChangePlan before modifying files
- applying approved changes
- verifying project health with `avis doctor`

Avis is currently in active development. Use it in projects tracked with version control and review every ChangePlan before applying it.
