# 基金会设施环境纵切实施计划

> **执行要求：** 使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务执行；每个任务都必须先写失败测试、再最小实现、再独立审查。

**目标：** 用正式精细像素模块重建开局可见战斗房间，使左侧入口、中央战斗地面、右侧维护区和受控污染痕迹形成清晰的基金会设施语义，同时保持所有碰撞与玩法状态不变。

**架构：** `openingVisualContract.js` 冻结资产与安全区域；`openingFacilityLayout.js` 输出纯语义布局图；`facilityRoom.js` 事务性创建和持有 Phaser 对象；新增 `facilityPresentation.js` 只把停电/设施状态映射为视觉参数。正式 PNG 由 manifest 加载，缺失时由 fallback 填补。

**技术栈：** Phaser 3.90、JavaScript ES Modules、Node `node:test`、Vite、精细像素 PNG。

## 全局约束

- 只在 `C:\scp-survivor-workspaces\active\ui-art` 的 `feature/ui-art-overhaul` 工作。
- 保留 `.superpowers/`，永不暂存。
- 不增加碰撞体、阻挡、可交互对象、伤害区或路径语义。
- 战斗中心保持低噪声；地面图形不得伪装成障碍或拾取物。
- 16px 网格；环境模块只用 64/96/128 尺寸；nearest、硬边、二值透明、每张不超过 32 色。
- 正式素材必须更新 `docs/art/asset-register.md`，记录来源、许可证、修改状态、商业使用和署名要求。
- 不替换标题页/军械库共享素材，不改 Preload 公共合同。
- 未经明确授权不得 merge 或 push。

---

## 任务 1：冻结增量设施素材合同并制作正式 PNG

**文件：**
- 修改：`src/art/openingVisualContract.js`
- 修改：`src/assets/manifest.js`
- 修改：`src/assets/fallbackTextureFactory.js`
- 修改：`docs/art/asset-register.md`
- 新建：`public/assets/art/facility/combat-floor.png`
- 新建：`public/assets/art/facility/entry-threshold.png`
- 新建：`public/assets/art/facility/maintenance-deck.png`
- 新建：`public/assets/art/facility/wall-bank.png`
- 新建：`public/assets/art/facility/power-junction.png`
- 新建：`public/assets/art/facility/contamination-trail.png`
- 修改：`test/opening-visual-contract.test.js`
- 修改：`test/art-assets.test.js`
- 修改：`test/facility-room.test.js`
- 新建：`scripts/art/normalize_pixel_asset.py`
- 新建：`scripts/art/build_contact_sheet.py`
- 新建：`scripts/art/test_pixel_tools.py`

- [ ] **步骤 1：先写失败的资产合同测试**

冻结以下规格：

| key 后缀 | 文件 | 尺寸 | alpha | 用途 |
|---|---|---:|---|---|
| `facilityCombatFloor` | `combat-floor.png` | 128×128 | 不透明 | 中央低噪声可平铺地面 |
| `facilityEntryThreshold` | `entry-threshold.png` | 128×64 | 不透明 | 左侧入口门槛 |
| `facilityMaintenanceDeck` | `maintenance-deck.png` | 128×128 | 不透明 | 右侧维护地面 |
| `facilityWallBank` | `wall-bank.png` | 128×64 | 透明 | 墙体/设备组 |
| `facilityPowerJunction` | `power-junction.png` | 96×96 | 透明 | 供电节点 |
| `facilityContaminationTrail` | `contamination-trail.png` | 64×64 | 透明 | 克制污染痕迹 |

测试还需断言 key/path 唯一、PNG 实际尺寸、色数、透明模式、IMAGE_ASSETS 与 fallback key 完全配对；已有标题和军械库素材路径不变。把 `combat` 加入 `OPENING_FACILITY_ZONES`，并冻结 entry/combat/maintenance/contamination 四区 key 集合，确保任务 2 验证器不会把中央区域判为 unknown-zone。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/opening-visual-contract.test.js test/art-assets.test.js test/facility-room.test.js
$python = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python scripts/art/test_pixel_tools.py
~~~

- [ ] **步骤 3：先实现确定性像素处理工具**

