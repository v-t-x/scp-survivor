# Project Documentation Architecture Design

Date: 2026-07-10
Status: Approved for implementation planning

## 1. Goal

Turn the supplied project background into a maintainable documentation system
with one authoritative source for each kind of decision. The reorganization must
make current facts, product direction, approved development strategy, legal/asset
risks, Agent rules, and historical ideas visibly distinct.

The work changes documentation only. It does not approve or implement any new
gameplay, client, UI/art, commercialization, or release feature.

## 2. Authority Model

Documents have different authority and must not duplicate each other:

| Document | Authority |
|---|---|
| `README.md` / `README.en.md` | Public overview and navigation only |
| `docs/product-vision.md` | Product purpose, SCP differentiation, design principles, owner-approved direction |
| `docs/design.md` | Current implemented game behavior and content |
| `docs/development-strategy.md` | Approved development lanes, near-term status, and unapproved long-term ideas |
| `docs/art-and-asset-direction.md` | UI, art, audio, hybrid-resource, and asset-intake direction |
| `docs/licensing-and-commercialization.md` | License facts, asset provenance policy, commercialization review checklist |
| `AGENTS.md` and `docs/agents/` | Operational permissions and branch responsibilities |
| `CHANGELOG.md` | Shipped version history |
| `docs/archive/` | Historical context; never an active task source |
| `docs/superpowers/` | Approved design/implementation process records; not product requirements by themselves |

When documents conflict, current implemented behavior is determined from code and
`docs/design.md`; product intent comes from `docs/product-vision.md`; work
authorization comes from `docs/development-strategy.md`, `AGENTS.md`, and direct
Project Lead instructions.

## 3. Target Structure

```text
README.md
README.en.md
CHANGELOG.md
LICENSE
AGENTS.md
CLAUDE.md

docs/
├── README.md
├── product-vision.md
├── design.md
├── development-strategy.md
├── art-and-asset-direction.md
├── licensing-and-commercialization.md
├── agents/
│   ├── main.md
│   ├── dev-v2.md
│   ├── dev-app-platform.md
│   ├── refactor-ui-foundation.md
│   └── feature-ui-art-overhaul.md
├── archive/
│   ├── roadmap-1.md
│   ├── roadmap-2.md
│   ├── v1.0-notes.md
│   └── dev-log-2026-07.md
└── superpowers/
    ├── specs/
    └── plans/
```

The ignored local `docs/portfolio-review.md` is private working material. It must
not be moved, deleted, staged, or referenced as a public source.

## 4. Product Vision Extraction

Create `docs/product-vision.md` from the supplied background sections about:

- why SCP was selected;
- why the game must not become a generic Survivors-like with SCP names;
- SCP-driven mechanics, decisions, atmosphere, events, objectives, and entity rules;
- the four questions used to evaluate a proposed feature;
- confirmed direction versus unapproved long-term ideas;
- the seven-level decision priority order;
- owner approval as the final authority for major product and architecture changes.

The product vision is stable and public. It does not list implementation tasks,
specific unapproved SCP entities, or detailed version scheduling.

## 5. Development Strategy Extraction

Create `docs/development-strategy.md` from the supplied background about:

- protecting the current stable version;
- developing App Platform work and v2 gameplay in parallel;
- the roles of `dev/v2`, `dev/app-platform`, `feature/ui-art-overhaul`, and the
  frozen UI Foundation;
- why App packaging should discover platform problems before v2 is complete;
- why final release integration waits for relatively stable gameplay, UI, and assets;
- the distinction between approved near-term direction and unapproved long-term ideas;
- the rule that unapproved ideas may be analyzed but not implemented.

This document authorizes lanes, not individual features. A feature still requires
an approved plan or direct Project Lead assignment.

## 6. Art and Asset Direction Extraction

Create `docs/art-and-asset-direction.md` from the supplied UI/art section:

- the SCP Foundation visual and atmosphere goals;
- the limits of the current procedural prototype presentation;
- the hybrid resource model;
- formal-asset and procedural-effect responsibility lists;
- the eight-step first-pass priority order;
- the rule that presentation work does not change gameplay numbers or win/loss logic;
- the requirement to record source, author, URL, license, modification status, and
  commercial-use status for every external asset.

The UI/Art branch guide links this document instead of copying its content.

## 7. Licensing and Commercialization Extraction

Create `docs/licensing-and-commercialization.md` from the supplied commercial and
licensing section. It must:

