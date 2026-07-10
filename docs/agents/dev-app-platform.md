# `dev/app-platform` Multi-Client App Guide

## Required reading

- `docs/product-vision.md`
- `docs/development-strategy.md`
- `docs/licensing-and-commercialization.md`

## Owns

- Desktop clients and native desktop containers.
- Mobile clients and mobile wrappers.
- Installable web/PWA behavior.
- Launchers and future platform-specific client shells.
- Platform startup, lifecycle, filesystem, permissions, security, and offline operation.
- Installation, updates, signing, stores, packaging, release automation, and distribution.
- Platform-specific integrations that preserve gameplay semantics.

## Does not own

- Gameplay rules, balance, enemies, weapons, bosses, events, timeline, progression,
  win/loss, or meta-progression behavior.
- UI/art visual direction, asset creation, animation/VFX design, or audio content.
- Hidden gameplay changes implemented through platform adapters.

## Shared-file rule

Before editing dependency manifests, lockfiles, `index.html`, build configuration,
web entry points, preload/asset contracts, UI/audio manager interfaces,
persistence schemas, or shared docs, report the exact platform requirement and
cross-branch impact and obtain Project Lead approval.

## Verification

Always run the web production build. Run startup and package checks for each
platform affected by the change, and verify relevant offline, permission, path,
security, audio, update, signing, or store behavior. When a shared client contract
changes, confirm unaffected platforms or report them as explicitly untested.
Report actual results and final Git status.
