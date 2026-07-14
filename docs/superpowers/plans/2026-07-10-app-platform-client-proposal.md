# App Platform 多客户端架构提案

**状态：** 上位多平台架构与 Windows Electron 路线已批准；实施仍须通过已记录的 Level 2 / Project Lead 执行门禁
**范围：** Windows 首个客户端验证与长期多客户端边界
**上位设计：** `docs/superpowers/specs/2026-07-14-multi-platform-client-design.md`
**不在本轮范围：** 依赖、客户端脚手架、安装包、签名、自动更新、商店、公开下载、CI、游戏代码或共享入口修改

## 1. 决策摘要

已批准首个 Windows proof of concept（PoC）使用 **Electron**，但把它放在独立的
`clients/desktop-electron/` 边界中，不把 Electron API、Node.js 或打包逻辑暴露给
游戏代码。PoC 直接消费现有 `npm run build` 生成的 `dist/`，通过稳定的
`app://scp-survivor/` 自定义协议加载构建产物；不修改根 `package.json`、
`package-lock.json`、`index.html`、Vite 配置、CI 或游戏源代码。

选择 Electron 的原因不是它适合所有客户端，而是当前 Windows 验证最需要：

- 与 Phaser 现有浏览器行为一致的固定 Chromium 运行时；
- 对 WebGL、Canvas、Web Audio 和 `localStorage` 的低迁移风险；
- 可在独立目录内验证窗口、生命周期、离线和安全边界；
- 可以先得到可靠 Windows 证据，再决定是否值得用 Tauri 换取更小体积。

长期不统一强迫所有平台使用同一 wrapper：

- Windows 桌面 PoC：Electron；
- 移动端候选：Capacitor（只在移动工作流获批后验证）；
- installable Web：PWA（独立的 Service Worker 与安装责任）；
- launcher：独立安装、更新和启动产品，不承载游戏语义；
- 未来平台容器：只实现稳定的客户端能力合同。

上位设计已批准多平台架构和 Windows Electron 路线；本提案不重新请求该技术决策。
实际实施仍须遵守上位设计、`AGENTS.md` 的 Level 2 / Project Lead 门禁，并为依赖、
打包工具和任何共享文件变更取得所需的单独批准。

## 2. 当前 Web 客户端事实审计

### 2.1 构建与启动

| 项目 | 当前事实 | 客户端影响 |
|---|---|---|
| Web 栈 | Phaser `3.90.0`；根 manifest 声明 Vite `^7.0.2`，lockfile 当前解析为 `7.3.6` | wrapper 应消费构建产物，不重新实现游戏启动 |
| Node 基线 | CI 使用 Node 20、`npm ci`、`npm run build` | 客户端构建至少先以 Node 20 为可复现基线 |
| Vite 配置 | 仓库没有 `vite.config.*`，因此采用默认 `base: "/"` 与默认 `outDir: "dist"` | 直接 `file://` 加载可能把 `/assets/...` 解析到磁盘根；PoC 不应假设 `loadFile()` 可用 |
| HTML 入口 | `index.html` 的开发入口是 `/src/main.js`；`#app` 为 Phaser 父容器 | 构建后入口必须保持同一个 DOM 与启动顺序 |
| Phaser 启动 | `new Phaser.Game(config)`；`Phaser.AUTO`；固定画布 `960 × 540` | 必须分别观察 WebGL 和 Canvas fallback；窗口不得裁切画布 |
| Scene 顺序 | `PreloadScene` 先运行，再进入 `PrototypeScene` | wrapper 不得绕过 preload 或直接启动游戏 Scene |
| 构建输出 | Vite `7.3.6` 的当前生产构建转换 29 个模块，输出 `dist/index.html` 与 `dist/assets/index-CPdPwNhc.js`；`dist/` 被根 `.gitignore` 忽略 | 实施时把该已验证的输出作为 staging 输入；每次构建仍须重新确认实际 hashed asset |
| CI | 仅在 Ubuntu 上构建 `main`；没有 Windows、打包或 smoke job | PoC 可本地验证；增加 Windows CI 必须另行审批 |
| 版本元数据 | `package.json` 为 `1.3.0`，lockfile 根 package 元数据仍为 `0.1.0` | 属于既有不一致；本提案不修复，正式打包前必须由 Project Lead 指定版本权威来源 |

