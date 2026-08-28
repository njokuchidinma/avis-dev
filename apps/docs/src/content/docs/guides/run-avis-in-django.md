---
title: Run Avis in a Django Project
description: Add Django REST Framework to an existing Django project.
---

Start from an existing Django project.

```sh
cd my-django-project
node path/to/avis-dev/packages/cli/dist/index.js
```

Add Django REST Framework:

```sh
node path/to/avis-dev/packages/cli/dist/index.js add django-rest-framework
```

Review the ChangePlan before confirming. Avis may install `djangorestframework` and patch the detected Django settings module to include `rest_framework`.

Verify:

```sh
node path/to/avis-dev/packages/cli/dist/index.js doctor
```
