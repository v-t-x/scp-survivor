# U3 最终素材与蓝图登记

登记日期：2026-09-11。正式候选仅包含下表六张运行 PNG；源文件、尺寸和 SHA-256 见 [素材核验记录](evidence/closeout/runtime-assets.json)。

| 文件（位于 `src/ui/assets/`） | 用途 | 生成原图文件名 |
| --- | --- | --- |
| `u3-steel.png` | 无文字灰绿工业钢板细纹理 | `exec-0ef71fce-2838-4323-adc9-a6d2cac1cc34.png` |
| `u3-ammunition-v2.png` | 无文字弹药剖面技术图 | `exec-1abee3e4-062a-45c0-9f95-f9fd5e2d285b.png` |
| `u3-vitals-v2.png` | 无文字生命监测技术图 | `exec-3ab926fc-47e3-483d-b3c8-cdd8651e77b1.png` |
| `u3-paper-v2.png` | 浅色纤维报告纸面 | `exec-13ba8576-e2dd-4da8-ad82-f309c4b9a61e.png` |
| `u3-chassis-v2.png` | 无文字灰绿工业设备外壳 | `exec-aed0c4b4-c104-4db1-b3fc-e7419f63a4b0.png` |
| `u3-containment-v2.png` | 无文字收容设备技术图 | `exec-6f740f02-3150-4c42-87a7-93162e917e6b.png` |

六项均由本项目于 2026-09-10 通过 OpenAI 内置 ImageGen 制作，工具未暴露具体模型名称。参考方向仅来自本项目已确认 U3 蓝图，没有额外第三方图片输入；钢板仅使用文字提示。六项均为生成原图直接复制，未作内容编辑或二次缩放保存。生产运行时按 CSS/SVG 缩放显示。制作要求是提供材质与技术图示，不绘制页面中文、游戏数值、按钮文字、口径或编号；技术细节不构成新的枪型或游戏设定。原图匹配已在制作阶段逐项核对，本次封包重新核验文件。

原始生成文件位于本机 `C:/Users/24037/.codex/generated_images/01a08ae1-755c-7610-9ef3-567af81b5344/`，该目录仅用于来源追溯；运行和构建只依赖已入库文件。未使用的初稿 `u3-chassis.png` 及多轮生成提示、制作报告留在原本机位置，不随正式候选入库，也不被运行代码引用。

六项沿用项目生成视觉素材的 **CC BY-SA 3.0** 许可。见 [目录许可](../../../src/ui/assets/LICENSE.md)、[完整条款](../../../LICENSES/CC-BY-SA-3.0.txt)、[项目署名](../../../ATTRIBUTION.md)及[许可映射](../../../LICENSE-MAP.md)。没有新增第三方作者、字体或图标包。商业使用仍须满足既有署名、同许可共享及项目后续商业复核条件；本次不执行商业发布，也不变更许可策略。

`u3Illustrations.js` 的节奏、链击、穿透、回旋弹、电场、武器示意及中断波形，以及 `u3FrameArt.js`、`u3Materials.js`、`u3MissionViews.js` 中切角边框、磨损、钢印、纸面和按钮均为项目编写的 SVG/CSS。独立软件逻辑按 MIT，视觉表达按既有 CC BY-SA 3.0。武器展示复用已经登记的 U1 步枪和 Tesla hero，未改变图片原文件或战斗武器外观。使用系统中文字体，不分发新字体文件。

## 加载与回退

运行 PNG 由 U3 模块通过 `new URL(..., import.meta.url)` 局部加载，Vite 复制并哈希。不增加 Phaser texture key，不修改 manifest、Preload 或公共管理器接口。样式限制在 `.scp-u3`。

图片失败时保留 CSS 设备、纸面底色、SVG 技术图与实时内容；图示的失败 PNG 节点会移除，避免遮住备用图。DOM 覆盖层失败时沿用 terminal/legacy 路径；构筑全部视图失败会释放其持有的暂停。文字、属性、结算统计与按钮均独立实时渲染。

## 已确认五页蓝图

以下五张项目生成概念原图入库归档；它们仅用于设计对照，不是游戏生产背景或自然游玩截图。蓝图视觉/设计内容按上述 CC BY-SA 3.0 及根署名文件处理。

- [升级选择最终方向](blueprints/upgrade-concept-v2.png)：三张强化卡、设备外壳、专属图示、前后数值；被替代的简洁版不入库。
- [当前构筑](blueprints/build-concept.png)：武器、已有强化、行动员和异常突变分区，条目数量以真实游戏为准。
- [暂停](blueprints/pause-concept.png)：紧凑设备、真实任务/时间/设施、主要继续与次要返回标题。
- [胜利结算](blueprints/victory-concept.png)：工业报告设备、浅色纸面和恢复收容确认。
- [失败结算](blueprints/failure-concept.png)：独立构图的深色事故终端、红色中断波形。

原始蓝图来自用户指定的本地 `u3-upgrade-preview-2026-09-10` 目录，本轮未修改图像。它们不是新增地图、枪型、口径、设施编号或玩法的授权。最终 Tab 行为以 [验收记录](README.md) 为准，替代历史“按住查看、不暂停”的说明。
