# Project Documentation Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the approved project background into authoritative product, strategy, art/asset, and licensing documents; archive historical plans; classify the repository; and correct active navigation without changing game code.

**Architecture:** Each type of truth has one authoritative Markdown source. Public READMEs remain concise entry points, historical plans move under `docs/archive/`, Agent guides link rather than duplicate policy, and `docs/README.md` classifies all tracked repository areas. Licensing claims use official SCP Foundation and Creative Commons sources and remain explicitly non-legal advice.

**Tech Stack:** Markdown, Git, PowerShell link validation, npm/Vite build, official SCP Wiki and Creative Commons documentation.

## Global Constraints

- Modify documentation only; do not change `src/`, `scripts/`, package manifests, build configuration, or runtime behavior.
- Do not move, delete, stage, or publicly reference ignored `docs/portfolio-review.md`.
- Preserve the substantive content of historical roadmaps and logs under `docs/archive/`.
- Current implemented behavior belongs only in `docs/design.md` and must be verified against code.
- Product intent belongs only in `docs/product-vision.md`.
- Approved lanes and unapproved ideas belong only in `docs/development-strategy.md`.
- UI/art and hybrid-resource policy belongs only in `docs/art-and-asset-direction.md`.
- Licensing facts and commercial-release risk belong only in `docs/licensing-and-commercialization.md`.
- Archived files and Superpowers records are never automatic task sources.
- External licensing claims must cite official SCP Foundation or Creative Commons pages.
- Use fast-forward-only synchronization after main is verified and pushed.

---

## File Map

**Create:**

- `docs/README.md`
- `docs/product-vision.md`
- `docs/development-strategy.md`
- `docs/art-and-asset-direction.md`
- `docs/licensing-and-commercialization.md`

**Move:**

- `docs/roadmap-1.md` -> `docs/archive/roadmap-1.md`
- `docs/roadmap-2.md` -> `docs/archive/roadmap-2.md`
- `docs/v1.0-notes.md` -> `docs/archive/v1.0-notes.md`
- `docs/dev-log-2026-07.md` -> `docs/archive/dev-log-2026-07.md`

**Modify:**

- `docs/design.md`
- `README.md`
- `README.en.md`
- `AGENTS.md`
- `docs/agents/main.md`
- `docs/agents/dev-v2.md`
- `docs/agents/dev-app-platform.md`
- `docs/agents/feature-ui-art-overhaul.md`
- `docs/agents/refactor-ui-foundation.md`

### Task 1: Capture repository facts and private-file guard

**Files:**
- Read: `src/config/upgrades.js`
- Read: `src/config/meta.js`
- Read: `src/main.js`
- Read: `src/scene/menus.js`
- Read: `src/scene/systems.js`
- Read: `src/scene/world.js`
- Read: `src/assets/manifest.js`
- Read: `package.json`
- Protect: `docs/portfolio-review.md`

**Interfaces:**
- Consumes: current code and Git state.
- Produces: verified facts used by current-design and repository-map documents.

- [ ] **Step 1: Record tracked files and private-file state**

Run:

```powershell
git status --short --branch
git ls-files | Sort-Object
git check-ignore -v docs/portfolio-review.md
if (Test-Path docs/portfolio-review.md) {
  Get-FileHash -Algorithm SHA256 docs/portfolio-review.md
}
```

Expected: main is clean apart from the committed plan history; portfolio review is
ignored, is not returned by `git ls-files`, and its hash is recorded for final comparison.

- [ ] **Step 2: Verify current implemented systems**

Run:

```powershell
rg -n "key:|isMutation:" src/config/upgrades.js
rg -n "META_STORAGE_KEY|META_PERKS|loadMetaProgress|saveMetaProgress" src/config/meta.js
rg -n "createStartScreen|showPauseOverlay|scene.restart|awardRunCredits" src/scene
rg -n "PreloadScene|AudioManager|UIManager|scene: \[" src/main.js
rg -n "IMAGE_ASSETS|SPRITESHEET_ASSETS|ATLAS_ASSETS|AUDIO_ASSETS|TEXTURES" src/assets/manifest.js
```

Expected facts:

- 16 upgrade definitions: 13 earlier numeric/mechanic entries plus 3 mutations;
- localStorage meta credits and four perks exist;
- title, pause, restart, reroll/skip, and result flows exist;
- `PreloadScene -> PrototypeScene`, `AudioManager`, `UIManager`, manifest, and fallback architecture exist;
- real asset arrays are currently empty and procedural fallback remains active.

- [ ] **Step 3: Lock official licensing sources**

Use these official sources only for the new policy document:

