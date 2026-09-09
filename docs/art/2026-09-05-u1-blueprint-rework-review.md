# U1 原蓝图返工与真实尺寸复核

> 历史记录：下文保留 2026-09-05 当日的验收与 Git 状态；后续采用同日五点精修，并于 2026-09-09 确认保留。当前提交、验证与便携图片见 [U0、U1 与 U2 表现收口](./2026-09-09-u1-u2-closeout.md)及[证据清单](./evidence/u0-u2/manifest.json)。下文绝对路径仅用于本地历史溯源。

日期：2026-09-05。状态：本地实现、技术验证和逐图复核已完成，等待项目所有者体验；不宣称项目所有者已视觉验收，也不沿用上一轮的视觉 PASS。

## 本轮结果

- 军械库恢复原蓝图的窄左栏、大中央展示、右侧纸面档案。左栏正式武器图与名称共用中轴，选中状态不挤占名称；中央正式图不再缩成小图。
- U1 独立字体规则区分金属铭牌、纸面字段与数值；字位按实际 960×540 卡槽校准。纸面保留底盘材质，移除覆盖纸张的程序色板，数值独立列对齐。步枪长名称单行完整，与右侧小印记分离。
- 开始任务、永久授权和返回按钮使用 U1 局部内嵌控件：居中文案、独立箭头/锁、薄边与局部光照。未修改共享 terminal control 或 UIManager。
- 商店四卡回到左图右文，说明与名称分层，状态灯落回实体导轨。可购买显示按钮；已购买显示斜印章；学分不足显示总价和差额。隐藏可购买/已购买状态重复的总价。
- 两张新底盘通过已批准的 U1 manifest key 接入，旧底盘和现有 hero/perk/atlas 字节保留。来源、原生尺寸和 SHA-256 见 [素材登记](C:/scp-survivor-workspaces/active/ui-art-u0-u1-implementation/docs/art/asset-register.md)。

## 原尺寸验收图

以下七张均来自同一个正式构建 `index-DIv9FG-g.js`，原始 PNG 960×540。通过浏览器支持的开发接口在 requestAnimationFrame 中读取真实 Phaser canvas，不修改渲染器，不裁切、不拼贴、不缩放截图。底盘素材本身为 1672×941，不能与截图分辨率混为一谈。

| 图 | 实际覆盖 | 复核结果 |
|---|---|---|
| [A 未选择武器](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-a-armory-unselected.png) | 0 学分、两张选择卡、空档案、禁用部署 | 无文字碰撞；按钮不可部署 |
| [B Tesla 已选](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-b-armory-tesla-selected.png) | 选中描边、正式武器大图、6 / 300 ms / 3、开始任务 | 文字在纸面可读，名称和数值列分离 |
| [C 商店 0 分](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-c-store-credits-0.png) | 四卡全部不足 | 差额可见，没有伪可点击按钮 |
| [D 商店 150 分](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-d-store-credits-150.png) | 装甲/护具/信标可购买，军械授权不足 100 | 三个购买按钮与各自价格居中 |
| [E 商店 200 分](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-e-store-credits-200.png) | 军械授权仍不足 50 | 动态差额正确，未改变 250 的总价 |
| [F 三状态同屏](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-f-store-three-states.png) | 装甲已授权、护具/信标可买、军械授权不足 | 印章、按钮、差额互不遮挡 |
| [G 全部授权](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/u1-g-store-complete.png) | 4/4、四印章、无重复购买 | 四印章完整位于卡内 |

补充：[步枪长名称](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/smoke-rifle-selected.png)、[部署进入游戏](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/smoke-deploy-starts-gameplay.png)。这只验证 U1 入口能进入既有游戏，不是 U2/U3 或完整六分钟玩法验收。

## 验证与独立审查

- `npm test`：692/692 通过。针对新布局、纸面独立数值列、居中按钮、缺图回退和热区一致性新增回归。
- `npm run build`：通过；仍有既有的大于 500 kB bundle 警告，本轮不拆构建架构。
- `git diff --check`：通过。两张新底盘 public/dist 字节一致；七图 PNG 签名、尺寸与哈希已检查。
- 真实 UI：未选择时点击部署没有进入游戏；选中 Tesla 后能进入游戏；打开/关闭商店保留选择。
- 真实购买：测试样本为 150 分、装甲已拥有；购买护具后为 0 分、2/4。再次点击已授权护具和不足学分的军械授权，没有再次扣款或新增授权。
- 测试只用临时回环端口 4196/4197，先确认 `scp-survivor-meta` 为 null，再放入临时样本，每次 finally 清除并 reload；结束复核该 key 仍为 null。没有覆盖用户已有存档或变更存档规则。
- 浏览器 error 日志为空；已有玩家旧 sheet 缺失的回退 warning 仍在，本轮未修改角色系统。
- 几何 Agent 只读核对原蓝图和素材；视觉 Agent 复核真实军械库、商店三态、最终纸面字段及全授权印章，所提纸面可读性问题已关闭。
- 独立代码 Agent 发现并复核关闭两项真实回退问题：正式武器图创建失败时页内重试旧 selector 图；无商店底盘时采用完整程序控件，避免 atlas 小面板遮住更宽热区。两个问题均先复现失败测试，再修复通过。Agent 未修改文件或 Git 状态。

## 范围与 Git

- 实施 worktree：`C:\scp-survivor-workspaces\active\ui-art-u0-u1-implementation`。
- 分支：`codex/ui-art-u0-u1-implementation`；HEAD：`a790aad952dd1da2c4a6020a89c242ee687c6955`。
- 保留旧 WIP，工作区仍有未提交修改与未跟踪文件；暂存区为空；本轮没有 commit、push、PR、merge、tag、部署、删除分支/worktree 或清理旧素材。
- PreloadScene、fallbackTextureFactory、UIManager、AudioManager、src/config、src/main.js、package.json/lock 相对 HEAD 均无差异。U2/U3、玩法、数值、流程、存档语义未改；本轮不冻结 UI Foundation。
- 本轮使用 Superpowers 执行/TDD/验证流程和只读独立审查，按原批准蓝图返工，不重新发明产品目标。GPT 等级 0：已有批准方向下的局部实现，无需外部产品重审。

证据绑定：[final-evidence.json](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/final-evidence.json)。可用 [audit-evidence.mjs](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-blueprint-rework/audit-evidence.mjs) 重新核对七图、public/dist、一致构建入口、受保护路径和当前 WIP 哈希。早期 `iteration-*` 文件只是迭代记录，其中缩放/裁切/空帧的失败取证未用于交付，也未删除。
