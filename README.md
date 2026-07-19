# SCP 幸存者 (SCP Survivor)

**简体中文** · [English](./README.en.md)

[![Play](https://img.shields.io/badge/▶️_立即游玩-在线_Demo-4da07b)](https://dist-chi-ten-47.vercel.app)
[![CI](https://github.com/v-t-x/scp-survivor/actions/workflows/ci.yml/badge.svg)](https://github.com/v-t-x/scp-survivor/actions/workflows/ci.yml)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-8a2be2)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vitejs.dev/)
[![许可：MIT + CC BY-SA 3.0](https://img.shields.io/badge/许可-MIT%20%2B%20CC%20BY--SA%203.0-blue)](./LICENSE)

> 2D 俯视角 Survivors-like 单局原型。基金会安保官在 6 分钟收容失效时间轴中战斗、升级、处理设施干扰，并在终局对抗 SCP-049。

> **版本状态：** 最新版本为 [v1.6.0 — 收容区焕新](./docs/releases/v1.6.0.md)。它在 v1.5 的六分钟玩法与 SCP-049 终局战基础上，统一升级标题、武器库、战术 HUD、设施环境、角色、敌人与终端界面。在线 Demo 尚未核对是否与 v1.6.0 一致，不作为本版本已经部署的证明；Electron 与 Windows 安装包不属于本版本。详见 [当前项目状态](./docs/project-status.md)。

项目使用 Phaser 3、Vite 和原生 JavaScript。正式像素素材现已进入运行时，覆盖设施、界面、玩家、R-17 敌人与 SCP-049；程序化纹理和 Web Audio 合成音效仍用于素材缺失时的 fallback 与动态表现。

**在线试玩：[https://dist-chi-ten-47.vercel.app](https://dist-chi-ten-47.vercel.app)**

## 快速开始

```bash
npm install
npm test
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
  → 4:00 出现急救包
  → 6:00 清场并迎战 SCP-049
  → 胜利或失败后结算学分并重新开始
```

当前包含：

- 3 把武器，以及每把武器 1 个一次性质变；
- 16 个升级定义、每局 3 次重抽和跳过回血；
- 3 种普通敌人、3 种精英和 SCP-049 Boss；
- 6 分钟时间轴、电力故障、感知干扰、战斗兴奋剂和急救包；
- localStorage 学分元进度与 4 个永久起始加成；
- 基金会终端式标题与武器库、战术 HUD，以及统一的构筑、暂停、升级和结算界面；
- 入口、战斗、维护和污染设施区域，以及随断电、事件与 Boss 阶段变化的环境表现；
- 玩家与七类 R-17 敌人的正式像素动画、SCP-049 的正式像素素材，以及池化战斗反馈。

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

- 独立创作的软件代码按 MIT License 提供；项目生成的视觉/视听素材、创意表达和 SCP 衍生内容按 CC BY-SA 3.0 提供；
- 路径级范围见 [LICENSE-MAP.md](./LICENSE-MAP.md)，SCP 与 SCP-049 的公开署名见 [ATTRIBUTION.md](./ATTRIBUTION.md)；
- 项目尚未宣布商业发行。本次源码许可选择不代表未来商业发行审查已经完成。

详细政策、官方来源和免责声明见 [许可与商业化准备](./docs/licensing-and-commercialization.md)。