- SCP Foundation Licensing Guide: `https://scp-wiki.wikidot.com/licensing-guide`
- SCP Foundation Image Use Policy: `https://scp-wiki.wikidot.com/image-use-policy`
- Creative Commons BY-SA 3.0 deed: `https://creativecommons.org/licenses/by-sa/3.0/`
- Repository code license: `LICENSE`

Expected: no legal conclusion is inferred beyond the sources; uncertain commercial
release questions are assigned to fresh official-source and professional review.

### Task 2: Create authoritative core documents and repository map

**Files:**
- Create: `docs/product-vision.md`
- Create: `docs/development-strategy.md`
- Create: `docs/art-and-asset-direction.md`
- Create: `docs/licensing-and-commercialization.md`
- Create: `docs/README.md`

**Interfaces:**
- Consumes: approved background and Task 1 facts/sources.
- Produces: one authority for product intent, work lanes, art/assets, licensing risk, and repository classification.

- [ ] **Step 1: Create `docs/product-vision.md`**

Use exactly these top-level sections:

```markdown
# SCP Survivor 产品愿景

> 权威范围：产品目的、SCP 差异化原则与重大功能判断标准。

## 为什么选择 SCP 世界观
## 不能成为普通割草游戏的换皮版本
## SCP 驱动的体验支柱
## 功能提案的四个问题
## 已确认方向
## 尚未批准的长期设想
## 决策优先级
## 最终决策权
```

Preserve all supplied product principles. Make the four questions and seven
priorities numbered lists. Clearly say unapproved ideas may be analyzed but not
implemented.

- [ ] **Step 2: Create `docs/development-strategy.md`**

Use exactly these top-level sections:

```markdown
# 开发策略与并行路线

> 权威范围：当前开发路线、分支职责关系与里程碑授权边界。

## 稳定版本保护
## 为什么 App Platform 与 v2 并行
## 四条工作流
## 合并与发布原则
## 已批准的近期方向
## 未批准事项的处理方式
```

Describe `dev/v2`, `dev/app-platform`, `feature/ui-art-overhaul`, and frozen UI
Foundation. State that this document authorizes lanes, not individual features.

- [ ] **Step 3: Create `docs/art-and-asset-direction.md`**

Use exactly these top-level sections:

```markdown
# UI、美术、音频与资源方向

> 权威范围：视觉目标、混合资源策略、资源优先级与外部素材准入。

## 目标体验
## 当前程序化原型的价值与限制
## 混合资源原则
## 正式素材优先范围
## 程序化生成保留范围
## 第一轮升级顺序
## 玩法边界
## 外部素材登记要求
```

Require source, author, URL, license, modification status, and commercial-use
status before an external asset enters the production pipeline.

- [ ] **Step 4: Create `docs/licensing-and-commercialization.md`**

Use exactly these top-level sections:

```markdown
# 许可与商业化准备

> 本文是项目政策与风险清单，不构成法律意见。

## 当前阶段
## 可能的商业化方向
## 当前代码许可
## SCP 衍生内容注意事项
## 外部素材准入
## 资源来源登记表
## 商业发布前检查
## 官方参考
```

State only verified source-backed facts: existing published code remains under
its granted MIT terms; SCP-derived work requires attribution/share-alike review;
CC BY-SA 3.0 permits sharing/adaptation including commercial uses subject to its
conditions. Require fresh review before release and link all three official pages.

Include this provenance table schema:

```markdown
| Asset | Type | Author/source | Original URL | License | Modified | Commercial-use status | Notes |
|---|---|---|---|---|---|---|---|
```

- [ ] **Step 5: Create `docs/README.md`**

Use sections:

```markdown
# 项目文档与仓库地图
## 权威文档
## Agent 治理
## 当前源码分类
## 构建、脚本与 CI
## 历史归档
## 设计与实施记录
## 根目录标准文件
## 生成、依赖与本地私有文件
```

Classify all tracked root files and tracked directories by responsibility. State
that `dist/`, `node_modules/`, backups, `.claude/`, and local portfolio review are
generated/ignored/private and are not public project sources.

- [ ] **Step 6: Validate core-document authority and commit**

Run:

```powershell
$required = @(
  'docs/README.md',
  'docs/product-vision.md',
  'docs/development-strategy.md',
  'docs/art-and-asset-direction.md',
  'docs/licensing-and-commercialization.md'
)
foreach ($path in $required) {
  if (-not (Test-Path $path)) { throw "Missing document: $path" }
}
git diff --check
git add $required
git commit -m "docs: add authoritative project direction"
```

Expected: one commit containing exactly the five new authoritative documents.

### Task 3: Archive historical plans and logs

**Files:**
- Move: `docs/roadmap-1.md` -> `docs/archive/roadmap-1.md`
- Move: `docs/roadmap-2.md` -> `docs/archive/roadmap-2.md`
- Move: `docs/v1.0-notes.md` -> `docs/archive/v1.0-notes.md`
- Move: `docs/dev-log-2026-07.md` -> `docs/archive/dev-log-2026-07.md`

