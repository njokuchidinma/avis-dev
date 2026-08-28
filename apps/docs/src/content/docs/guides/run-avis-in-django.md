---
title: Run Avis in a Django Project
description: Add Django REST Framework to an existing Django project.
---

Start from an existing Django project.

```sh
cd my-django-project
avis
```

Add Django REST Framework:

```sh
avis add django-rest-framework
```

Review the ChangePlan before confirming. Avis may install `djangorestframework` using the detected Python package manager and patch the detected Django settings module to include `rest_framework`.

Verify:

```sh
avis doctor
```

Avis itself should not be added to `requirements.txt`, `pyproject.toml`, or the Django virtual environment as an application dependency.