`normalize_pixel_asset.py` 必须提供 `--input --output --width --height --fit contain|cover --alpha opaque|binary --colors --seam-wrap`，使用 Pillow nearest、无抖动量化和 alpha 0/255 门禁；`build_contact_sheet.py` 提供 `--inputs --scale --columns --output`，只允许整数 nearest 放大。Python 单元测试用临时 fixture 证明相同输入字节得到相同 SHA-256、尺寸/alpha/色数正确、`--seam-wrap` 首末行列逐像素一致。先让测试因脚本缺失失败，再最小实现至通过。

~~~powershell
$python = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python scripts/art/test_pixel_tools.py
~~~

- [ ] **步骤 4：使用 imagegen skill 生成候选素材并用脚本处理**

统一提示：俯视精细像素、基金会地下设施、冷灰蓝金属、少量琥珀警示、硬边、无文字、无人物、无 3D 透视、无柔光、无抗锯齿、16px 模块网格。

主题分别为：低噪声战斗地板；带磨损黄黑条的厚重入口门槛；线缆槽和检修盖维护甲板；墙体管线设备组；带指示灯的供电接线盒；暗红紫色的有限异常污染拖痕。

原尺寸检查后用上述脚本处理；`combat-floor` 与 `maintenance-deck` 使用 `--seam-wrap`，不透明素材用 `--alpha opaque`，透明素材用 `--alpha binary`，全部 `--colors 32`。可平铺素材做四象限 seam 检查，透明素材检查脏边。拒绝仅靠缩小看似像素画的候选。原始输出和失败候选保存在 `.superpowers/sdd/facility-assets/sources/`，不暂存。

- [ ] **步骤 5：实现 manifest 与 fallback**

在 `TEXTURES`、`IMAGE_ASSETS` 和 `OPENING_ASSET_SPECS` 添加同一组 key；fallback 只在正式纹理缺失时生成，并满足相同尺寸/透明合同。不得改已有 key 的字符串值。

- [ ] **步骤 6：更新素材登记并验证**

逐项记录实际 Tool/model、日期、精确 prompt/source、原始输出路径与 SHA-256、完整处理流程、License/right basis、Commercial-use status、Admission、最终尺寸和署名要求；被拒绝或中断的候选也写入 prompt/尝试记录。按真实表格行数更新登记表开头的总数摘要。在 `.superpowers/sdd/facility-assets/` 生成 1×/4× contact sheet，不暂存该目录。

~~~powershell
node --test test/opening-visual-contract.test.js test/art-assets.test.js test/facility-room.test.js
$python = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python scripts/art/test_pixel_tools.py
npm run build
git diff --check
git add -- src/art/openingVisualContract.js src/assets/manifest.js src/assets/fallbackTextureFactory.js docs/art/asset-register.md public/assets/art/facility scripts/art/normalize_pixel_asset.py scripts/art/build_contact_sheet.py scripts/art/test_pixel_tools.py test/opening-visual-contract.test.js test/art-assets.test.js test/facility-room.test.js
git commit -m "feat(art): add facility room modules"
~~~

---

## 任务 2：重建纯语义布局图和事务性 renderer

**文件：**
- 修改：`src/art/openingFacilityLayout.js`
- 修改：`src/art/facilityRoom.js`
- 修改：`test/opening-facility-layout.test.js`
- 修改：`test/facility-room.test.js`

- [ ] **步骤 1：先冻结布局关系和中心安全区**

布局项保持：

~~~js
{ id, parentId, zone, role, key, x, y, depth, rotation, scaleX, scaleY }
~~~

验证四区：`entry` 在左、`combat` 居中、`maintenance` 在右、`contamination` 只沿维护区边缘进入。冻结中心安全矩形：

~~~js
{ x: centerX - 192, y: centerY - 144, width: 384, height: 288 }
~~~

除 `role: "floor"` 外，任何新布局项不得与该矩形相交。所有装饰仍是视觉对象，不创建 physics body。按各 contamination item 的显示边界计算 960×540 首屏内矩形并集，污染覆盖必须小于等于可见面积的 10%。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/opening-facility-layout.test.js test/facility-room.test.js
~~~

- [ ] **步骤 3：实现语义布局**

保留真实签名 `createOpeningFacilityLayout(width, height)` 和 `validateOpeningFacilityRelationships(layout)` 导出；函数内部继续用 `width / 2`、`height / 2` 得到中心。用新 floor 模块铺设三种地面，再放入口门槛、右侧 wall bank/power junction 和最多三段 contamination trail。每项 parentId 必须指向同区已存在节点或 null，避免装饰孤岛。

