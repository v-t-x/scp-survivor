# SCP Survivor 当前项目状态

> 本文记录里程碑状态，不替代 [当前游戏设计](./design.md) 的实现事实，也不自动授权开发中或长期功能。

## 正式发布

- 最近正式版本：`v1.5.0`（SCP-049：疫医狂潮），终局战已加入狂热阶段、暴露承伤窗口、混合增援和敌人递归复制。
- 回溯里程碑：`v1.4.0`（收容行动整备），记录启动、资源 fallback、`AudioManager`、`UIManager` 与重复开局生命周期的稳定性基础。
- 在线 Demo 仅代表其实际部署构建；当前尚未核对其是否与 `v1.5.0` 标签一致，继续按独立部署状态记录。

## main：v1.5.0 发布基线

- 保留 Phaser 3 + Vite、`PreloadScene -> PrototypeScene` 和六分钟单局结构。
- 已集成 SCP-049 狂热状态、暴露承伤窗口、敌人递归复制、230 活动敌人上限和相应 Node 回归测试。
- 根版本元数据为 `1.5.0`，`DEBUG_MODE=false`；正式构建不注册 `B` 跳转。
- 多平台客户端路线与 Windows Electron PoC 已完成设计，但不等于正式客户端发布。

## 开发分支候选

### feature/ui-art-overhaul

- 已实现正式候选设施、菜单、HUD、角色、R-17 敌人、升级图标、终端覆盖层和战斗反馈。
- 仍需完成整体视觉验收、来源与商业发布许可复核。
- 角色动画路线移出当前 UI 垂直切片与 `v1.6.0` 范围，不作为该切片的合并或发布门槛。
- 该分支不得在合并前被 README 描述为当前正式画面。

### dev/app-platform

- 已实现隔离的 Electron Windows PoC、安全 `app://` 资源协议、沙箱窗口和资源 staging。
- 尚未成为正式 Windows 版本；安装器、签名、自动更新和正式发布均不在当前批准范围。

### dev/v2 与 refactor/ui-foundation

- `dev/v2` 的当前玩法成果已经进入 `main`，分支保留作玩法职责边界。
- `refactor/ui-foundation` 已冻结，仅接受明确批准的维护。

## 合并与发布门禁

- UI/美术：自动测试、构建、视觉验收、素材来源和许可复核。
- App Platform：自动测试、Windows packaging、人工输入、音频、重启、存档、离线和 DPI smoke。
- 正式版本：README、CHANGELOG、标签与 GitHub Release 必须指向同一已验证 commit。只有明确宣称属于该版本的在线构建才必须指向同一 commit；未核对的在线 Demo 继续按独立部署状态记录。

## 尚未授权

多地图、多角色、完整剧情任务、联机、账号、云存档、商店发行、自动更新和正式商业化仍是未批准长期设想。
