# SCP 幸存者 (SCP Survivor)

**简体中文** · [English](./README.en.md)

[![Play](https://img.shields.io/badge/▶️_立即游玩-在线_Demo-4da07b)](https://dist-chi-ten-47.vercel.app)
[![CI](https://github.com/v-t-x/scp-survivor/actions/workflows/ci.yml/badge.svg)](https://github.com/v-t-x/scp-survivor/actions/workflows/ci.yml)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-8a2be2)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

> 2D 俯视角 Survivors-like 单局原型。基金会安保官在 6 分钟收容失效时间轴中战斗、升级、处理设施干扰，并在终局对抗 SCP-049。

> **版本状态：** 最近正式版本为 `v1.5.0`（SCP-049：疫医狂潮），终局战加入外科狂热、弱点窗口、混合增援和会自我复制的敌潮；`v1.4.0`（收容行动整备）是面向启动、资源兜底和重复开局稳定性的回溯更新。在线 Demo 尚未核对是否与当前标签一致；UI/美术升级和 Windows Electron 客户端仍位于独立开发分支，未作为本版本发布内容。详见 [当前项目状态](./docs/project-status.md)。

项目使用 Phaser 3、Vite 和原生 JavaScript。当前版本没有正式图片或音频素材：纹理由 Phaser 程序化生成，音效由 Web Audio API 实时合成；资源预加载、manifest 和 fallback 接口已经建立，供后续逐步接入正式素材。

**在线试玩：[https://dist-chi-ten-47.vercel.app](https://dist-chi-ten-47.vercel.app)**

## 快速开始

```bash
npm install
node --test
npm run dev
npm run build
npm run preview
```

开发服务器通常运行在 `http://localhost:5173/`，以终端实际输出为准。

## 操作

| 按键 | 功能 |
|---|---|
| `W` `A` `S` `D` | 移动 |
| `Space` | 闪避冲刺，带短暂无敌和冷却 |
| `Tab` | 按住查看当前构筑 |
| `Esc` | 暂停或继续 |
| `M` | 静音或恢复声音 |
| 鼠标 | 选择武器、升级、商店和菜单操作 |

武器自动瞄准并攻击。升级时可三选一、重抽或跳过回血。

## 当前玩法

```text
标题与永久加成商店
  → 三选一武器
  → 移动、自动攻击、拾取经验
  → 升级、质变、重抽或跳过
  → 应对敌种、感知干扰和固定电力故障
  → 4:00 出现 SCP-500
  → 6:00 清场并迎战 SCP-049
  → 胜利或失败后结算学分并重新开始
```

当前包含：

- 3 把武器，以及每把武器 1 个一次性质变；
- 16 个升级定义、每局 3 次重抽和跳过回血；
- 3 种普通敌人、3 种精英和 SCP-049 Boss；
- 6 分钟时间轴、电力故障、感知干扰、战斗兴奋剂和 SCP-500；
- localStorage 学分元进度与 4 个永久起始加成；
- 标题、武器选择、HUD、构筑、暂停、升级和结算流程。

完整实现事实见 [当前游戏设计](./docs/design.md)。产品目标不是只为普通割草玩法更换 SCP 皮肤，长期方向见 [产品愿景](./docs/product-vision.md)。

## 技术与结构

- 引擎：Phaser 3.90，Arcade Physics；
- 构建：Vite 7；
- 语言：JavaScript ES Modules；
- 场景：`PreloadScene` 负责资源与 fallback，随后启动 `PrototypeScene`；
- 架构：配置、Gameplay mixin、资源、音频和 UI 接口分层；
- 持久化：localStorage，失败时安全回退到内存默认值。

```text
scp-survivor/
├── src/
│   ├── main.js              # PrototypeScene 组装与生命周期
│   ├── scenes/              # PreloadScene
│   ├── config/              # 常量、平衡、升级、元进度
│   ├── scene/               # Gameplay 领域 mixin
│   ├── assets/              # manifest、资源 key、fallback 纹理
│   ├── audio/               # AudioManager
│   └── ui/                  # UIManager 与 theme token
├── scripts/                 # 平衡模拟和维护脚本
├── docs/                    # 权威文档、Agent 手册、归档和过程记录
├── .github/workflows/       # CI 测试与构建检查
├── CHANGELOG.md
├── LICENSE
└── package.json
```

完整仓库分类见 [项目文档与仓库地图](./docs/README.md)。

## 文档

- [项目文档与仓库地图](./docs/README.md)
- [当前项目状态](./docs/project-status.md)
- [产品愿景](./docs/product-vision.md)
- [当前游戏设计](./docs/design.md)
- [开发策略与并行路线](./docs/development-strategy.md)
- [UI、美术、音频与资源方向](./docs/art-and-asset-direction.md)
- [许可与商业化准备](./docs/licensing-and-commercialization.md)
- [更新日志](./CHANGELOG.md)

旧 Roadmap、旧版本分析和开发记录位于 `docs/archive/`，只用于历史追溯，不代表当前批准任务。

## 开发方式

项目在不同阶段使用 Cursor、Claude Code 和 Codex 等 AI 编程助手协作开发。项目所有者确认重大产品与架构决定；Agent 的职责边界和交付规则见 [AGENTS.md](./AGENTS.md)。

## 许可证与署名

- 本仓库代码当前采用 [MIT License](./LICENSE)；
- SCP 相关衍生内容需要遵守相应的署名与相同方式共享条件；
- 正式发行前必须逐项复核 SCP 条目、图片、字体、音频和其他外部素材的来源与许可。

详细政策、官方来源和免责声明见 [许可与商业化准备](./docs/licensing-and-commercialization.md)。
