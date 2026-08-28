# Core V2 Notes

## Public Usage Should Stay Capability-First

The public Avis workflow should lead with capabilities, not specific packages:

```sh
npm install -g avis-dev@alpha
cd my-next-app
avis add state-management
avis doctor
```

Integration-specific commands such as `avis add zustand` are still useful, but they should live mostly in integration reference pages. The first impression should teach the product idea: Avis equips a project by capability, then resolves the right compatible integration.

## npmjs README Updates Require a New Version

npm package tarballs are immutable after publish. To update the README shown on npmjs.com, publish a new package version that contains the updated `README.md`.

During alpha, keep the `alpha` and `latest` dist tags aligned with the newest alpha when the npmjs package page should show the current alpha README.

## Installation Model

Avis is a machine-level CLI:

- install Avis once on the developer's machine
- run `avis` inside many supported projects
- do not add Avis as an application dependency in target projects
- use each target project's native package manager when applying integrations

This distinction should remain explicit in Core V2 docs, CLI help, and release messaging.