### 2.2 资源、网络与离线

| 项目 | 当前事实 | 客户端影响 |
|---|---|---|
| 资源清单 | 图片、spritesheet、atlas、音频数组当前均为空 | 当前 PoC 主要验证程序化 fallback；不能据此推断未来真实资源路径已安全 |
| 纹理 | 由 `fallbackTextureFactory` 在运行时生成 | 不依赖外部文件，适合首轮离线验证 |
| 未来资源路径 | `PreloadScene` 直接把 manifest 中的 `path` 传给 Phaser loader | 增加真实资源后必须重新测试相对路径、协议 URL 与打包完整性 |
| 外部请求 | 游戏源代码中未发现 `fetch`、XHR、WebSocket 或硬编码远程 URL | 当前游戏可按“无网络依赖”验证；依赖下载和 WebView/runtime 安装不属于游戏运行时 |
| Service Worker | 当前没有 PWA manifest 或 Service Worker | 浏览器离线与可安装性尚未实现，不能把桌面包离线通过等同于 PWA 离线通过 |

### 2.3 音频、持久化与生命周期

| 项目 | 当前事实 | 必须保留的合同 |
|---|---|---|
| 音频 | 使用 `window.AudioContext`，首次播放时惰性创建；suspended 时调用 `resume()` | 首次用户交互后必须可听；无交互自动播放不作为要求 |
| 音频清理 | Scene `SHUTDOWN`/`DESTROY` 调用 `AudioManager.destroy()`，关闭 context | restart 不得累积 AudioContext；关闭窗口不得留下进程 |
| 持久化 | key 为 `scp-survivor-meta`，存于 `window.localStorage` | PoC 必须提供稳定 origin，跨重启保留现有 key 和 JSON 格式 |
| 存储失败 | get/set 均有 `try/catch`，失败时退化为默认或内存状态 | 权限或存储异常不得阻止启动，但应在测试记录中显式标注“不持久” |
| 页面生命周期 | 游戏没有 `beforeunload`、`visibilitychange`、online/offline 等页面级处理 | PoC 只验证现状；最小化暂停、后台恢复等语义不能由 wrapper 擅自新增 |
| Scene 生命周期 | 每次 restart 重建 Audio/UI manager，并有幂等 teardown | wrapper 不得通过 reload/多窗口制造第二个并行游戏实例 |

### 2.4 安全敏感事实

- 当前 `index.html` 没有 Content Security Policy。
- 游戏 renderer 不需要 Node.js、文件系统、shell、剪贴板、通知或远程网络权限。
- renderer 只需要普通浏览器能力：DOM、Canvas/WebGL、Web Audio 和
  `localStorage`。
- 因此 Electron PoC 应采用最小权限：`nodeIntegration: false`、
  `contextIsolation: true`、`sandbox: true`，不配置 preload，不暴露 IPC。
- 仅允许 app 自身协议；拒绝新窗口、导航到外部 origin 和所有未声明权限请求。
- 不加载远程代码，不使用 `<webview>`，不关闭 Chromium sandbox。

Electron 官方安全指南同样要求保持 Electron 更新、禁用 renderer Node 集成、启用
context isolation 和 sandbox：
<https://www.electronjs.org/docs/latest/tutorial/security>。

## 3. 平台路线比较

评分采用 1–5：1 表示对本项目首轮目标明显不适合，5 表示直接满足且风险最低。
分数只用于当前项目决策，不表示工具的通用优劣。

