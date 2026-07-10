# `feature/ui-art-overhaul` UI/Art Guide

## Required reading

- `docs/product-vision.md`
- `docs/development-strategy.md`
- `docs/art-and-asset-direction.md`
- `docs/licensing-and-commercialization.md`

## Owns

- HUD, menus, overlays, layout, theme, accessibility, and presentation.
- Textures, spritesheets, atlases, animation, VFX, and art assets.
- Audio assets and presentation-layer audio integration.
- Gradual migration to approved asset, UI, and audio foundation interfaces.

## Does not own

- Gameplay balance, enemy AI, weapon mechanics, timeline rules, win/loss, or
  meta-progression behavior.
- Client containers, platform packaging, stores, and release automation.

## Interface rule

Request missing gameplay hooks as explicit interface changes. Do not hide gameplay
behavior changes inside rendering, UI, asset, or audio commits. Shared foundation
interfaces require Project Lead approval before editing.

## Verification

Run the production build and inspect title, weapon selection, combat HUD, pause,
overlays, and restart paths affected by the change. Check representative viewport
sizes, pointer hit areas, missing/duplicate asset keys, console output, fallback
behavior, and final Git status.
