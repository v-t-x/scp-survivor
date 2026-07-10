# `refactor/ui-foundation` Maintenance Guide

## Status

Phase 1 is complete and approved. This branch is frozen for audit and narrowly
approved defect fixes. New UI/art implementation belongs on
`feature/ui-art-overhaul`.

## Allowed

- Read-only audit and historical comparison.
- Explicitly requested lifecycle, fallback, manager, or documentation fixes.

## Not allowed

- New visual design, art/audio content, gameplay features, or desktop packaging.
- Unrequested refactoring of the established foundation interfaces.

## Verification

For lifecycle changes, run the production build and at least two game runs
separated by `scene.restart()`. Check texture fallback, duplicate keys, managers,
timers, listeners, console output, and final Git status as relevant.