| 维度 | Electron | Tauri 2 | PWA | Capacitor 路线 |
|---|---:|---:|---:|---:|
| Windows 启动可靠性 | 5 | 4 | 3 | 1 |
| bundle 体积 | 1 | 5 | 5 | 3 |
| Node/额外 runtime 需要 | 3 | 3 | 5 | 4 |
| Phaser 兼容性 | 5 | 4 | 5 | 4 |
| 文件系统能力 | 5 | 4 | 2 | 4 |
| Web Audio 行为可预测性 | 5 | 4 | 4 | 4 |
| 离线运行 | 5 | 4 | 4 | 4 |
| 安全面 | 3 | 4 | 5 | 3 |
| Windows installer 工作量 | 4 | 4 | 5 | 1 |
| 移动复用 | 1 | 3 | 5 | 5 |
| CI 复杂度 | 3 | 2 | 4 | 2 |
| 团队可维护性 | 4 | 2 | 5 | 3 |

### 3.1 极端分数说明

**Electron**

- Windows 启动可靠性 5：固定 Chromium 随应用分发，不依赖目标机器的 WebView
  版本，最接近当前 Vite/Phaser 的已知浏览器运行环境。
- bundle 体积 1：必须分发 Electron/Chromium/Node 运行时，明显大于系统 WebView
  或纯 Web 方案。
- Phaser 兼容性、文件系统、音频、离线均为 5：Chromium 直接运行现有 Web
  artifact，主进程将来可提供受限原生能力，且整个运行时和游戏文件可随包分发。
- 移动复用 1：Electron 不是 iOS/Android 容器，桌面 wrapper 不能直接复用于移动。

**Tauri 2**

- bundle 体积 5：应用复用系统 WebView2，wrapper 自身体积最小。
- 未给 Windows 启动可靠性 5：目标机 WebView2 的存在、版本和安装模式是额外变量。
  Tauri 可下载、嵌入 bootstrapper、嵌入约 127 MB offline installer 或固定 runtime，
  这些模式必须按离线与分发目标选择：
  <https://v2.tauri.app/distribute/windows-installer/>。

**PWA**

- bundle、无 Node runtime、Phaser 兼容性、安全、installer、移动复用、维护性均为
  5：使用浏览器 sandbox 和原 Web 代码，安装由浏览器处理，不增加 native wrapper。
- 文件系统不是 5：能力受浏览器、权限和 API 可用性限制，不能作为通用 native
  文件系统。
- 离线不是 5：当前仓库没有 Service Worker；必须另外定义缓存版本、更新与回滚。
- PWA 不能完成本阶段“Windows native container 与 installer”验证，因此不作为
  首个 PoC。

**Capacitor 路线**

- Windows 启动可靠性和 installer 工作量均为 1：Capacitor 官方目标是 Android、
  iOS 和 Web，没有官方 Windows 桌面平台；Windows 通常需要社区 Electron 平台，
  反而增加中间层。
- 移动复用 5：它正是本项目未来 iOS/Android wrapper 的主要候选。
- 官方平台范围：
  <https://capacitorjs.com/docs/getting-started/environment-setup>。

### 3.2 推荐与拒绝理由

**推荐：Electron Windows PoC。**

首轮验证的未知量应集中在“现有游戏能否稳定作为 Windows 客户端运行”，而不是同时
引入 Rust、系统 WebView 差异或移动插件模型。Electron 能先固定 renderer 环境，
验证结果更容易归因。

**暂不选择 Tauri：** 体积优势真实，但当前团队尚无已证明的 Rust/Tauri 维护路径；
WebView2 版本与离线安装策略也会增加首轮变量。Electron PoC 成功后，可把同一
验证清单用于 Tauri spike，比较实际启动、音频、GPU、体积和维护成本。

**不以 PWA 代替：** PWA 应单独建设，但无法验证 native 进程退出、Windows
installer/uninstaller、签名和桌面安全配置。

