# SCP Survivor Agent Governance

## Authority

This file is the authoritative collaboration policy for every AI agent working
in this repository. Direct user instructions override this file. Branch guides
may narrow scope but may not weaken these rules.

## Mandatory startup

Before analysis or modification:

1. Run `Get-Location`, `git branch --show-current`, `git status --short --branch`,
   and `git worktree list`.
2. Confirm the current worktree matches the assigned branch.
3. Read the guide selected by the branch-routing table below.
4. If the branch is unknown or the worktree is unexpectedly dirty, stop
   modification and report the condition.

## Branch routing

| Branch | Required guide |
|---|---|
| `main` | `docs/agents/main.md` |
| `dev/v2` | `docs/agents/dev-v2.md` |
| `dev/app-platform` | `docs/agents/dev-app-platform.md` |
| `refactor/ui-foundation` | `docs/agents/refactor-ui-foundation.md` |
| `feature/ui-art-overhaul` | `docs/agents/feature-ui-art-overhaul.md` |

Any unlisted branch defaults to read-only inspection. Do not modify it until the
Project Lead assigns a scope or explicitly authorizes the work.

## Universal safety rules

- Work only inside the current worktree. Never edit another worktree.
- Preserve existing user and agent changes. Do not reset, discard, overwrite,
  stash, move, or delete them without explicit authorization.
- Stay inside the current branch guide's responsibility area.
- Before changing a shared file, report the reason, affected contract, impacted
  branches, and required verification, then wait for Project Lead approval.
- Do not merge, push, delete branches/worktrees, rewrite history, create releases,
  or publish artifacts unless the Project Lead explicitly authorizes that exact
  action.
- Do not claim success from inspection alone. Provide fresh build, test, smoke,
  diff, and Git-status evidence proportionate to the change.
- A successful build proves compilation only, not gameplay correctness.

## Shared-file gate

Treat these as cross-domain, high-conflict files or interfaces:

- `src/main.js`
- `package.json` and `package-lock.json`
- `index.html` and build configuration
- asset manifests and the preload flow
- `AudioManager` and `UIManager` public interfaces
- shared configuration and persistence schemas
- README, changelog, roadmap, architecture, and governance documents

These files are not permanently forbidden, but modifying them requires prior
Project Lead approval.

## Required handoff

Every implementation report must include:

- branch, worktree, and final HEAD;
- commit hashes and purpose;
- files and public contracts changed;
- exact verification commands and actual results;
- limitations, risks, and follow-ups;
- final `git status`;
- requested next action without performing an unauthorized merge or push.

## Escalation

Stop and report when scope crosses branches, a shared file needs an unapproved
change, remote ancestry differs from expectations, the worktree is unexpectedly
dirty, tests expose an unrelated regression, or credentials/irreversible actions
are required.
