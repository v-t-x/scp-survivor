# `dev/v2` Gameplay/Core Guide

## Required reading

- `docs/product-vision.md`
- `docs/design.md`
- `docs/development-strategy.md`

## Owns

- Gameplay loop and runtime state.
- SCP entities, bosses, enemies, weapons, events, stages, and level progression.
- Combat, spawning, timeline, progression, balance, and gameplay configuration.

## Does not own

- UI/art redesign, final textures, animation/VFX presentation, or audio assets.
- Asset-loading architecture and manager-interface redesign.
- Client containers, platform packaging, installers, signing, stores, or release automation.

## Shared-file rule

Changes to `src/main.js`, manifests, UI/audio managers, persistence schemas,
dependency manifests, entry points, or project-wide docs require Project Lead
approval before editing.

## Verification

Run the production build plus targeted gameplay smoke tests. Include restart,
pause, victory/defeat, or persistence checks whenever the changed system touches
those paths. Report actual results and final Git status.