**不以 Capacitor 做 Windows：** 官方不提供 Windows target。它应留给未来移动
验证，而不是通过社区 Electron adapter 间接完成本次桌面目标。

## 4. Windows PoC 定义

### 4.1 最低目标环境

- Windows 10/11 x64，处于 Microsoft 支持范围并安装当前系统更新；
- Node 20 仅用于构建，不要求最终用户安装 Node；
- 无管理员权限的普通用户启动；
- 首轮只验证 x64；ARM64、Windows 7/8、macOS 和 Linux 明确不在范围；
- 未签名 artifact 仅限内部验证，SmartScreen 警告不是可发布状态。

### 4.2 预期 artifact

首轮 PoC 应产生：

1. 一个未签名的 Windows x64 unpacked 应用目录，用于快速诊断；
2. 一份记录 Electron、Chromium、Node、根游戏 commit 和构建时间的 manifest；
3. 一份逐项 smoke 结果，不把“能打开窗口”当成完整通过。

具体 packager（优先评估 Electron Forge）及其版本必须在实施计划中锁定。installer、正式名称、
图标、publisher、签名证书、更新 URL、商店 identity 和公开下载不属于 PoC。

### 4.3 刻意不包含

- 自动更新、launcher、差分下载、崩溃上报、遥测；
- 文件系统、shell、native menu、托盘、系统通知或全局快捷键；
- 多窗口、云存档、账号、跨设备同步；
- installer、签名、公证、商店提交或公开下载；
- 游戏、UI、音频、资源或持久化格式修改。

## 5. 平台边界

### 5.1 拟议目录

以下为已批准边界下的拟议实施状态，当前任务不创建：

| 路径 | 状态/所有者 | 作用 |
|---|---|---|
| `clients/desktop-electron/` | 新建；App Platform | Windows 首个桌面容器 |
| `clients/desktop-electron/package.json` | 新建；App Platform | Electron 与 packager 依赖，不污染根 manifest |
| `clients/desktop-electron/package-lock.json` | 新建；App Platform | wrapper 独立、可复现的依赖图 |
| `clients/desktop-electron/src/main.mjs` | 新建；App Platform | 单窗口、生命周期和安全策略 |
| `clients/desktop-electron/src/app-protocol.mjs` | 新建；App Platform | 安全映射 `app://scp-survivor/` 到 staged web build |
| `clients/desktop-electron/forge.config.mjs` | 新建；App Platform | Windows x64 unpacked PoC 的打包配置 |
| `clients/desktop-electron/scripts/stage-web.mjs` | 新建；App Platform | 校验并复制根 `dist/`，写入 provenance manifest |
| `clients/desktop-electron/test/` | 新建；App Platform | 协议路径、安全配置和 packaged smoke |
| `clients/desktop-electron/.gitignore` | 新建；App Platform | 只忽略本目录 staging/out，不修改根 `.gitignore` |
| `clients/mobile-capacitor/` | 未来新建；未批准 | Android/iOS wrapper |
| `clients/pwa/` | 未来新建；未批准 | manifest、Service Worker 与缓存策略 |
| `clients/launcher/` | 未来新建；未批准 | 安装、更新、校验和启动 |
| `clients/contracts/` | 未来新建；需审批 | 仅在两个以上客户端需要机器可读合同后再建立 |

生成目录如 `clients/desktop-electron/.web-dist/`、`out/` 和临时 package 目录必须由
该客户端自己的 `.gitignore` 忽略，不提交构建产物。

### 5.2 Web artifact 合同

wrapper 只消费，不改写根 `dist/`：

