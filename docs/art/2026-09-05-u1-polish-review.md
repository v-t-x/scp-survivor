# U1 五点精修与实机复核

> 历史记录：下文保留 2026-09-05 当日的验收与 Git 状态。项目所有者于 2026-09-09 确认保留此版；当前提交、验证与便携图片见 [U0、U1 与 U2 表现收口](./2026-09-09-u1-u2-closeout.md)及[证据清单](./evidence/u0-u2/manifest.json)。下文绝对路径仅用于本地历史溯源。

日期：2026-09-05。范围：用户在上一轮视觉复核后批准的五点局部精修，不重开布局或资产设计。

## 本轮结果

1. 档案正文区域增加无边框、低透明度且边缘渐弱的阅读层，减轻纸纹对文字的干扰；保留纸张、污损与横线。商店说明、缺口信息调整到 14px，主标题未改。
2. 商店正式购买面板常态降亮，悬停时上边缘提亮，按下时回暗并将面板和文字下移 1px；热区不移动。移出、松开和状态刷新均复位。
3. 军械库左侧正式武器缩略图从 142×106.5 调整为 130×97.5，上移 4px；中央 256×192 主体不变。
4. 右上永久授权入口压低默认金色亮边，悬停才增强，保留底部“开始任务”的主操作层级。
5. 正式商店的已授权印章及文字同步上移 5px，尺寸和倾角不变。

未新增、重画或替换位图素材；未改 manifest。实现仅涉及 `src/art/perkStoreView.js`、`src/art/weaponSelectionView.js`、`src/ui/u1MaterialUi.js`，并更新五个相关测试文件。其余上一轮 WIP 的 42 个文件 SHA-256 保持不变；上一轮报告和截图保留。

## 实机证据

证据目录：`C:\Users\24037\.codex\visualizations\2026\09\01\01a05cfa-8b74-7513-bdb1-a26932277c49\u1-polish`。

- [军械库未选](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/u1-a-armory-unselected.png)、[特斯拉已选](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/u1-b-armory-tesla-selected.png)、[步枪长名称](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/smoke-rifle-selected.png)。
- 商店 A–G 中的 C–G 覆盖 0/150/200 学分、三态同屏和全授权：[三态同屏](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/u1-f-store-three-states.png)、[全授权](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/u1-g-store-complete.png)。
- [购买悬停](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/store-purchase-hover.png)、[购买按下](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/store-purchase-pressed.png)、[次级入口悬停](C:/Users/24037/.codex/visualizations/2026/09/01/01a05cfa-8b74-7513-bdb1-a26932277c49/u1-polish/armory-authorization-hover.png)。

所有截图来自同一实际构建 `index-Bw2CQCmN.js`，通过 requestAnimationFrame 内读取实际 Phaser canvas 得到原生 960×540 PNG，无裁剪、缩放或拼贴。截图与文件哈希见同目录 `final-evidence.json`。

## 验证

- 测试先复现五项预期差异，再实现；最终全量 **695/695 通过**。
- 新反馈测试覆盖：悬停/按下不购买、pointerup 购买一次、热区不变、移出及 pointerupoutside 复位、按住时刷新为已授权、缺失或退役 atlas 的可见回退反馈、销毁后无监听。
- `npm run build`、`git diff --check` 通过；保留既有的大于 500 kB bundle 提示。
- 实机购买：150 分且装甲已授权时购买护具，结果为 0 分、装甲与护具已授权；再次点击护具不改变结果。按下后移出释放不购买。
- 实机导航：未选武器不能部署；打开商店再返回保留特斯拉选择；开始任务进入既有游戏。未进行完整六分钟玩法验收。
- 4197 临时测试源使用前确认存档 key 为 null，每组样本都在 finally 清除并 reload；结束再次确认为 null，未覆盖用户存档。浏览器 error 日志为空。
- 军械库、商店分别由只读 Agent 独立对照上一版原尺寸图复核，未发现新的明显拼贴、遮挡或回归；独立代码审查无 Critical/Important/Minor 项。审查结论不代替用户视觉认可。

## 范围与交接

实施目录：`C:\scp-survivor-workspaces\active\ui-art-u0-u1-implementation`。分支 `codex/ui-art-u0-u1-implementation`，HEAD `a790aad952dd1da2c4a6020a89c242ee687c6955`。

暂存区为空，工作区保留既有未提交 WIP。本轮没有 commit、push、PR、merge、tag、部署、删除或清理。PreloadScene、fallbackTextureFactory、UIManager、AudioManager、配置、存档、玩法、U2/U3 未改；未冻结 UI Foundation。GPT 等级 0：既有批准方案下的局部精修。

本轮使用测试先行、真实原尺寸检查和独立审查限制修改范围。下一步仅由用户体验并反馈这一版，不自动进入后续阶段。
