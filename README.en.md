# SCP Survivor (SCP 幸存者)

[简体中文](./README.md) · **English**

[![Play](https://img.shields.io/badge/▶️_Play_Now-Live_Demo-4da07b)](https://dist-chi-ten-47.vercel.app)
[![CI](https://github.com/v-t-x/scp-survivor/actions/workflows/ci.yml/badge.svg)](https://github.com/v-t-x/scp-survivor/actions/workflows/ci.yml)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-8a2be2)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

> A top-down 2D Survivors-like single-run prototype. A Foundation security officer fights and upgrades through a six-minute containment-failure timeline before confronting SCP-049.

> **Version status:** `v1.5.0` (SCP-049: Surgical Frenzy) is the latest formal release, adding a frenzy phase, a brief weakness window, mixed reinforcements, and self-replicating enemy pressure to the final encounter. `v1.4.0` (Containment Readiness) is a retrospective stability update for startup, resource fallback, and repeated restarts. The online demo has not been verified against the current tag; the UI/art overhaul and Windows Electron client remain unreleased on separate development branches. See [current project status](./docs/project-status.md).

The project uses Phaser 3, Vite, and plain JavaScript. The current build has no production image or audio assets: textures are generated procedurally and sound effects are synthesized through the Web Audio API. Preloading, asset manifests, and fallback interfaces are already in place for gradual asset integration.

**Play online: [https://dist-chi-ten-47.vercel.app](https://dist-chi-ten-47.vercel.app)**

## Quick Start

```bash
npm install
node --test
npm run dev
npm run build
npm run preview
```

The development server normally uses `http://localhost:5173/`; follow the terminal output if it differs.

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| `Space` | Dodge dash with brief invulnerability and cooldown |
| `Tab` | Hold to inspect the current build |
| `Esc` | Pause or resume |
| `M` | Mute or unmute |
| Mouse | Weapon, upgrade, store, and menu choices |

Weapons aim and attack automatically. Level-ups support three choices, rerolls, and healing by skipping.

## Current Gameplay

```text
Title and permanent-upgrade store
  → choose one of three weapons
  → move, auto-attack, and collect XP
  → level up, mutate the weapon, reroll, or skip
  → react to enemies, perception hazards, and a fixed power outage
  → SCP-500 appears at 4:00
  → clear the field and fight SCP-049 at 6:00
  → earn credits on victory or defeat, then restart
```

The current implementation includes:

- three weapons, each with one single-acquisition mutation;
- 16 upgrade definitions, three rerolls per run, and skip-to-heal;
- three normal enemies, three elites, and the SCP-049 boss;
- a six-minute timeline, power outage, perception hazards, combat stim, and SCP-500;
- localStorage credits and four permanent starting perks;
- title, weapon-select, HUD, build, pause, level-up, and results flows.

See the [current game design](./docs/design.md) for implementation facts. The product goal is to develop SCP-specific rules and decisions rather than only reskinning a generic horde-survival game; see the [product vision](./docs/product-vision.md).

## Technology and Structure

- Engine: Phaser 3.90 with Arcade Physics;
- Build: Vite 7;
- Language: JavaScript ES Modules;
- Scenes: `PreloadScene` prepares assets and fallbacks, then starts `PrototypeScene`;
- Architecture: separate configuration, gameplay mixins, asset, audio, and UI interface layers;
- Persistence: localStorage with a safe in-memory fallback.

```text
scp-survivor/
├── src/
│   ├── main.js              # PrototypeScene composition and lifecycle
│   ├── scenes/              # PreloadScene
│   ├── config/              # constants, balance, upgrades, meta progress
│   ├── scene/               # gameplay-domain mixins
│   ├── assets/              # manifest, keys, fallback textures
│   ├── audio/               # AudioManager
│   └── ui/                  # UIManager and theme tokens
├── scripts/                 # balance simulation and maintenance scripts
├── docs/                    # authority docs, agent guides, archive, process records
├── .github/workflows/       # CI test and build checks
├── CHANGELOG.md
├── LICENSE
└── package.json
```

See the [documentation and repository map](./docs/README.md) for the complete classification.

## Documentation

- [Documentation and repository map](./docs/README.md)
- [Current project status](./docs/project-status.md)
- [Product vision](./docs/product-vision.md)
- [Current game design](./docs/design.md)
- [Development strategy](./docs/development-strategy.md)
- [UI, art, audio, and asset direction](./docs/art-and-asset-direction.md)
- [Licensing and commercialization readiness](./docs/licensing-and-commercialization.md)
- [Changelog](./CHANGELOG.md)

Historical roadmaps, version analysis, and development logs live under `docs/archive/`. They are preserved for context and do not authorize current work.

## Development Approach

Different stages of the project have used AI coding assistants including Cursor, Claude Code, and Codex. The project owner confirms major product and architecture decisions. Agent ownership and delivery rules are defined in [AGENTS.md](./AGENTS.md).

## License and Attribution

- Repository code is currently released under the [MIT License](./LICENSE).
- SCP-derived content must satisfy the applicable attribution and share-alike requirements.
- Every SCP article, image, font, audio file, and other external asset must be reviewed before a formal release.

See [licensing and commercialization readiness](./docs/licensing-and-commercialization.md) for policy, official sources, and the legal disclaimer.