1. 在根目录执行标准 `npm run build`；
2. staging 脚本要求存在 `dist/index.html`，拒绝空目录和越界 symlink；
3. 完整复制 `dist/` 到客户端私有 staging 目录；
4. 记录文件清单、hash、根 commit 和 dirty 状态；
5. package 只读取 staging，不从 `src/` 启动，不启动 Vite dev server；
6. renderer 通过 `app://scp-survivor/index.html` 获得固定 origin；
7. 协议 handler 规范化 URL path，拒绝 `..`、编码绕过和 staging 目录外访问；
8. `/assets/...` 映射到 staged `dist/assets/...`，因此无需本轮修改 Vite `base`；
9. 不向 renderer 暴露 Node、Electron 或 IPC。

固定自定义 origin 是必要合同：随机 localhost 端口会改变 `localStorage` origin，
直接 `file://` 又与当前 Vite 根路径输出不兼容。

### 5.3 共享文件申请

**首个 PoC 的目标是零共享文件变更。**

只有出现以下已验证阻塞时，才向 Project Lead 单独申请：

| 潜在申请 | 触发条件 | 影响分支 | 必须验证 |
|---|---|---|---|
| Vite `base` 或专用 client build mode | 自定义协议无法正确承载实际输出 | 所有消费 Web artifact 的分支 | web preview、所有资源 URL、Electron packaged startup |
| 根 `package.json` convenience script | 仅为统一开发命令，非 PoC 必需 | 所有 npm 用户与 CI | `npm ci`、现有 scripts、lockfile 一致性 |
| `index.html` CSP | 需要同时提升 Web 与客户端策略 | Web、PWA、所有 wrapper | dev/build/preview、Phaser/Web Audio、所有资源 |
| 资源 manifest/path 合同 | UI/Art 加入真实资源后发现协议差异 | UI/Art、Web、所有 wrapper | preload、fallback、离线和 packaged assets |
| persistence schema/adapter | native 存储成为明确需求 | gameplay/meta 与所有客户端 | 旧 key 迁移、回滚、跨版本兼容 |
| Windows CI | 本地 PoC 通过且准备自动化 | CI 与依赖缓存 | clean runner package、artifact、smoke |

不得为了“顺手”把 wrapper scripts、依赖或配置放入根 manifest。

## 6. 多客户端能力矩阵

| 客户端 | 启动 | 生命周期 | 存储 | 音频 | 离线 | 权限 | 更新 | 签名 | 分发 | 游戏合同责任 |
|---|---|---|---|---|---|---|---|---|---|---|
| Desktop wrapper | 启动 packaged web artifact | 单实例、窗口、退出、崩溃边界 | 稳定 origin；默认保留 Web storage | 保留首次交互恢复 | 所有运行文件随包 | 默认拒绝；按能力逐项开放 | PoC 无；正式版另批 | 正式发布必需 | installer/商店另批 | 只承载，不改变语义 |
| Mobile wrapper | 启动 bundled web artifact | pause/resume、后台、OS 回收 | Web storage 或已批准 adapter | 移动 autoplay/中断恢复 | 包内资源与缓存 | OS 声明、最小权限 | 商店版本机制 | 平台签名必需 | App Store/Play 另批 | 只适配输入/生命周期，不改规则 |
| Installable PWA | 浏览器 URL/installed app | 浏览器 tab/app 生命周期 | 浏览器 origin storage | 浏览器手势策略 | Service Worker 版本化缓存 | 浏览器 permission API | Service Worker 更新 | HTTPS 身份，不是 native 签名 | Web hosting/browser install | 不改游戏语义 |
| Launcher | 校验并启动已安装客户端 | 自身进程与子进程管理 | 只存安装/频道/版本元数据 | 不拥有游戏音频 | 缓存 installer/package | 文件与网络需明确授权 | 下载、校验、回滚 | launcher 与 payload 均需签名 | 独立 installer | 不渲染或修改游戏 |
| Future platform container | 实现统一 artifact 接口 | 映射目标平台事件 | 保持 schema 或显式迁移 | 保持用户手势合同 | 声明缓存/包策略 | 最小权限 | 平台特定 | 平台特定 | 平台特定 | adapter 不得隐藏 gameplay change |

