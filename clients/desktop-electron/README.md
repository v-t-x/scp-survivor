# Windows 内部 PoC 验证记录

此目录仅提供未安装的 Windows x64 内部验证包，不包含安装器、签名、自动更新或发布配置。

## 复现命令

在仓库根目录执行：

```powershell
npm.cmd run build
npm.cmd --prefix clients/desktop-electron test
npm.cmd --prefix clients/desktop-electron run stage
npm.cmd --prefix clients/desktop-electron run start
npm.cmd --prefix clients/desktop-electron run package:win
```

打包后的可执行文件位于：

```text
clients/desktop-electron/out/scp-survivor-desktop-electron-win32-x64/scp-survivor-desktop-electron.exe
```

## 2026-07-14 验证结果

自动门禁：根 `npm.cmd run build` 成功；客户端 `npm.cmd --prefix clients/desktop-electron test` 为 7/7 通过；`stage` 成功；`package:win` 成功。未安装目录包含 `resources/.web-dist/index.html`、`build-manifest.json` 与 `app.asar`，总大小约 349.84 MiB，可执行文件约 215.01 MiB。

| 检查项 | 结果 | 实际证据 / 边界 |
| --- | --- | --- |
| 仅一个游戏窗口 | PASS | 开发态和打包态各出现一个标题为“`SCP 幸存者`”的窗口。 |
| 标题画面 | PASS | 打包态窗口加载后可见，标题为“`SCP 幸存者`”。 |
| 能开始一局 | PASS | 打包态依次点击开始、首个武器卡和开始任务，流程未出现加载失败或崩溃。 |
| 键盘移动 | NOT TESTED | 已向运行中的画布发送 `D`，但本次没有可复核的位移读数。 |
| 首次交互音频 | NOT TESTED | 未记录可复核的音频输出。 |
| 静音 | NOT TESTED | 已发送 `M`，但未记录可复核的 HUD/音频状态。 |
| 连续十次 Scene restart | NOT TESTED | 本次冒烟未执行十次重开循环。 |
| 元进度 `scp-survivor-meta` 持久化 | NOT TESTED | 本次冒烟未建立并重启验证存档值。 |
| 离线冷启动 | NOT TESTED | 未在本机验证中切断系统网络；包内资源和 CSP 均为本地协议，但这不能替代离线实测。 |
| 100% DPI | NOT TESTED | 未切换 Windows 缩放比例。 |
| 125% DPI | NOT TESTED | 未切换 Windows 缩放比例。 |
| 关闭后无残留进程 | PASS | 两个运行态均以 `Alt+F4` 关闭；随后未发现本 PoC 的 `electron.exe`、`scp-survivor-desktop-electron.exe`、相关 `npm.cmd` 或 `cmd.exe`。 |
| renderer 中 `process` / `require` 不可用 | NOT TESTED | 自动测试确认 `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`，但未以 DevTools 做运行时读取。 |
| 外部导航被拒绝 | NOT TESTED | 实现中注册 `will-navigate` 与 `setWindowOpenHandler` 拒绝策略；本次未发起真实外部跳转。 |
| 非法 app 路径被拒绝 | PASS | `app-protocol.test.mjs` 已覆盖其他 origin 与编码的父路径，客户端测试 7/7 通过。 |
| 无 Electron 安全警告 | PASS | 开发态和打包态均已启动、进入标题/流程并退出，未观察到安全警告窗口或终端错误。 |

未执行项不应视为通过。它们是后续带人工观察与可控网络/DPI 环境的验收清单，不改变本内部 PoC 的未安装范围。
