# 项目文档与仓库地图

本文是仓库的统一分类与文档导航。不同文档具有不同权威范围；历史归档和实施记录不会自动成为开发任务。

## 权威文档

- [产品愿景](./product-vision.md)：产品目的、SCP 差异化与重大功能判断标准。
- [当前游戏设计](./design.md)：当前代码已经实现的玩法与流程。
- [当前项目状态](./project-status.md)：区分正式发布、`main` 未发布内容、开发分支候选与剩余门禁。
- [开发策略](./development-strategy.md)：批准的开发路线、分支关系与授权边界。
- [UI、美术、音频与资源方向](./art-and-asset-direction.md)：表现目标与混合资源策略。
- [许可与商业化准备](./licensing-and-commercialization.md)：许可事实、素材门禁与发布风险。
- [更新日志](../CHANGELOG.md)：已经发布的版本变化。

## Agent 治理

- [`AGENTS.md`](../AGENTS.md)：所有 Agent 的权威协作规则与分支路由。
- [`CLAUDE.md`](../CLAUDE.md)：Claude Code 入口。
- [`docs/agents/`](./agents/)：main、v2、App Platform、UI Foundation 与 UI/Art 的分支手册。

Agent 手册只定义权限和交付要求，产品方向仍以本页列出的权威文档为准。

## 当前源码分类

### 入口与场景组装

- `src/main.js`：组装 `PrototypeScene`，注册 Preload、Audio 和 UI 管理器。
- `src/scenes/PreloadScene.js`：加载 manifest 资源并生成缺失 fallback。

### 配置与持久化

- `src/config/constants.js`：视口、世界和空间网格常量。
- `src/config/balance.js`：玩法数值与时间轴配置。
- `src/config/upgrades.js`：升级与质变定义。
- `src/config/meta.js`：localStorage 元进度和永久 perk。

### Gameplay Scene 领域模块

- `src/scene/world.js`：场地、玩家、物理组和碰撞器。
- `src/scene/enemies.js`：刷怪、AI、精英、Boss 和空间查询。
- `src/scene/weapons.js`：武器、弹丸和武器质变。
- `src/scene/combat.js`：伤害、碰撞、击退和掉落。
- `src/scene/progression.js`：经验、升级、拾取和元进度奖励。
- `src/scene/timeline.js`：六分钟阶段与设施事件。
- `src/scene/effects.js`：战斗视觉效果和声音兼容入口。
- `src/scene/hud.js`：战斗 HUD 与构筑面板。
- `src/scene/menus.js`：标题、选武器、商店、暂停和结算。
- `src/scene/systems.js`：输入、移动、暂停/恢复和清理。

### 资源、UI 与音频基础

- `src/assets/manifest.js`：资源 key 与加载清单。
- `src/assets/fallbackTextureFactory.js`：程序化 fallback 纹理。
- `src/audio/AudioManager.js`：Web Audio 程序化音频管理。
- `src/ui/UIManager.js`：Phase 1 UI 转发接口。
- `src/ui/theme.js`：UI Theme token 目录。

## 构建、脚本与 CI

- `index.html`：Web 入口与页面基础样式。
- `package.json` / `package-lock.json`：依赖、版本与 npm 命令。
- `scripts/balance-sim.mjs`：平衡模拟。
- `scripts/phase1-cleanup.mjs`：早期整理脚本。
- `.github/workflows/ci.yml`：main/PR 测试与构建检查。

## 历史归档

`docs/archive/` 保存旧 Roadmap、v1.0 分析和开发记录，只用于追溯设计演进。归档内容不是当前批准的任务来源。

## 设计与实施记录

`docs/superpowers/specs/` 和 `docs/superpowers/plans/` 保存已讨论的设计与实施过程。它们用于审计决策，但只有已批准且仍适用的计划才能授权工作；其内容不能覆盖产品愿景、当前设计或 Agent 治理。

## 根目录标准文件

- `README.md` / `README.en.md`：中英文公开项目首页。
- `CHANGELOG.md`：版本更新记录。
- `LICENSE`：当前仓库代码许可。
- `.gitignore`：依赖、构建产物、工具目录、备份和私有评审文件排除规则。

## 生成、依赖与本地私有文件

- `node_modules/`：安装依赖，不进入 Git。
- `dist/`：生产构建产物，不进入 Git。
- `backup_*/`：本地备份，不进入 Git。
- `.claude/`、`.vscode/`、`.idea/`：本地工具配置，不进入 Git。
- `docs/portfolio-review.md`：本地私有评审资料，忽略且不得公开提交。