共同原则：平台层拥有“如何启动和承载”，游戏层拥有“运行后发生什么”。任何平台
差异都先表现为 capability/adapter，不通过修改伤害、时间、输入规则或胜负条件来
掩盖。

## 7. 生命周期与安全合同

### 7.1 PoC 必须满足

**启动**

- 只创建一个 `BrowserWindow`；ready 后加载固定 app origin。
- `ready-to-show` 前保持隐藏，加载失败必须记录错误并以非零状态退出。
- 禁止 renderer 任意导航、新窗口和下载。
- 默认内容尺寸至少容纳 `960 × 540` canvas；验证 100% 和 125% Windows 缩放。

**退出**

- 关闭最后窗口后 Windows 进程完全退出。
- 不保留 background、tray、updater 或 local server。
- Scene restart、窗口 reload 和应用重启分别验证，不把它们混为同一生命周期。

**本地资源**

- package 后断网仍加载 HTML、JS、程序化纹理和未来声明的本地资源。
- 协议 handler 只提供 staging 根内文件，MIME 类型正确，路径遍历测试必须失败。

**音频**

- 启动页不要求自动播放。
- 第一次明确用户交互进入游戏后，合成音频可听。
- mute 保持现状；restart 后不会重复或耗尽 AudioContext。

**持久化**

- 保持 `scp-survivor-meta` key 与现有 JSON。
- 同一安装跨正常退出/重启保留数据。
- 卸载是否保留 userData 必须记录；PoC 不自行删除用户数据。
- 更换 app id 或 origin 视为存档迁移，必须另批。

**安全默认值**

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- 无 preload、无 IPC、无 remote content、无 `<webview>`
- permission request/check 默认拒绝
- 导航仅允许 `app://scp-survivor/`
- 禁止 shell open、外部 protocol 和任意文件读取
- 在 wrapper 响应层设置并测试最小 CSP；不修改本轮 `index.html`
- package 前执行依赖审计并记录风险，不自动声称“零漏洞”

### 7.2 正式发布才需要

- 稳定 app id、产品名、publisher 与版本权威来源；
- installer 的制作、安装/卸载验证、升级/降级与企业部署策略；
- 代码签名证书、时间戳、SmartScreen reputation 策略；
- 安全更新通道、签名 manifest、回滚和最低支持版本；
- installer 升级/降级、修复安装、静默参数与企业策略；
- 隐私、遥测、崩溃数据和网络披露；
- 第三方依赖、Electron/Chromium、SCP 内容与素材许可清单；
- 商店 identity、审核、付费服务和公开下载授权。

这些项目必须单独审批；PoC 通过不自动批准发布。

## 8. 验证计划

### 8.1 提案阶段

```powershell
npm run build
Get-ChildItem -Recurse -File dist | Select-Object FullName,Length
git diff --check
git status --short --branch
git diff --stat
```

预期：

- Vite production build 成功；
- `dist/index.html` 与 hashed `dist/assets/*` 存在；
- 本轮 Git diff 只有本提案文件；
- 没有修改 manifest、lockfile、HTML、CI 或源码。

### 8.2 已批准路线下的 Electron PoC

