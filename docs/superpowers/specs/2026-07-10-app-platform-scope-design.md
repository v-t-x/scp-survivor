# App Platform Scope Migration Design

Date: 2026-07-10
Status: Approved for implementation planning

## 1. Correction

The current `release/desktop-app` name and guide incorrectly restrict the App
Agent to desktop packaging. The intended responsibility is every client form of
SCP Survivor, including desktop, mobile, installable web/PWA, launchers, and
future platform containers.

The current branch has no unique commits and is aligned with `main`, so this is
the lowest-risk point to correct the branch identity and governance language.

## 2. Chosen Migration

- Rename local branch `release/desktop-app` to `dev/app-platform`.
- Keep the existing worktree path `C:\scp-survivor-app`.
- Push `dev/app-platform` and configure it to track
  `origin/dev/app-platform`.
- Verify the new local and remote branch point at the expected commit.
- Delete the obsolete remote `release/desktop-app` only after the new branch is
  verified and all worktrees are clean.
- Replace `docs/agents/release-desktop-app.md` with
  `docs/agents/dev-app-platform.md`.
- Update all active governance documents so no current instruction still treats
  this role as desktop-only.

## 3. App Platform Ownership

The `dev/app-platform` Agent owns:

- desktop clients and native desktop containers;
- mobile clients and mobile wrappers;
- installable web/PWA behavior;
- launchers and future platform-specific client shells;
- platform startup, lifecycle, filesystem, permissions, security, and offline
  operation;
- installation, updates, signing, stores, packaging, release automation, and
  distribution;
- platform-specific integrations that do not change gameplay semantics.

## 4. Excluded Scope

The App Platform Agent does not own:

- gameplay systems, balance, enemies, weapons, bosses, events, timeline, or
  progression;
- UI/art visual direction, asset creation, animation/VFX design, or audio content;
- hidden gameplay changes implemented through platform adapters;
- unapproved changes to shared web entry points, dependencies, preload/asset
  contracts, UI/audio manager interfaces, or persistence schemas.

When a platform needs a shared hook, the Agent must propose the interface and its
impact before modifying the shared file.

## 5. Verification Model

Verification is target-aware rather than requiring every platform on every
change:

- always run the web production build;
- run startup and package checks for the platform affected by the change;
- verify relevant offline, permission, path, security, audio, update, signing, or
  store behavior;
- confirm unchanged platforms when a shared client contract changes;
- report untested platforms explicitly;
- provide final diff, commit, and Git-status evidence.

## 6. Governance Files to Update

The implementation updates:

- `AGENTS.md` branch routing;
- `docs/agents/dev-app-platform.md`;
- `docs/agents/dev-v2.md` cross-domain exclusions;
- `docs/agents/feature-ui-art-overhaul.md` cross-domain exclusions;
- `docs/agents/refactor-ui-foundation.md` frozen-scope wording;
- `docs/agents/main.md` protected-main wording;
- the existing agent-governance design and implementation plan so active
  documentation reflects the corrected role.

`CLAUDE.md` requires no content change because it delegates routing to
`AGENTS.md`.

## 7. Safety and Rollback

- Stop if `release/desktop-app` contains unique commits, is dirty, or differs from
  its expected remote state.
- Create and verify the new branch before deleting the old remote branch.
- Do not move or recreate the existing App worktree directory.
- Do not change game or App implementation code during this migration.
- If the new remote push fails, keep the old remote branch and report the failure.
- Git commit history preserves the old branch name and allows the branch to be
  recreated if an external integration still references it.

## 8. Acceptance Criteria

- `C:\scp-survivor-app` is on `dev/app-platform`.
- Local and remote `dev/app-platform` point at the approved governance commit.
- No local or remote `release/desktop-app` branch remains after successful
  verification.
- `AGENTS.md` routes `dev/app-platform` to
  `docs/agents/dev-app-platform.md`.
- The App guide covers desktop, mobile, PWA/installable web, launchers, and future
  client containers.
- Active governance documentation contains no desktop-only ownership statement
  for the App Agent.
- No game or App implementation code changes.
- All worktrees finish clean.
