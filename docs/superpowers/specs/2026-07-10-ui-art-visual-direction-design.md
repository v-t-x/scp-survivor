# UI/Art Visual Direction Design

## Status and authority

- Approved direction: 2026-07-10.
- Product decision: the first impression should communicate professional Foundation-facility pressure; gameplay should progressively communicate anomalous loss of control and tactical survival tension.
- Owner: `feature/ui-art-overhaul`, subject to Project Lead review and shared-file gates.
- This document authorizes a visual design and implementation plan, not automatic code or asset changes.
- Current baseline: `main` and the UI/Art worktree use the stable web build and the existing UI Foundation contracts.

## Design objective

The UI/Art layer should make the player's emotional state change over a run:

```text
institutional order
  → warning and operational strain
  → anomalous interference
  → containment failure
  → tactical survival under pressure
```

The visual system must remain readable while becoming less stable. Distortion is a gameplay signal with a beginning, duration, intensity, and recovery state; it is not a permanent decorative filter.

## Three-layer visual language

### Layer 1 — Foundation professional pressure

This is the default state for the title page, weapon selection, baseline HUD, upgrade cards, pause, and results screens.

Visual characteristics:

- deep navy-black and cool graphite surfaces;
- cool white and pale cyan for ordinary information;
- amber for warnings and operational attention;
- red reserved for immediate danger, critical damage, and containment failure;
- green reserved for medical, restored, contained, or completed states;
- structured panels, status lights, facility identifiers, warning labels, and segmented readouts;
- restrained motion, stable alignment, and strong hierarchy;
- clear typography that remains legible at the smallest supported viewport.

The player should feel that the facility has procedures, staff, systems, and a chain of command, even though those systems are under pressure.

### Layer 2 — Anomalous loss of control

This layer enters through existing timeline and facility states rather than a new gameplay system. It should make the stable interface visibly unreliable for short, readable intervals.

| Existing state | Presentation response | Recovery requirement |
|---|---|---|
| Power outage | Lower illumination, emergency amber accents, reduced background detail, restrained flicker | Restore baseline contrast when the outage ends |
| Perception decoys | Brief false markers or signal echoes that cannot be confused with critical UI | Auto-expire and never permanently alter HUD state |
| Enemy teleport phase | Short displacement trails, warning arcs, or spatial afterimages | Clear after each teleport; no persistent clutter |
| HUD corruption phase | Bounded text jitter, missing segments, signal labels, or scanline interruptions | Preserve critical values and return to readable state |
| Bullet deviation phase | Small directional distortion around projectile feedback, never around essential controls | Do not alter the actual gameplay value through presentation code |
| Boss arrival | Replace ordinary status language with a high-priority containment alert | Resolve into a stable Boss HUD after the alert |

Rules for this layer:

- critical health, pause, and interaction controls must remain understandable;
- no effect may rely on red alone to communicate meaning;
- every effect has an explicit intensity and cleanup path;
- missing formal assets fall back to the existing procedural path;
- the visual system observes gameplay state and does not create or mutate it.

### Layer 3 — Tactical survival tension

During active combat, visual hierarchy should answer three questions quickly:

1. What can kill me now?
2. What is my current response tool?
3. What decision will become worse if I delay?

The HUD therefore prioritizes health, active weapon state, immediate threat/event banner, timeline pressure, and Boss health when applicable. Enemy and elite warnings use shape, motion, iconography, and placement in addition to color. Weapon cards and combat readouts should communicate role and trade-off rather than only raw numbers.

## Theme token system

The first implementation must establish named tokens instead of scattering colors and font choices across screens.

### Required token groups

| Group | Token examples | Purpose |
|---|---|---|
| Surface | `surfaceFacility`, `surfacePanel`, `surfaceRaised`, `surfaceOverlay` | Foundation panels and overlays |
| Text | `textPrimary`, `textSecondary`, `textMuted`, `textCritical` | Information hierarchy |
| Signal | `signalInfo`, `signalWarning`, `signalDanger`, `signalContained`, `signalAnomaly` | State meaning and alerts |
| Border | `borderDefault`, `borderFocus`, `borderWarning`, `borderCritical` | Panel and interaction states |
| Motion | `motionStable`, `motionWarning`, `motionAnomaly`, `motionCritical` | Duration and intensity policy |
| Typography | `fontDisplay`, `fontBody`, `fontMono`, `fontLabel` | Title, data, labels, and terminal readouts |

Each token needs a value, contrast intent, allowed use, and fallback behavior. Components must use tokens rather than raw presentation values wherever the existing architecture allows.

## Screen scope for the first UI/Art slice

### Title page