| 验证 | 操作 | 通过观察 |
|---|---|---|
| Web baseline | `npm run build` 后运行 `npm run preview` | 浏览器启动、开始游戏、移动/攻击、音频和 meta storage 正常 |
| Staging | 从干净 checkout 构建并运行 stage | 只复制 `dist/`；manifest 记录 commit/hash；缺文件时失败 |
| Dev client | 启动 Electron wrapper | 单窗口、无 Node API、固定 app origin、无 console/security error |
| Unpacked startup | 启动 unpacked 应用目录中的 exe | 无 dev server/网络仍进入开始页；画布不裁切 |
| Clean exit | 开始游戏后关闭窗口 | 所有应用进程退出，无后台残留 |
| Local assets | 断网并检查 protocol 请求 | HTML/JS/纹理/音频全部本地；未知路径失败 |
| First-interaction audio | 启动后先等待，再点击进入游戏 | 等待阶段无强制 autoplay；交互后声音可听 |
| Restart cleanup | 连续重开游戏至少 10 次 | 无叠音、无 AudioContext 耗尽、无明显资源累积 |
| Persistence | 获得/写入 meta 后退出并重启 | 同一 key/schema 恢复；损坏数据安全回退 |
| Offline | 从 unpacked 应用目录断网冷启动 | 游戏可启动和完成 smoke；无网络错误阻断 |
| Window/DPI | 100%/125% 缩放，最小化/恢复 | `960 × 540` 内容完整；恢复后输入与音频正常 |
| Protocol security | 请求 traversal、外部 origin、新窗口、权限 | 全部拒绝并记录，不泄露任意本地文件 |
| Renderer isolation | DevTools 检查 `process`/`require`/Electron API | renderer 不可访问 privileged API |
| GPU fallback | 检查正常 GPU 与禁用 GPU 的诊断运行 | WebGL 正常；Canvas fallback 是否可玩被明确记录 |

所有失败必须记录实际日志和复现步骤。未执行项目写为“未测试”并成为 follow-up，
不得凭架构推断为通过。

### 8.3 回滚

- PoC 所有实现位于独立 `clients/desktop-electron/`，不改变 Web 启动；
- 未合并前直接放弃该实施提交即可，禁止改写其他分支历史；
- 若 wrapper 依赖共享改动才能运行，先回退该共享改动并保留失败证据；
- unpacked 输出只位于客户端私有的忽略目录；回滚前记录失败证据，不删除 userData；
- 不发布的 unsigned artifact 不上传公共 release 或商店。

## 9. 风险与后续决策

1. **根路径风险：** 当前 Vite 默认 base 为 `/`。提案以自定义 app protocol 解决，
   但必须用实际 hashed output 验证；失败时才申请 Vite shared change。
2. **存储 identity 风险：** protocol host、Electron app id 或 userData path 改变会让
   旧存档看似丢失；这些值一旦进入测试数据就应冻结。
3. **Electron 维护风险：** 固定 Chromium 提升一致性，也带来较大 artifact 和高频
   安全升级责任。
4. **资源阶段风险：** 当前资源数组为空，PoC 不能代表未来图片、atlas 和采样音频
   已经验证。
5. **版本风险：** 根 package 与 lockfile 的 package version 不一致；正式 artifact
   不能在未决定权威来源前对外标版本。
6. **许可风险：** PoC 不包含正式素材，但公开分发前仍需复核 Electron、packager、
   SCP 派生内容和所有资产的许可证与署名。
7. **平台分裂风险：** Electron 的 Node/IPC 能力不得成为游戏依赖，否则 PWA 和
   mobile 会被迫复制桌面假设。

## 10. 实施前的 Level 2 / Project Lead 执行门禁

Windows Electron 路线、独立 `clients/desktop-electron/` 边界和固定
`app://scp-survivor/` origin 均已由上位设计批准，本节不重新请求技术路线决策。

实施开始前必须：

1. 按 `docs/superpowers/specs/2026-07-14-multi-platform-client-design.md` 与
   `AGENTS.md` 的要求完成适用的 Level 2 / Project Lead 执行确认；
2. 将首轮范围保持为内部验证用的 unpacked Windows x64 应用目录，不实现 installer、
   签名、自动更新、商店、公开下载、CI、遥测或任何游戏改动；
3. 在添加依赖、锁定 packager 或申请任何共享文件变更前，取得对应的单独批准；
4. 仅在实际验证证明必要时，申请 Vite、入口、资源合同或持久化等共享文件变更；
5. 将 Tauri 对照 spike、Capacitor、PWA 与其他平台留给各自的后续计划和审批。