**Interfaces:**
- Consumes: the authority documents from Task 2.
- Produces: preserved but visibly non-authoritative historical context.

- [ ] **Step 1: Verify source and destination paths**

Run:

```powershell
$sources = @('docs/roadmap-1.md','docs/roadmap-2.md','docs/v1.0-notes.md','docs/dev-log-2026-07.md')
foreach ($path in $sources) { if (-not (Test-Path $path)) { throw "Missing source: $path" } }
if (Test-Path docs/archive) { throw 'docs/archive already exists; inspect before proceeding' }
```

Expected: all four source files exist and the archive directory does not.

- [ ] **Step 2: Move files with Git history preservation**

```powershell
New-Item -ItemType Directory -Path docs/archive
git mv docs/roadmap-1.md docs/archive/roadmap-1.md
git mv docs/roadmap-2.md docs/archive/roadmap-2.md
git mv docs/v1.0-notes.md docs/archive/v1.0-notes.md
git mv docs/dev-log-2026-07.md docs/archive/dev-log-2026-07.md
```

- [ ] **Step 3: Add the standard archive notice to all four files**

Insert directly after each title:

```markdown
> **历史归档**：本文可能包含已完成、已删除或已被取代的方案，仅用于追溯设计演进，不是当前批准的任务清单。当前权威来源为 [产品愿景](../product-vision.md)、[当前游戏设计](../design.md)、[开发策略](../development-strategy.md) 以及 Project Lead 的直接指令。
```

- [ ] **Step 4: Validate and commit archive moves**

Run:

```powershell
$archive = Get-ChildItem docs/archive/*.md
if ($archive.Count -ne 4) { throw "Expected 4 archive files, found $($archive.Count)" }
foreach ($file in $archive) {
  if (-not (Select-String -Path $file.FullName -Pattern '历史归档' -Quiet)) {
    throw "Archive notice missing: $($file.FullName)"
  }
}
git diff --check
git add -A docs/archive docs/roadmap-1.md docs/roadmap-2.md docs/v1.0-notes.md docs/dev-log-2026-07.md
git commit -m "docs: archive superseded roadmaps and notes"
```

Expected: one commit with four renames and four archive notices.

### Task 4: Rewrite current game design from verified code facts

**Files:**
- Modify: `docs/design.md`

**Interfaces:**
- Consumes: Task 1 code facts and the current v1.3 source tree.
- Produces: the authoritative current-version behavior document.

- [ ] **Step 1: Rewrite the document with current-only sections**

Use these sections:

```markdown
# SCP Survivor 当前游戏设计
## 文档边界
## 当前核心循环
## 胜负与流程状态
## 六分钟时间轴
## 武器与质变
## 升级、重抽与跳过
## 敌人、精英与 SCP-049
## 拾取物与异常物品
## 元进度与解锁商店
## UI、暂停与输入
## 当前资源与音频架构
## 当前代码结构
## 当前版本明确不包含
## 相关权威文档
```

Document only verified behavior. State 16 upgrade definitions including 3
mutations, four meta perks, title/pause/restart flows, Preload/manager/fallback
architecture, and current single Gameplay Scene composition. Do not reintroduce
future roadmap ideas.

- [ ] **Step 2: Cross-check current-design claims**

Run:

```powershell
rg -n "16|质变|元进度|PreloadScene|AudioManager|UIManager|暂停|标题" docs/design.md
rg -n "isMutation|META_PERKS|PreloadScene|AudioManager|UIManager|showPauseOverlay|createStartScreen" src
git diff --check -- docs/design.md
```

Expected: every major new claim has a visible code counterpart.

- [ ] **Step 3: Commit current design**

```powershell
git add docs/design.md
git commit -m "docs: align game design with current implementation"
```

Expected: one commit modifying only `docs/design.md`.

### Task 5: Update README and Agent navigation

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `AGENTS.md`
- Modify: `docs/agents/main.md`
- Modify: `docs/agents/dev-v2.md`
- Modify: `docs/agents/dev-app-platform.md`
- Modify: `docs/agents/feature-ui-art-overhaul.md`
- Modify: `docs/agents/refactor-ui-foundation.md`

**Interfaces:**
- Consumes: Tasks 2-4 documents.
- Produces: concise public navigation and mandatory Agent reading routes.

- [ ] **Step 1: Replace README document lists**

Both README files must link:

- `docs/README.md` as the full documentation map;
- `docs/product-vision.md`;
- `docs/design.md`;
- `docs/development-strategy.md`;
- `docs/art-and-asset-direction.md`;
- `docs/licensing-and-commercialization.md`;
- `CHANGELOG.md`.

