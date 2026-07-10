# `main` Integration Guide

## Purpose

`main` is the protected integration baseline. Default work is read-only review,
architecture analysis, governance/roadmap documentation, integration verification,
and explicitly authorized release preparation.

## Allowed

- Review branches, commits, diffs, tests, architecture, and merge risk.
- Maintain governance, roadmap, architecture, and release documentation.
- Perform an explicitly authorized merge, synchronization, push, or release step.

## Not allowed by default

- Implement gameplay, UI/art, audio/assets, or App-platform features directly.
- Fix a feature defect that belongs to an active owning branch.
- Merge or push merely because a branch appears ready.

## Integration gate

Confirm source review approval, clean worktrees, expected ancestry, approved merge
method, fresh build/smoke evidence, and final clean status. Stop if remote state or
ancestry changed.