The title page establishes the facility identity before any combat begins. It should show a restrained Foundation title treatment, operational subtitle, concise control hints, and a clear primary action. It may include subtle facility status indicators, but no persistent glitching or horror treatment.

### Weapon selection

Weapon selection should feel like an equipment authorization terminal. Each card needs a strong weapon identity, role summary, core trade-offs, selection state, hover/focus state, and clear start action. The store and credits remain visually subordinate to weapon selection so the player understands the run decision first.

### Combat HUD

The baseline HUD should preserve the current information groups while improving hierarchy:

- health and immediate damage state;
- time, kill count, level, and experience;
- current weapon and ammunition/chain/projectile state;
- phase name and next timeline pressure;
- temporary event and Boss banners;
- Boss health during the finale.

The HUD must have a stable baseline mode and explicit anomaly variants. Anomaly variants may change presentation, but not the meaning, location contract, or update cadence of gameplay values.

### Shared overlays

Pause, upgrade, victory, defeat, and the build panel should use the same surface, typography, border, focus, and warning tokens. They are not part of the first visual polish pass if doing so would delay the title, weapon selection, and combat HUD contracts; they must nevertheless receive the same component rules so later work does not create a second visual language.

## Asset and audio strategy

The first UI/Art slice is a mixed-resource pass:

- Theme, panels, labels, alerts, and many dynamic combat effects may remain procedural;
- formal assets should first target high-recognition repeated elements such as player, main enemies, Boss, weapon icons, and facility surfaces;
- any external asset must have a complete provenance and license record before entering the production manifest;
- unsupported or missing assets must render the procedural fallback without duplicate texture-key warnings;
- audio presentation may add approved alert or interface cues through existing `this.playSound()` compatibility, but may not alter audio manager lifecycle or gameplay semantics;
- no external asset with unknown, personal-only, or incompatible commercial-use terms is allowed into the production resource list.

## Animation and VFX budget

Motion should communicate state, not permanently increase visual noise.

- stable screens use short hover, focus, and selection transitions;
- warnings use a limited pulse or sweep with a defined duration;
- anomaly states use bounded jitter, flicker, offset, or afterimage effects;
- critical events may use a brief alert transition and screen response;
- every transient effect must be registered with an owner and destroyed on scene shutdown/restart;
- procedural particles remain appropriate for bullets, impacts, lightning, sparks, and debug graphics.

## Accessibility and readability

- critical state is communicated through at least two channels, such as color plus shape, text, sound, or motion;
- warning and danger states must remain distinguishable for common color-vision differences;
- text remains readable during anomaly effects;
- motion and glitch intensity must be bounded and have a stable fallback;
- pointer hit areas must remain aligned with drawn cards under camera follow;
- viewport scaling must preserve primary action visibility and HUD hierarchy.

## Interface boundaries

### UI/Art-owned

- `src/ui/theme.js` and presentation components;
- approved presentation portions of `src/scene/hud.js` and `src/scene/menus.js`;
- approved visual assets, manifest entries, provenance records, and presentation effects;
- visual/audio presentation calls using existing public contracts.

### Project Lead approval required

- `src/main.js`;
- `src/assets/manifest.js` and `src/scenes/PreloadScene.js`;
- `src/audio/AudioManager.js` and `src/ui/UIManager.js` public interfaces;
- gameplay configuration, persistence schemas, dependency files, entry points, and project-wide docs;
- any new gameplay-to-presentation event or state contract.

### Gameplay-owned

- damage, health, spawning, AI, weapon behavior, timeline rules, upgrade probabilities, task conditions, and win/loss logic.

Missing gameplay data must be reported as an interface request. UI/Art must not invent or silently change gameplay state to make a screen easier to render.

## Acceptance criteria for the first visual design

The design is ready for implementation when:

- a new player can identify the Foundation facility context before combat;
- the same Theme tokens cover title, weapon selection, HUD, upgrade, pause, and results;
- the UI has a stable baseline and bounded anomaly variants;
- health, weapon state, event warnings, timeline pressure, and Boss health remain readable;
- visual effects have explicit duration, intensity, and cleanup ownership;
- fallback behavior and texture keys remain compatible;
- every external asset has a complete provenance and license record;
- the design does not require gameplay, persistence, manager, or client-platform changes without a separate approval;
- the first implementation can be split into reviewable commits: Theme, screens, anomaly states, and approved assets.

## Related documents

- [UI、美术、音频与资源方向](../art-and-asset-direction.md)
- [当前游戏设计](../design.md)
- [许可与商业化准备](../licensing-and-commercialization.md)
- [UI/Art 第一阶段计划](../plans/2026-07-10-ui-art-phase1-planning.md)