- [ ] **步骤 4：强化 renderer ownership**

新增 `createFacilityRoomController(scene, width, height)`，内部调用布局函数并返回：

~~~js
{ objects, byId, setPresentation(state), reset(), destroy() }
~~~

本任务保留现有 `createFacilityRoomVisuals(scene, width, height)` 导出作为兼容 façade，内部创建 controller 后只返回 `controller.objects`，因此 `world.js` 在任务 2 后无需修改且仍可构建。底层 renderer 创建中任一 texture/add 失败时销毁此前对象后重抛；调用点失败安全在任务 3 接入。`reset()` 恢复正常 presentation，`destroy()` 幂等。`setPresentation` 只设置 tint/alpha/visible，不改变坐标、scale、depth 或 physics。

- [ ] **步骤 5：验证并提交**

~~~powershell
node --test test/opening-facility-layout.test.js test/facility-room.test.js test/art-assets.test.js
npm run build
git diff --check
git add -- src/art/openingFacilityLayout.js src/art/facilityRoom.js test/opening-facility-layout.test.js test/facility-room.test.js
git commit -m "feat(art): rebuild facility room layout"
~~~

---

## 任务 3：接入纯设施状态表现与重启清理

**文件：**
- 新建：`src/art/facilityPresentation.js`
- 修改：`src/scene/world.js`
- 修改：`src/scene/timeline.js`
- 修改：`src/scene/systems.js`
- 新建：`test/facility-presentation.test.js`
- 修改：`test/presentation-rules.test.js`
- 新建：`test/facility-lifecycle.test.js`

- [ ] **步骤 1：先写纯映射和生命周期测试**

冻结：

~~~js
getFacilityPresentation({ outageStrength, activeEventType, bossPhaseActive }) -> {
  ambientTint, ambientAlpha,
  maintenanceTint, maintenanceAlpha,
  contaminationTint, contaminationAlpha,
  warningPulseAlpha
}
~~~

输入只读、输出冻结；相同输入得到相同输出。正常、停电、设施事件和 Boss 组合只改变表现值，不触碰事件时序。连续三次 create→shutdown/restart 后设施对象、timer、tween 和事件监听器不增长。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/facility-presentation.test.js test/facility-lifecycle.test.js test/presentation-rules.test.js
~~~

- [ ] **步骤 3：实现纯映射与最小接线**

`world.js` 改用并持有 `createFacilityRoomController(scene, width, height)`；调用点 catch 构造错误后尝试 `createMinimalFacilityFallback(scene, width, height)`，该 fallback 只用已有 `facilityFloor` 或程序化纯色地面并返回同形状 controller。若连 `scene.add.*` 都失败，再返回不创建显示对象的 `createNoopFacilityController()`（空 objects/byId，reset/setPresentation/destroy 均幂等 no-op），绝不让 `PrototypeScene.create()` 中断。用去重后的 `SHUTDOWN`/`DESTROY` once listener 调用幂等 `destroy()` 后清空引用；`timeline.js` 更新已有 outage/event 状态后调用表现刷新；`systems.js` 的 `clearFacilitySystems()` 调用 `controller.reset()`。表现方法异常必须隔离，不能阻止 gameplay 状态提交或清理。

- [ ] **步骤 4：验证 gameplay 等价**

测试接线前后 timeline 状态、active event、outageStrength、Boss flag 和碰撞对象集合完全一致；生产纹理与 fallback 路径输出同样布局关系。

- [ ] **步骤 5：阶段全量验证并提交**

~~~powershell
node --test test/facility-presentation.test.js test/facility-lifecycle.test.js test/presentation-rules.test.js test/opening-facility-layout.test.js test/facility-room.test.js test/art-assets.test.js
npm run build
git diff --check
git status --short --branch
git add -- src/art/facilityPresentation.js src/scene/world.js src/scene/timeline.js src/scene/systems.js test/facility-presentation.test.js test/facility-lifecycle.test.js test/presentation-rules.test.js
git commit -m "feat(art): connect facility presentation states"
~~~

## 阶段验收

- 代码审查：中心安全区、无 physics、构造回滚、重启清理、timeline 等价。
- 视觉审查：960×540 下入口/战斗/维护区一眼可辨，中央不杂乱，污染指向异常但不伪装障碍。
- 用户最终浏览器 smoke 放到集成计划，不在本阶段凭静态截图宣称完成。