- state that the project is currently a prototype/portfolio project with possible
  future commercialization, not an announced commercial release;
- distinguish the existing MIT-licensed code history from possible future code,
  art, audio, fonts, and proprietary content strategies;
- preserve SCP attribution and share-alike concerns as a release-review item;
- prohibit unknown, non-commercial, or personal-use-only assets from entering the
  production asset pipeline;
- provide an asset provenance checklist;
- require a fresh official-source and professional/legal review before commercial
  release;
- explicitly state that the document is project policy and risk tracking, not
  legal advice.

Implementation must verify time-sensitive licensing statements against official
SCP and Creative Commons sources and link those sources near the relevant claims.

## 8. Current Design Cleanup

Keep `docs/design.md` at its existing path so links remain stable, but update it to
match the current code and v1.3 behavior. At minimum, reconcile:

- the module-based source structure rather than the old single-file wording;
- implemented mutation upgrades;
- implemented meta progression and perk store;
- title and pause flows;
- the current upgrade count and current-version exclusions;
- related-document links.

Future ideas belong in product vision or development strategy, not in the current
design facts.

## 9. Archive Policy

Move these historical files without deleting their substantive content:

- `docs/roadmap-1.md` -> `docs/archive/roadmap-1.md`;
- `docs/roadmap-2.md` -> `docs/archive/roadmap-2.md`;
- `docs/v1.0-notes.md` -> `docs/archive/v1.0-notes.md`;
- `docs/dev-log-2026-07.md` -> `docs/archive/dev-log-2026-07.md`.

Add a standard archive notice to each file stating:

- it is historical;
- it may describe removed, completed, or superseded work;
- it is not an approved task list;
- current authority is the product vision, current design, development strategy,
  and direct Project Lead instructions.

Historical files are preserved because they explain design evolution. Completely
duplicated navigation and stale links may be removed.

## 10. Repository Classification Hub

Create `docs/README.md` as the single documentation and repository map. It
classifies:

- public entry files;
- product and current design;
- development strategy;
- art, audio, and assets;
- licensing and commercialization;
- Agent governance;
- source code by `src/config`, `src/scene`, `src/assets`, `src/audio`, `src/ui`, and
  `src/scenes` responsibility;
- scripts, CI, build outputs, and dependencies;
- historical archive;
- Superpowers design and implementation records;
- ignored local/private files.

It links to authoritative documents and states which categories are not task
sources. It does not enumerate `node_modules`, `dist`, or generated files
individually.

## 11. README and Agent Integration

Update both README files to:

- link `docs/README.md`, product vision, current design, development strategy,
  art/asset direction, and licensing/commercialization policy;
- describe the current module/resource architecture accurately;
- keep detailed internal strategy out of the public landing-page body;
- stop presenting archived roadmaps as current recommendations.

Update Agent governance so:

- all feature-planning Agents read product vision and development strategy;
- `dev/v2` also reads current design;
- UI/Art also reads art/asset direction and licensing policy;
- App Platform also reads development strategy and licensing policy;
- archived files and unapproved ideas cannot automatically become tasks.

## 12. Deletion Rules

Deletion is allowed only when content is fully duplicated by an authoritative new
document and has no independent historical value. The implementation must show
the candidate deletion and replacement source before removing it.

This reorganization initially archives historical documents instead of deleting
them. Broken links, duplicate navigation blocks, and obsolete statements in active
documents are removed as part of their rewrite.

## 13. Verification

The implementation must verify:

- all Markdown links resolve to tracked files or intended external URLs;
- archive files contain the standard notice;
- active documents do not describe archived roadmaps as approved work;
- `docs/design.md` agrees with current code for the systems it documents;
- README Chinese and English navigation match;
- Agent guides link the correct authoritative documents;
- ignored private files remain untouched and untracked;
- only documentation files change;
- `git diff --check` passes and the production build remains successful.

## 14. Acceptance Criteria

- The supplied background is preserved across four focused authoritative documents.
- Every tracked repository area is classified in `docs/README.md`.
- Current facts, future intent, work authorization, and history are distinguishable.
- Historical roadmaps are under `docs/archive/` and clearly non-authoritative.
- No duplicated product principle has multiple competing authoritative sources.
- README and Agent navigation point to the new structure.
- Licensing claims include official-source links and a non-legal-advice disclaimer.
- The ignored local portfolio review remains untouched.
- No game implementation files change.