Remove active links to root-level roadmap/history paths. Update the English
architecture section so it no longer claims all logic lives in one `main.js`.

- [ ] **Step 2: Add product-direction reading rules to `AGENTS.md`**

After branch-guide startup, require feature-planning Agents to read
`docs/product-vision.md` and `docs/development-strategy.md`. State explicitly that
`docs/archive/` and `docs/superpowers/` are not automatic task sources.

- [ ] **Step 3: Add branch-specific required-reading sections**

Use these mappings:

| Guide | Required authoritative documents |
|---|---|
| `main.md` | product vision, current design, development strategy |
| `dev-v2.md` | product vision, current design, development strategy |
| `dev-app-platform.md` | product vision, development strategy, licensing/commercialization |
| `feature-ui-art-overhaul.md` | product vision, development strategy, art/asset direction, licensing/commercialization |
| `refactor-ui-foundation.md` | development strategy and current design when a fix is authorized |

Links are relative from `docs/agents/`, for example `../product-vision.md`.

- [ ] **Step 4: Validate and commit navigation**

Run:

```powershell
rg -n "product-vision|development-strategy|art-and-asset-direction|licensing-and-commercialization" README.md README.en.md AGENTS.md docs/agents
rg -n "roadmap-1|roadmap-2|v1.0-notes|dev-log-2026-07" README.md README.en.md
git diff --check
git add README.md README.en.md AGENTS.md docs/agents
git commit -m "docs: route readers and agents to authoritative docs"
```

Expected: authoritative links exist, archived paths are absent from public
landing-page navigation, and only README/governance Markdown changes.

### Task 6: Validate links, private files, scope, and build

**Files:**
- Verify: all tracked Markdown files.
- Protect: `docs/portfolio-review.md`.

**Interfaces:**
- Consumes: all documentation tasks.
- Produces: final evidence for publication and branch synchronization.

- [ ] **Step 1: Validate relative Markdown links**

Run a PowerShell link check over tracked Markdown files. For every Markdown link:

- ignore `http://`, `https://`, `mailto:`, and fragment-only targets;
- strip URL fragments from local targets;
- resolve paths relative to the containing Markdown file;
- fail when the resolved tracked/local file does not exist.

Expected: zero broken relative links.

- [ ] **Step 2: Verify private-file preservation**

```powershell
git check-ignore -v docs/portfolio-review.md
git ls-files docs/portfolio-review.md
if (Test-Path docs/portfolio-review.md) {
  Get-FileHash -Algorithm SHA256 docs/portfolio-review.md
}
```

Expected: still ignored, still untracked, and SHA256 equals Task 1.

- [ ] **Step 3: Verify documentation-only scope and formatting**

```powershell
git diff --check origin/main...main
git diff --name-only origin/main...main
git status --short --branch
```

Expected: only Markdown/documentation paths changed and the worktree is clean.

- [ ] **Step 4: Run production build**

```powershell
npm.cmd run build
```

Expected: 27 modules transform successfully; only the existing large-bundle
warning appears.

### Task 7: Push main and synchronize active worktrees

**Files:**
- Worktrees: main, `dev/v2`, `dev/app-platform`, `feature/ui-art-overhaul`, frozen UI Foundation.

**Interfaces:**
- Consumes: verified documentation commits.
- Produces: identical documentation authority across all Agent worktrees.

- [ ] **Step 1: Fetch, verify ancestry, and push main**

```powershell
git fetch origin --prune
git merge-base --is-ancestor origin/main main
if ($LASTEXITCODE -ne 0) { throw 'origin/main is not an ancestor of main' }
git push origin main
```

- [ ] **Step 2: Fast-forward and push active development branches**

For `C:\scp-survivor-workspaces\active\gameplay-v2`, `C:\scp-survivor-workspaces\active\app-platform`, and
`C:\scp-survivor-workspaces\active\ui-art`: verify clean status, run `git merge --ff-only main`,
run `npm.cmd run build`, and push the current branch.

- [ ] **Step 3: Fast-forward frozen UI Foundation locally**

In `C:\scp-survivor-workspaces\frozen\ui-foundation`, verify clean status and run
`git merge --ff-only main`. Do not create or push a remote foundation branch.

- [ ] **Step 4: Final topology and status audit**

```powershell
git fetch origin --prune
git worktree list --porcelain
git branch --all --verbose --no-abbrev
git status --short --branch
git -C C:\scp-survivor-workspaces\active\gameplay-v2 status --short --branch
git -C C:\scp-survivor-workspaces\active\app-platform status --short --branch
git -C C:\scp-survivor-workspaces\active\ui-art status --short --branch
git -C C:\scp-survivor-workspaces\frozen\ui-foundation status --short --branch
```

Expected: all worktrees are clean and all active remote-tracking branches point
to the final documentation commit.
