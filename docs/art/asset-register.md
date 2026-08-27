# 正式素材准入登记表

本表记录正式素材的真实生产信息。v1.6.0 源码发布中，本表列出的项目生成视觉素材统一按 [`LICENSE-MAP.md`](../../LICENSE-MAP.md) 所述 CC BY-SA 3.0 提供；各行的“候选/商业复核”描述生产准入历史与未来商业尽调状态，不改变本次源码发布许可证。既有 20 项静态门禁候选历史记录保留不变；R-17 七套动画素材已通过独立的四帧 production gate 并正式准入；设施环境纵切 Task 1 的六张模块 PNG 已通过素材合同、二值 alpha、色数、接缝和视觉审查；终端覆盖层 Task 2 的 16 张升级图标与 3 张终端表面素材已通过尺寸、二值 alpha、色数和逐张视觉审查，其中 6 张 `tone=weapon` 图标已在独立审查后换为明确琥珀版本；战斗反馈 Task 1 的 contact-shadow 已通过尺寸、二值 alpha、灰黑色板、manifest/fallback 同键及视觉审查。v1.6.0 基线登记共计 53 项，其中 51 项由运行时 manifest 加载；当前合并树的运行时 manifest 为 70 项，玩家素材的现行边界以下方 2026-08-21 稳定化裁决为准。`infected-staff.png` 与 `infected-opening-sheet.png` 是不由运行时 preload 的历史/溯源保留素材。

登记中的 `.superpowers/...` 仅是**不随 Release 分发**的本地审计归档标识；运行时加载、公开署名和许可合规均不得依赖该目录。`local-generation-archive:<generation-id>/<filename>` 同样仅标识本地生成归档位置，并保留 generation id 与文件名，不是公开分发路径。

## 2026-08-21 Player Overhaul 稳定化裁决（当前优先）

本节优先于下方 2026-08-16 的旧 admission 文案。以下 SHA-256 均为本次对 `public/` 当前字节实测结果；生产运行时只加载 body、八张 aim/recoil、Tesla power module 和两张 icon。它们均为项目本地确定性 Pillow 产物（body 由 `player-response-operative-breacher-sample.png` 锁定输入复制，其他由 `scripts/art/build_player_equipment_assets.py` 生成）；商业发布复核仍待完成，不能视为最终许可批准。

| Asset | SHA-256 | Dimensions | Current admission |
|---|---|---|---|
| player-response-operative-body | `c95e247abac034c6fd770d685f1e45f9fab12279d639e63850c572ef95cc8396` | 320×64, 5×64×64 RGBA | Production runtime body; commercial review pending |
| foundation-containment-rifle-aim-back | `27a51d1b2b1d3927b40d470a1af36bb7952ac243839f9b5edd334b02d3f20221` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| foundation-containment-rifle-aim-front | `8e19da9ae6ddc9744fe5182fd0b2090a869c43d515fe82c6f817e3dccd4952ad` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| foundation-containment-rifle-aim-recoil-back | `e227746e9b76706e83f344df5843cf44a3bbe947a8bda8581cc252a677e43dc1` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| foundation-containment-rifle-aim-recoil-front | `c9cd760be39cbfbae98fac57dc20a07e957e0566b3386f83431a7b3c385608fa` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| tesla-containment-emitter-aim-back | `8ae12c138bfc6b7e989697f5e052dfe8391c5e7c82f985c75bd881d5f326dc0c` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| tesla-containment-emitter-aim-front | `2e397f6fbfcffe5178bf05ded58451a981e59a082c389626f89163040d1e9505` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| tesla-containment-emitter-aim-recoil-back | `e8bc97731424dfe6e835caac13716f29860b15c3dda50b0d39927dab445c3674` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| tesla-containment-emitter-aim-recoil-front | `fa620bf3213db64d919c3bae30e1ff8d9f6161d4aa1e16523d3f8c063b9043ab` | 320×1024, 80×64×64 RGBA | Production runtime; commercial review pending |
| tesla-containment-power-module | `16a789991244f941da12a73e9f5dd94d7fb6a6a106d76284fef12e82df17f2bb` | 64×64 RGBA | Production Tesla rig dependency; commercial review pending |
| foundation-containment-rifle-icon | `63d56425b183ee32f9bfaa2594f5a4151b2f48c32d3b03903b6c0ebef9e19ab7` | 96×96 RGBA | Production compatibility icon; commercial review pending |
| tesla-containment-emitter-icon | `7593504fbec73cdbdefe9072279803abfffacf3aa09c3008e63f72bc1da86fd1` | 96×96 RGBA | Production compatibility icon; commercial review pending |

`core`、`connector`、`same` 与 `cross` 图均保留在版本控制和审计来源中，但当前一律为 retained historical/reference outputs：不在 production preload，且由构建清理从 `dist` 移除。其本次实测哈希为 rifle core `c896ac4e0712b898f1811c6fdc8215cba75787d79081cc86d51bb5f73da0812b`、Tesla core `4eee76b20b9b2225c021acb540ea18eb9ccb2671ad6ea052afc419bd5b03da4e`；rifle connector back/front `4bd49de4c6b3cff99efec0bb74f909d51e96e7e2402ab3954224c95a54221bd5` / `9988be73249b21b71fdf4f1f7a2aa9f11d8f7ea2f2a04fa3cf099bbb921b47ec`；Tesla connector back/front `cb2ed82bb0fcba4b1f0d8a7aae8559b6d5335b7cb8d78d3c9b791d8c17b3f0d2` / `3564f44c28dea631e461ccd550384911b51cc0facc7ae46fe9866b7d26f7057c`。其余 same/cross 当前哈希沿用紧随其后的历史条目，已复测无变化。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| player-response-operative-body | spritesheet PNG | `assets/art/characters/player-response-operative-body.png` | Locked A local PNG | 2026-08-16 | `player-response-operative-breacher-sample.png` 的已接受 A identity；输出 SHA-256 `c95e247abac034c6fd770d685f1e45f9fab12279d639e63850c572ef95cc8396` | Byte-identical copy; no pixel edits | Existing project-owned locked A acceptance asset; commercial release recheck remains required | Candidate pending commercial review | Player equipment Task 1 production body | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain locked-A provenance and recheck before commercial release. |
| foundation-containment-rifle-same-back | spritesheet PNG | `assets/art/weapons/foundation-containment-rifle-same-back.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 已确认 A 步枪后层 `foundation-rifle-back-64.png`；第 0 帧保持确认稿像素，整表 SHA-256 `6c336330db4f71a33335bc9a3619866e72a14852a92a5538900580e289358237` | 以整数位移扩展为 5 帧，未重绘第 0 帧 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production same-pose back layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-A provenance and recheck before commercial release. |
| foundation-containment-rifle-same-front | spritesheet PNG | `assets/art/weapons/foundation-containment-rifle-same-front.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 已确认 A 步枪、双臂与手部前层 `foundation-rifle-front-64.png`；第 0 帧保持确认稿像素，整表 SHA-256 `c5e5cdc12d3e6be817daab605371ec5b90793fcd96082abc05699259a4bde916` | 以整数位移扩展为 5 帧，未重绘第 0 帧 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production same-pose front layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-A provenance and recheck before commercial release. |
| foundation-containment-rifle-cross-back | spritesheet PNG | `assets/art/weapons/foundation-containment-rifle-cross-back.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 基于已确认 A 步枪分层制作 body-left/aim-right 反向姿势；整表 SHA-256 `876c4ce19f4b30e2e15e8b45879719bccc964535553700f7de995298fba57c9a` | 重新连接反向持枪后层，并以整数位移扩展为 5 帧 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production cross-pose back layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-A provenance and recheck before commercial release. |
| foundation-containment-rifle-cross-front | spritesheet PNG | `assets/art/weapons/foundation-containment-rifle-cross-front.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 基于已确认 A 步枪分层制作 body-left/aim-right 反向姿势；整表 SHA-256 `a795067caeb829ccaddc482156ee090014b202b2b9b014d0dc2243bcd3dcff6e` | 仅镜像独立枪体，再按 body-left 重画反向双臂连接并以整数位移扩展为 5 帧；运行时整体镜像得到另一反向组合 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production cross-pose front layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-A provenance and recheck before commercial release. |
| tesla-containment-emitter-same-back | spritesheet PNG | `assets/art/weapons/tesla-containment-emitter-same-back.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 已确认 Tesla 背包/电缆后层 `tesla-emitter-back-64.png`；第 0 帧保持确认稿像素，整表 SHA-256 `fec436532a441f29adf6acb05d4e5566c411ffcfc701d49106d0d8ed3c2d3b9c` | 以整数位移扩展为 5 帧，未重绘第 0 帧 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production same-pose back layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-Tesla provenance and recheck before commercial release. |
| tesla-containment-emitter-same-front | spritesheet PNG | `assets/art/weapons/tesla-containment-emitter-same-front.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 已确认 Tesla 线圈、双臂与电弧前层 `tesla-emitter-front-64.png`；第 0 帧保持确认稿像素，整表 SHA-256 `3e5b3e4c0469f0a9dff54891ca5d25ba20529467fff52e2967c11d6b1a75ad12` | 以整数位移扩展为 5 帧，未重绘第 0 帧 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production same-pose front layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-Tesla provenance and recheck before commercial release. |
| tesla-containment-emitter-cross-back | spritesheet PNG | `assets/art/weapons/tesla-containment-emitter-cross-back.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 基于已确认 Tesla 分层制作 body-left/aim-right 反向姿势；背包保持 body-local，整表 SHA-256 `13165d55fe8dcfe2a66d7d7b265409abffb866784fa199031804bfdce1719ab7` | 保留背包侧别、重走后层电缆并以整数位移扩展为 5 帧 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production cross-pose back layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-Tesla provenance and recheck before commercial release. |
| tesla-containment-emitter-cross-front | spritesheet PNG | `assets/art/weapons/tesla-containment-emitter-cross-front.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | 基于已确认 Tesla 分层制作 body-left/aim-right 反向姿势；整表 SHA-256 `4f2052cfc5991c1c4a9e21b6e6245f812c789df4172f4f6974d07437e7592ae0` | 仅镜像独立发射器，再按 body-left 重新连接双臂；背包不参与镜像；运行时整体镜像得到另一反向组合 | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 production cross-pose front layer | 320×64, 5×64×64 RGBA, binary alpha | No third-party attribution currently; retain accepted-Tesla provenance and recheck before commercial release. |
| foundation-containment-rifle-core | PNG | `assets/art/weapons/foundation-containment-rifle-core.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | Reviewed native rifle structure rebuilt as a body-free local +X layer; output SHA-256 `ea10aabbe184aae571e037e2cfaf4fe446651e3ac579bb4c16d3adedf5c8ad45` | Removed body/forearms and mirrored the independent rifle to local +X | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 rollback-only historical layer; not production preload | 64×64 RGBA, binary alpha | No third-party attribution currently; recheck before commercial release. |
| tesla-containment-emitter-core | PNG | `assets/art/weapons/tesla-containment-emitter-core.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | Reviewed Tesla coil/emitter structure rebuilt as a body-free local +X layer; output SHA-256 `57f185a7f3b342b5ec6fe07995cbef5b2bcc627ff9663835c9171eca3e0bbf76` | Removed static arcs, arms and pack; retained copper, ceramic and blue-white electrical marks | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 rollback-only historical layer; not production preload | 64×64 RGBA, binary alpha | No third-party attribution currently; recheck before commercial release. |
| tesla-containment-power-module | PNG | `assets/art/weapons/tesla-containment-power-module.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | Reviewed Tesla pack structure rebuilt as an independent left body-local layer; output SHA-256 `b52cd0f1a5ba542cb5c29bece8bb7e5dd410d826fefd4cd6bf6ff68634e5b590` | Removed body and cable pixels | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 rollback-only historical layer; not production preload | 64×64 RGBA, binary alpha | No third-party attribution currently; recheck before commercial release. |
| foundation-containment-rifle-icon | PNG | `assets/art/weapons/foundation-containment-rifle-icon.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | Derived from the accepted same-pose rifle back/front layers; output SHA-256 `63d56425b183ee32f9bfaa2594f5a4151b2f48c32d3b03903b6c0ebef9e19ab7` | Nearest-neighbor 96px icon rendering | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 compatibility icon | 96×96 RGBA, binary alpha | No third-party attribution currently; recheck before commercial release. |
| tesla-containment-emitter-icon | PNG | `assets/art/weapons/tesla-containment-emitter-icon.png` | `scripts/art/build_player_equipment_assets.py` local deterministic Pillow builder | 2026-08-16 | Derived from the accepted same-pose Tesla back/front layers; output SHA-256 `7593504fbec73cdbdefe9072279803abfffacf3aa09c3008e63f72bc1da86fd1` | Nearest-neighbor 96px icon rendering | Project-authored deterministic pixel asset | Candidate pending commercial review | Player equipment Task 1 compatibility icon | 96×96 RGBA, binary alpha | No third-party attribution currently; recheck before commercial release. |
| facility-floor | PNG | `assets/art/facility/floor.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P1](#p1-facility-floor)；无图像输入 | 从生成的重复面板中裁取单元；nearest 缩至 32×32；强制首末行列一致；转 RGBA；无抖动量化到共享 32 色板；保持全不透明 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-wall | PNG | `assets/art/facility/wall.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P2](#p2-facility-wall)；无图像输入 | 官方 `remove_chroma_key.py` 去底/去绿边；裁切；nearest 缩放；alpha 二值化；置入 64×64 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-door | PNG | `assets/art/facility/door.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P3](#p3-facility-door)；无图像输入 | 首版因正面立面被拒；重生成高俯视浅带门；去色键、裁切、nearest 缩放、alpha 二值化；纵向 nearest 拉伸到 20px 保持小尺寸可读；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-console | PNG | `assets/art/facility/console.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P4](#p4-facility-console)；无图像输入 | 首版因正面机柜被拒；重生成顶部平面主导设备；去色键、裁切、nearest 缩放、alpha 二值化；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-vent | PNG | `assets/art/facility/vent.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P5](#p5-facility-vent)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；置入 32×32 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-decal | PNG | `assets/art/facility/decal.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P6](#p6-facility-decal)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；置入 32×32 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| player | PNG | `assets/art/characters/player.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P7](#p7-player)；无图像输入 | 首版因正视长比例被拒；第二版去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=46；共享色板量化；用色板内钢灰/棕色像素重绘 3×7 滑套、枪口和短握把 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 48×48 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| infected-staff | PNG | `assets/art/characters/infected-staff.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P8](#p8-infected-staff)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=46；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 48×48 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| scp-049 | PNG | `assets/art/characters/scp-049.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P9](#p9-scp-049)；无图像输入 | 前两版因正面立绘/错误冠饰被拒；第三版重生成高俯视素布兜帽；去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=78；共享色板量化 | SCP-049 衍生视觉；合并/发布须满足项目文档所述 CC BY-SA 3.0 署名与相同方式共享要求并再次复核；未使用第三方图像输入 | 条件候选；商业发布与分发方式须先完成许可复核 | 静态门禁候选 | 64×80 | 必须署名 [SCP-049](https://scp-wiki.wikidot.com/scp-049) 条目作者 Gabriel Jade 与 2018 重写合作者 djkaktus，并附 CC BY-SA 3.0；衍生发布须遵守相同方式共享。未使用条目原图。 |
| r17-drifter | spritesheet PNG | `assets/art/enemies/r17-drifter.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Sharp | 2026-07-14 | 基础提示为 [P31](#p31-r-17-common-production-prompt)+[P32](#p32-r17-drifter)；accepted replacement original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-0ea14189-2748-4028-b8f5-50a152ba373b.png`；exact correction prompt unavailable in repository; do not attribute to base prompt alone；audit source `.superpowers/sdd/r17-assets/sources/r17-drifter.png` | exact chroma key；four equal cells；per-cell union alpha bbox；one shared nearest scale；common center/bottom baseline；binary alpha；no-dither <=32-color quantization；RGBA output 192x48 | Project-commissioned generation; approved lineup was the only image input; no third-party images; commercial release must recheck OpenAI output rights | candidate pending commercial review | R-17 animation gate admitted | 192x48, 4x48x48 | no third-party attribution currently; recheck OpenAI terms before commercial release. Rejected predecessor: `.superpowers/sdd/r17-assets/sources/r17-drifter-rejected-short-frame2.png` (initial original `local-generation-archive:019f5e8c-8742-77f0-80d3-e643979ff61d/exec-d86dea1b-1760-4a31-8b12-7a15bb75003b.png`), rejected for short frame 2. |
| r17-rift-skimmer | spritesheet PNG | `assets/art/enemies/r17-rift-skimmer.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | 基础提示为 [P31](#p31-r-17-common-production-prompt)+[P33](#p33-r17-rift-skimmer)；accepted replacement original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-d25b5a45-2e24-4985-ad8e-ce38fdceeda1.png`；exact correction prompt unavailable in repository; do not attribute to base prompt alone；audit source `.superpowers/sdd/r17-assets/sources/r17-rift-skimmer.png` | bundled chroma helper；four equal cells；per-cell union alpha bbox；one shared nearest scale；common center/bottom baseline；binary alpha；common deterministic no-dither <=32-color classification；RGBA output 192x48。审计 normalizer 原先错误地把 extent 28 的全部非 cyan 像素硬编码为 `139,112,111`，本次仅删除该 special branch，使 rift 与其他尺寸使用同一 charcoal/red/light-steel/brown/cyan 规则；source、scale、geometry 与门禁未改变。Current production SHA-256 `9E0C59A7C345DD4EB871ACBAA442B7FA3C57BB3EAEA7DC7E3E2674F3ABAFE4AD` | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation and material-semantic gates admitted | 192x48, 4x48x48 | Rejected retries retained, never production: `r17-rift-skimmer-rejected.png` (wrong pear-shaped initial result; original `local-generation-archive:019f5e8c-8742-77f0-80d3-e643979ff61d/exec-01bfb948-f6a5-4ea6-83fc-72f392975a3b.png`), one user-interrupted retry after about 16.6 seconds (no output or source path; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `r17-rift-skimmer-rejected-thin-tips.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-b6377d76-f6f1-41a2-ac4c-bc8b4679467b.png`, thin tips; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `r17-rift-skimmer-rejected-area-variance.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-bf130ba7-01fb-4ee1-9304-a546417ca565.png`, area ratio >1.20; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `.superpowers/sdd/r17-assets/sources/r17-rift-skimmer-rejected-color-collapse.png` (previous two-color production SHA-256 `C0AC839F6F81164A53C121FD63EAA231222D41F0EA466004B74F21E340167E65`, rejected because the extent-28 branch collapsed all non-cyan materials to one brown value). |
| r17-pulse-sac | spritesheet PNG | `assets/art/enemies/r17-pulse-sac.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | 基础提示为 [P31](#p31-r-17-common-production-prompt)+[P34](#p34-r17-pulse-sac)；accepted replacement original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-b1fdafc0-8ebe-41e7-81a8-c3c593a24166.png`；exact correction prompt unavailable in repository; do not attribute to base prompt alone；audit source `.superpowers/sdd/r17-assets/sources/r17-pulse-sac.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 192x48 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 192x48, 4x48x48 | Rejected retries retained, never production: `r17-pulse-sac-rejected-low-silhouette-motion.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-b4e52eb5-f241-4c77-89fa-d06e25c540d4.png`, alpha pair 1<->2 <0.015), `r17-pulse-sac-rejected-unequal-envelope.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-a956e1c8-2a58-423d-8eef-63c8b14cb15b.png`, extents 32/34/31/31; exact correction prompt unavailable in repository; do not attribute to base prompt alone). |
| r17-carapace-gate | spritesheet PNG | `assets/art/enemies/r17-carapace-gate.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | [P31](#p31-r-17-common-production-prompt)+[P35](#p35-r17-carapace-gate)；accepted original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-e965b64f-51a5-4fef-b0e9-e1b45b63802b.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-carapace-gate.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 256x64 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 256x64, 4x64x64 | no third-party attribution currently; recheck OpenAI terms before commercial release. |
| r17-frame-gap | spritesheet PNG | `assets/art/enemies/r17-frame-gap.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | [P31](#p31-r-17-common-production-prompt)+[P36](#p36-r17-frame-gap)；accepted original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-87988fa6-decd-47d3-9768-92e766ca9d48.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-frame-gap.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 256x64 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 256x64, 4x64x64 | no third-party attribution currently; recheck OpenAI terms before commercial release. |
| r17-brood-mass | spritesheet PNG | `assets/art/enemies/r17-brood-mass.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | [P31](#p31-r-17-common-production-prompt)+[P37](#p37-r17-brood-mass)；accepted original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-75cca67a-fe50-4ef3-917f-f3bb0fc00069.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-brood-mass.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 256x64 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 256x64, 4x64x64 | no third-party attribution currently; recheck OpenAI terms before commercial release. |
| r17-bud | spritesheet PNG | `assets/art/enemies/r17-bud.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | exact correction prompt [P39](#p39-r17-bud-dark-body-color-correction)；accepted original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-84d68222-3c80-4816-9e39-3e3c8acb2bf6.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-bud.png` | bundled chroma helper；four equal cells；per-cell union alpha bbox；one shared nearest scale；common center/bottom baseline；binary alpha；no-dither <=32-color RGBA output。审计 normalizer 原先错误地将 extent 22 硬编码为单一青色，本次删除该分支，使 extent 22 与其他尺寸使用同一套确定性多色分类/量化规则；未逐帧手绘、未使用单色替换、未放宽门禁；final 128x32 | Project-commissioned generation; approved project source was the only image input; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation and visual-semantic gates admitted | 128x32, 4x32x32 | Rejected retries retained, never production: `r17-bud-rejected-short-frame4.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-359238e9-ac2c-4c4b-8b1f-ac934ec2f0d9.png`, short frame 4), `r17-bud-rejected-area-variance.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-671f4a03-3de3-42e8-9dc4-ff79db24a068.png`, area ratio >1.20; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `r17-bud-rejected-color-collapse.png` (original `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-2ff87af1-292f-49bd-8f4c-46a4fb39df19.png`, committed output collapsed to one cyan opaque color; exact correction prompt unavailable in repository; do not attribute to base prompt alone). |
| contact-shadow | PNG | `assets/art/effects/contact-shadow.png` | built-in `image_gen` (default `gpt-image-2` path) + installed `remove_chroma_key.py` + `normalize_pixel_asset.py` | 2026-07-16 | [P57](#p57-contact-shadow)；raw `.superpowers/sdd/combat-feedback-assets/source/contact-shadow-imagegen-source.png` SHA-256 `FF81167A22419ED0AD2A179D0CFAD263EB4B943C4B47FDAB6A73A79886C6521D`；cutout `.superpowers/sdd/combat-feedback-assets/source/contact-shadow-imagegen-cutout.png` SHA-256 `FB2E5BC1DB914F0938888971774C070782DA7989222E7B402E969DBB1D8C31BF` | installed chroma removal auto-key border, soft matte, thresholds 12/220, despill; detected `#1ef612`; deterministic `normalize_pixel_asset.py --width 32 --height 16 --fit contain --alpha binary --colors 16`; final SHA-256 `A6CC8084C4E185CFBB8FBA36139F2DBA9092926C26B7CE491851C7B4DD7CF26C` | Project-commissioned generation; no third-party image input; commercial release must recheck OpenAI output rights and service terms | candidate pending commercial review | Combat Feedback Task 1 production admission | 32×16 RGBA, binary alpha | No third-party attribution currently; recheck OpenAI terms before commercial release. No rejected or interrupted candidate was supplied for this artifact. |

## 原始提示

以下代码块记录实际提交给内置 `image_gen` 的提示。生成源文件保留在本机 Codex `generated_images` 目录，仓库只接收清理后的目标尺寸 PNG。

### P1 facility-floor

```text
Use case: stylized-concept
Asset type: seamless production floor tile for a 2D top-down Phaser game, logical 32 by 32 pixels
Primary request: one square Foundation-like industrial facility floor plate viewed perfectly orthographically from directly overhead
Subject: sealed gunmetal floor panel, subtle quadrant seams, recessed bolts, restrained scratches and grime, no single focal object
Style/medium: authentic modern detailed pixel art on a coarse explicit pixel grid, strict hard square pixel clusters, limited palette, tileable game texture
Composition: exact square edge-to-edge material tile, flat orthographic top-down, no perspective, designed to repeat on all four sides
Lighting/mood: restrained overhead cold-white facility light, professional but worn industrial horror
Color palette: coal black, dirty graphite grey, cold steel grey, tiny muted amber hazard accents
Constraints: fully opaque image; seamless left-right and top-bottom edges; uniform material scale; no text, numbers, logo, watermark, border frame, large crack or unique centerpiece; hard pixels only, no antialiasing, no smooth gradients
Avoid: 3D render, PBR sphere, perspective floor, isometric diamond, photorealism, smooth painting, checkerboard transparency, UI panel
```

### P2 facility-wall

```text
Use case: stylized-concept
Asset type: modular perimeter wall tile for a 2D top-down Phaser game, logical 64 by 64 pixels
Primary request: one Foundation-like reinforced concrete and steel wall module viewed from a high orthographic overhead camera
Subject: thick horizontal wall segment with a dark top cap, cold grey concrete face, steel reinforcement strip, bolts, grime and one restrained amber service light; readable as a wall not a floor
Style/medium: authentic modern detailed pixel art on a coarse explicit pixel grid, strict hard square pixel clusters, limited palette
Composition: square isolated module, wall runs continuously from left edge to right edge for tiling; top-down world with a short visible wall face, no isometric geometry
Scene/backdrop: perfectly flat solid chroma-key green #00ff00 only around the wall silhouette
Lighting/mood: overhead-left cold facility light, industrial containment horror
Constraints: uniform #00ff00 background with no gradient shadow texture glow floor or reflection; no green on wall; no text, number, logo or watermark; hard opaque pixels, no antialiasing or semitransparent edge
Avoid: 3D render, pseudo-3D, isometric diamond wall, perspective corridor, photorealism, smooth illustration, giant focal prop, multiple modules, UI frame
```

### P3 facility-door

```text
Use case: stylized-concept
Asset type: orthographic north-wall security door module for a top-down 2D Phaser game, logical 64 by 64 pixels
Primary request: a sealed sliding containment door seen from almost directly overhead as part of the north perimeter wall
Subject: horizontal steel threshold and two sliding door leaves compressed into a shallow band, center seam, top cap, rails, restrained amber-red status lamps; only the top surfaces and a very short inner wall face are visible
Composition: the entire door is a wide horizontal strip about 58 logical pixels wide and 20 to 26 pixels tall, centered in a square transparent canvas; left and right ends align with a horizontal wall module
Camera: 80-degree overhead orthographic plan view; absolutely no full upright door panel
Color palette intent: coal black, graphite, steel grey, cold white, muted amber and restrained red, maximum 24 colors
Style/medium: authentic modern detailed 2D pixel game asset on an explicit coarse pixel grid with broad deliberate color clusters and no micro-noise.
Scene/backdrop: perfectly flat solid chroma-key green #00ff00.
Constraints: one isolated object; uniform green background with no gradient shadow texture floor glow or reflection; no green on object; no text logo watermark; hard opaque pixel edges.
Avoid: front elevation, eye-level view, 3D render, pseudo-3D, isometric diamond scene, photorealism, smooth painting, tiny noisy highlights, UI frame.
```

### P4 facility-console

```text
Use case: stylized-concept
Asset type: top-down floor control console for a 2D Phaser game, logical 64 by 64 pixels
Primary request: one compact facility operator console seen almost directly from above
Subject: low floor-mounted desk footprint with a dark recessed screen surface, blocky keypad, two cables and amber/red status pixels; the top plane is dominant and the front face is only a 2-pixel dark lip
Composition: compact near-square footprint about 42 by 34 logical pixels, centered with transparent padding, no upright cabinet
Camera: 75-degree overhead orthographic plan view
Color palette intent: coal black, dirty steel grey, cold white, muted amber and restrained red, maximum 24 colors
Style/medium: authentic modern detailed 2D pixel game asset on an explicit coarse pixel grid with broad deliberate color clusters and no micro-noise.
Scene/backdrop: perfectly flat solid chroma-key green #00ff00.
Constraints: one isolated object; uniform green background with no gradient shadow texture floor glow or reflection; no green on object; no text logo watermark; hard opaque pixel edges.
Avoid: front elevation, eye-level view, 3D render, pseudo-3D, isometric diamond scene, photorealism, smooth painting, tiny noisy highlights, UI frame.
```

### P5 facility-vent

```text
Use case: stylized-concept
Asset type: floor ventilation or drain grate sprite for a 2D top-down Phaser game, logical 32 by 32 pixels
Primary request: one square industrial facility ventilation and drainage grate seen perfectly orthographically from directly overhead
Subject: dark steel square inset frame, parallel slats, four corner bolts, oily grime, tiny restrained rust accents
Style/medium: authentic modern detailed pixel art on a coarse explicit pixel grid, hard square pixel clusters, limited palette
Composition: one centered near-square grate with generous padding, exact top-down view
Scene/backdrop: perfectly flat solid chroma-key green #00ff00 around the grate
Lighting/mood: cold overhead facility light, industrial horror
Constraints: uniform green background without gradient shadow texture floor glow or reflection; no green on subject; no text, number, logo or watermark; hard opaque pixels only, no antialiasing or semitransparent edge
Avoid: 3D render, pseudo-3D, isometric view, perspective, photorealism, smooth illustration, multiple objects, UI frame
```

### P6 facility-decal

```text
Use case: stylized-concept
Asset type: floor contamination decal sprite for a 2D top-down Phaser game, logical 32 by 32 pixels
Primary request: one irregular restrained blood-and-black-contamination floor decal viewed perfectly orthographically from directly overhead
Subject: dark dried blood smear mixed with a small branching black anomalous residue and two tiny scratch fragments; no body parts, no text, no symbol
Style/medium: authentic detailed pixel art on a coarse explicit pixel grid, hard square pixel clusters, limited palette
Composition: one asymmetric low-profile decal centered with generous transparent padding, no floor tile beneath it
Scene/backdrop: perfectly flat solid chroma-key green #00ff00
Lighting/mood: dirty restrained industrial horror, no glow
Constraints: uniform #00ff00 background without gradient shadow texture floor or reflection; no green on decal; hard opaque pixels only; no antialiasing, semitransparent edge, text, logo or watermark
Avoid: 3D render, isometric view, photorealistic gore, body parts, giant puddle, smooth painting, multiple decals, UI icon frame
```

### P7 player

```text
Use case: stylized-concept
Asset type: production 2D top-down action game character sprite master
Primary request: one tactical containment operative seen from a high overhead camera, facing screen-down, designed to occupy a square logical 48 by 48 sprite
Subject: serious adult operative in charcoal armor and sealed mask, both hands holding one compact pistol low-ready; visible crown of head, shoulders, upper torso, forearms and foreshortened legs; one head, two arms, two legs
Style/medium: authentic modern detailed pixel sprite art on a coarse explicit pixel grid, hard square pixel clusters, limited palette, no smooth painting
Composition/framing: true top-down action-game view with a restrained three-quarter body view, camera pitched about 60 degrees downward; compact near-square silhouette approximately 30 logical pixels wide by 38 high; centered, full body, feet share one ground-contact line; generous empty padding
Lighting/mood: overhead-left cold facility light, industrial horror, tactical survival
Color palette: coal black, dirty grey, cold white, muted blue-grey, tiny amber equipment light
Scene/backdrop: perfectly flat solid chroma-key green #00ff00
Constraints: exactly one isolated sprite; background must be uniform #00ff00 with no gradient, shadow, texture, glow, floor or reflection; no #00ff00 on subject; hard opaque pixels only; no antialiasing, no semitransparent edge, no text, no logo, no watermark
Avoid: front-facing portrait or paper-doll view, side view, low camera, long realistic standing proportions, 3D render, pseudo-3D, isometric diamond view, photorealism, smooth illustration, chibi, cute style, oversized head, extra limbs, extra weapons, multiple characters, animation sheet, UI frame
```

### P8 infected-staff

```text
Use case: stylized-concept
Asset type: production enemy sprite master for a 2D top-down Phaser game, logical 48 by 48 pixels
Primary request: one infected former facility employee, aggressive unsteady stance, readable as a corrupted human worker rather than a generic zombie
Subject: torn dirty grey maintenance coveralls under remnants of a cold-white facility lab coat, damaged ID lanyard with no readable text, one shoulder twisted by dark red-black infection, pale face, two arms and two legs, no gore obscuring silhouette
Lighting/mood: overhead-left cold facility light, industrial horror, restrained blood-red infection accents
Style/medium: authentic modern detailed 2D pixel sprite art on a coarse explicit pixel grid, hard square pixel clusters, limited palette, no smooth painting.
Composition: true top-down action-game view with restrained three-quarter body view, high overhead camera pitched about 60 degrees downward, screen-down facing, one isolated full-body sprite, centered with generous padding and a clear horizontal foot contact line.
Scene/backdrop: perfectly flat solid chroma-key green #00ff00.
Constraints: uniform #00ff00 background without gradient shadow texture glow floor or reflection; no #00ff00 on subject; hard opaque pixels only; no antialiasing, semitransparent edge, text, logo or watermark.
Avoid: 3D render, pseudo-3D, isometric diamond view, front-facing paper doll, low camera, photorealism, smooth illustration, chibi, cute style, oversized head, extra limbs, multiple characters, animation sheet, UI frame.
```

### P9 scp-049

```text
Use case: stylized-concept
Asset type: SCP-049 plague doctor boss sprite for a top-down 2D Phaser action game, logical 64 by 80 pixels
Primary request: one hooded plague doctor viewed from a high overhead camera, facing screen-down
Subject: plain black cloth hood with the top of the hood visible, ivory bird-beak mask projecting toward bottom of screen, broad dark shoulders, foreshortened torso, long black coat spreading into two tails, short partly hidden legs, one simple dark cane; no crown, no hat ornament, no gold headpiece, no royal clothing
Composition: compact high-angle silhouette approximately 42 logical pixels wide by 58 high inside a 64 by 80 canvas, centered, feet share one line; beak and coat remain unmistakable
Camera: orthographic action-game view pitched 65 degrees downward; crown of the head means the top surface of the plain cloth hood, not a royal crown; restrained three-quarter body view, not standing front portrait
Style/medium: authentic modern detailed 2D pixel sprite on explicit coarse grid, broad deliberate color clusters, maximum 24 colors, no micro-noise
Color palette: coal black, graphite, muted crimson lining, dark leather brown, ivory mask
Scene/backdrop: perfectly flat solid chroma-key green #00ff00
Constraints: exactly one isolated character; uniform green background without gradient shadow texture floor glow reflection; no green on subject; no antialiasing semitransparent edge text logo watermark; one head two arms two legs
Avoid: crown, tiara, spikes around hood, gold headwear, royal costume, front elevation, eye-level view, 3D render, pseudo-3D, isometric diamond scene, photorealism, smooth painting, chibi, giant bodybuilder proportions, extra limbs, multiple characters, UI frame
```

## Task 2 武器图标登记

以下三项由主流程生成并交接。工具未公开具体模型名，故不推断模型或许可证；三项均未使用第三方图像输入。`Admission` 仍为静态门禁候选，商业发布前必须复核服务条款、输出权利与项目许可义务。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| weapon-pistol-icon | PNG | `assets/art/weapons/pistol.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P15](#p15-weapon-pistol-icon-96)；仅文本输入 | 原图 1254×1254；官方 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；alpha 二值裁切；nearest 等比缩入 86×86 内容区并居中至 96×96；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(5,12,91,84)`，31 个不透明颜色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 | 96×96 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| weapon-breacher-icon | PNG | `assets/art/weapons/breacher.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P16](#p16-weapon-breacher-icon-96)；仅文本输入 | 原图 1254×1254；同上官方去色键流程；alpha 二值裁切；nearest 等比缩入 86×86 内容区并居中至 96×96；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(5,29,91,66)`，32 个不透明颜色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 | 96×96 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| weapon-tesla-icon | PNG | `assets/art/weapons/tesla.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P17](#p17-weapon-tesla-icon-96)；仅文本输入 | 原图 1254×1254；同上官方去色键流程；alpha 二值裁切；nearest 等比缩入 86×86 内容区并居中至 96×96；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(5,13,91,83)`，32 个不透明颜色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 | 96×96 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |

## Opening production 已生成素材

以下条目已生成并进入 manifest；生产信息、最终尺寸与署名要求均按实际产物登记。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title-facility-backdrop | PNG | `assets/art/menus/title-facility-backdrop.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P13](#p13-title-facility-backdrop)；仅文本输入 | 原图 1672×941 RGB；Pillow 12.2.0 LANCZOS 精确缩放至 960×540；MEDIANCUT 无抖动量化为 32 色；转 8-bit RGBA 并将 alpha 固定为 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 | 960×540 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| armory-rack-backdrop | PNG | `assets/art/menus/armory-rack-backdrop.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P14](#p14-armory-rack-backdrop)；仅文本输入 | 原图 1672×941 RGB；Pillow 12.2.0 LANCZOS 精确缩放至 960×540；MEDIANCUT 无抖动量化为 32 色；转 8-bit RGBA 并将 alpha 固定为 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 | 960×540 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-service-floor | PNG | `assets/art/facility/service-floor.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P18](#p18-facility-service-floor)；仅文本输入 | 原图 1254×1254 RGB；中心正方形裁切；nearest 精确缩至 32×32；MEDIANCUT 无抖动量化为 32 色；复制首行/列到末行/列形成逐像素闭合边界；转 8-bit RGBA，alpha 固定 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-hazard-stripe | PNG | `assets/art/facility/hazard-stripe.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P19](#p19-facility-hazard-stripe)；仅文本输入 | 原图 1254×1254 RGB；中心正方形裁切；nearest 精确缩至 32×32；MEDIANCUT 无抖动量化为 32 色；复制首行/列到末行/列形成逐像素闭合边界；转 8-bit RGBA，alpha 固定 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-observation-window | PNG | `assets/art/facility/observation-window.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P20](#p20-facility-observation-window)；仅文本输入 | 原图 1536×1024 RGB；官方 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；alpha 以 128 阈值二值化并按 bbox 裁切；nearest 等比缩入 92×60 内容区并居中至 96×64；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(2,13,94,51)`，32 个不透明色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 | 96×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-pipe-bank | PNG | `assets/art/facility/pipe-bank.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P21](#p21-facility-pipe-bank)；仅文本输入 | 原图 1536×1024 RGB；官方 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；alpha 以 128 阈值二值化并按 bbox 裁切；nearest 等比缩入 92×60 内容区并居中至 96×64；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(2,16,94,48)`，32 个不透明色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 | 96×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| player-opening-sheet | PNG spritesheet | `assets/art/characters/player-opening-sheet.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露）+ Node.js nearest/binary-alpha assembly | 2026-07-13 | 原概念源 [P22](#p22-player-opening-sheet)；补帧 [P25](#p25-player-idle-hit-remediation-source)；两次 walk 调用 [P26](#p26-player-walk-remediation-attempt-no-output)、[P29](#p29-player-walk-remediation-retry-no-output) 均无输出 | 补帧原图 `local-generation-archive:019f5a0e-95c3-72b0-969d-7fc51a88a89f/exec-1edce71f-7d84-477f-94c5-36e33f44ebaa.png`；以绿幕距离/绿色优势生成 binary alpha；4×6 alpha bbox 提取；idle 使用新源列 0–3，move 使用原源 idle/move 与新源列 0–3 共 6 个真实姿势，hit 使用新源列 4–5；nearest 等比缩入 40×42、渲染后脚底对齐 y=44；映射到原 player sheet 的 32 色 palette；输出 576×192、8-bit RGBA、alpha 0/255。工作源见 `.superpowers/sdd/opening-task-6-fix-sources/` | 项目定制生成；唯一 reference 为原项目定制生成源板；无第三方图像输入；未声明独立许可证，商业发布前复核 OpenAI 服务条款与输出权利；当前无第三方署名要求 | 候选；商业发布前复核 | 开局动画候选（真实动作帧修复） | 576×192 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| infected-opening-sheet | PNG spritesheet | `assets/art/characters/infected-opening-sheet.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露）+ Node.js nearest/binary-alpha assembly | 2026-07-13 | 原概念源 [P24](#p24-infected-opening-sheet-successful-source)；补帧 [P27](#p27-infected-idle-hit-remediation-source)、[P28](#p28-infected-walk-remediation-source) | idle/hit 原图 `local-generation-archive:019f5a0e-95c3-72b0-969d-7fc51a88a89f/exec-b6192a8e-30e2-472e-9424-22cb24026894.png`；walk 原图 `local-generation-archive:019f5a0e-95c3-72b0-969d-7fc51a88a89f/exec-4bb36632-a0dd-46e3-99d3-9127e6ac047a.png`；binary alpha 与 4×6 alpha bbox 提取；idle 列 0–3 / walk 列 0–5 / hit 列 4–5；nearest 等比缩入 40×42、脚底 y=44；映射到原 infected sheet 的 32 色 palette；输出 576×192、8-bit RGBA、alpha 0/255。工作源见 `.superpowers/sdd/opening-task-6-fix-sources/` | 项目定制生成；唯一 reference 为原项目定制生成源板；无第三方图像输入；未声明独立许可证，商业发布前复核 OpenAI 服务条款与输出权利；当前无第三方署名要求 | 候选；商业发布前复核 | R-17 roster 替换后停止 preload 的历史/溯源保留素材 | 576×192 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |

### P13 title-facility-backdrop

```text
960x540 orthographic 2D pixel-art game background, Foundation containment facility security checkpoint during an early containment breach. Left 44 percent intentionally low-detail and dark for title/UI readability. Right side has a coherent wall-connected half-open blast door, observation monitor bank, conduit pipes and red rotating warning lamp. Top-down/near-orthographic 2D only, no 3D render, no isometric camera, no characters, no text, no logos, no UI, no loose floating props. Steel blue and graphite base, restrained amber and deep red signals, hard pixel edges, detailed but controlled 32-pixel module language.
```

### P14 armory-rack-backdrop

```text
Use case: stylized-concept
Asset type: production 960x540 game menu background for a 2D Phaser armory loadout screen
Primary request: 960x540 orthographic 2D pixel-art Foundation armory wall, three coherent illuminated equipment bays connected by one metal rack structure, central bay emphasized but empty, cables and status lamps attached to the rack
Scene/backdrop: full-screen dark industrial armory wall, all three empty bays integrated into one continuous structure
Style/medium: detailed 2D pixel art with hard pixel edges, readable under a high-definition tactical overlay
Composition/framing: exact 16:9 landscape composition, straight-on orthographic view, three narrow bays spanning the center, usable darker space near top and bottom for overlay text and controls
Lighting/mood: professional oppressive containment-facility lighting
Color palette: dark graphite and steel blue with controlled amber and cyan signals
Constraints: no weapons, no text, no UI, no characters, no logos, no watermark, no 3D render, no isometric perspective, no rounded card panels
```

### P15 weapon-pistol-icon-96

```text
Use case: stylized-concept
Asset type: production 96x96 transparent-background weapon illustration for a 2D Phaser armory loadout screen
Primary request: detailed pixel-art orthographic equipment illustration of one Foundation duty pistol
Subject: one mechanically plausible compact duty semi-automatic pistol with clear slide, short barrel, trigger guard and textured grip; steel graphite body with restrained blue-grey accents
Style/medium: authentic detailed 2D pixel art, deliberate hard pixel clusters, technical inventory illustration
Composition/framing: isolated single weapon in side-three-quarter technical inventory view, centered with generous padding, fully inside the square frame, instantly readable at 96x96
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane or lighting variation; crisp subject edges; do not use #00ff00 anywhere in the weapon; no cast shadow, no contact shadow, no reflection, no hands, no text, no logo, no watermark, no glow outside the 96x96 frame
Avoid: 3D render, isometric environment, extra weapons, muzzle flash, smooth painted edges
```

### P16 weapon-breacher-icon-96

```text
Use case: stylized-concept
Asset type: production 96x96 transparent-background weapon illustration for a 2D Phaser armory loadout screen
Primary request: detailed pixel-art orthographic equipment illustration of one containment breacher shotgun
Subject: one mechanically plausible compact short-barrel pump-action breaching shotgun with thick muzzle, tubular magazine, pump fore-end and compact stock; heavier silhouette than a pistol; steel graphite body with restrained Foundation blue-grey accents
Style/medium: authentic detailed 2D pixel art, deliberate hard pixel clusters, technical inventory illustration
Composition/framing: isolated single weapon in side-three-quarter technical inventory view, centered with generous padding, fully inside the square frame, instantly readable at 96x96
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane or lighting variation; crisp subject edges; do not use #00ff00 anywhere in the weapon; no cast shadow, no contact shadow, no reflection, no hands, no shells, no blast, no text, no logo, no watermark, no glow outside the 96x96 frame
Avoid: 3D render, isometric environment, extra weapons, muzzle flash, smooth painted edges
```

### P17 weapon-tesla-icon-96

```text
Use case: stylized-concept
Asset type: production 96x96 transparent-background weapon illustration for a 2D Phaser armory loadout screen
Primary request: detailed pixel-art orthographic equipment illustration of one compact Tesla projector
Subject: one mechanically plausible compact handheld industrial electrical projector with twin exposed copper induction coils, central steel emitter fork, insulated grip, cable housing and two tiny cold-cyan charge cells; steel graphite body with restrained Foundation blue-grey accents
Style/medium: authentic detailed 2D pixel art, deliberate hard pixel clusters, technical inventory illustration
Composition/framing: isolated single weapon in side-three-quarter technical inventory view, centered with generous padding, fully inside the square frame, instantly readable at 96x96
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane or lighting variation; crisp subject edges; do not use #00ff00 anywhere in the weapon; no cast shadow, no contact shadow, no reflection, no hands, no text, no logo, no watermark, no glow or electricity outside the 96x96 frame
Avoid: 3D render, isometric environment, extra weapons, magical wand, smooth painted edges
```

### P18 facility-service-floor

```text
Use case: stylized-concept
Asset type: seamless production service-floor tile for a 2D top-down Phaser containment-facility game, final logical size 32 by 32 pixels
Primary request: one square modular maintenance service-floor plate viewed perfectly orthographically from directly overhead, designed to tile seamlessly on all four edges
Subject: dark graphite steel access plate with broad cold steel-blue lane bands, shallow panel seams, restrained bolt clusters and minimal worn grime; no unique focal mark
Style/medium: authentic detailed 2D pixel art on a coarse explicit square pixel grid, hard pixel clusters, limited palette, no antialiasing
Composition/framing: a single material tile fills the entire square edge-to-edge; flat top-down orthographic view; repeating edge structure must align left-to-right and top-to-bottom
Lighting/mood: professional oppressive industrial facility, subdued cold overhead light
Color palette: coal black, graphite grey, desaturated steel blue, cold grey, very small muted amber maintenance accents
Constraints: fully opaque; seamless on all four edges; no transparency, text, numbers, logo, watermark, border frame, large crack, unique centerpiece, characters or loose props
Avoid: 3D render, PBR, perspective floor, isometric diamond view, photorealism, smooth gradients, smooth painting, checkerboard transparency, UI panel
```

### P19 facility-hazard-stripe

```text
Use case: stylized-concept
Asset type: seamless production hazard-stripe floor tile for a 2D top-down Phaser containment-facility game, final logical size 32 by 32 pixels
Primary request: one restrained industrial warning strip material viewed perfectly orthographically from directly overhead, designed to tile seamlessly on all four edges
Subject: narrow diagonal muted-amber and charcoal safety bands painted onto worn dark steel, with subtle chips and grime that do not interrupt the repeating rhythm
Style/medium: authentic detailed 2D pixel art on a coarse explicit square pixel grid, hard pixel clusters, limited palette, no antialiasing
Composition/framing: a single continuous material tile fills the entire square edge-to-edge; straight top-down orthographic view; diagonal stripe spacing and edge colors must repeat exactly left-to-right and top-to-bottom
Lighting/mood: controlled professional industrial warning, oppressive facility atmosphere, not bright construction signage
Color palette: charcoal, graphite, dirty steel grey, restrained dark amber and ochre
Constraints: fully opaque; seamless on all four edges; no transparency, text, numbers, logo, watermark, frame, symbols, characters or loose props
Avoid: 3D render, perspective floor, isometric diamond view, photorealism, smooth gradients, glossy reflective tape, fluorescent yellow, warning text, UI panel
```

### P20 facility-observation-window

```text
Use case: stylized-concept
Asset type: production transparent modular observation-window fixture for a 2D top-down Phaser containment-facility game, final logical size 96 by 64 pixels
Primary request: one wall-mounted reinforced containment observation window module, readable from a strict orthographic overhead 2D game camera
Subject: a wide low steel frame with a dark blue-black observation pane, reinforced sill, two restrained cold-cyan status lamps and attached corner fasteners; mechanically coherent as part of a wall, not a freestanding screen
Style/medium: authentic detailed 2D pixel art on a coarse explicit square pixel grid, hard opaque pixel clusters, limited palette, no antialiasing
Composition/framing: exactly one horizontal module, centered with generous uniform padding, complete silhouette fully separated from background
Lighting/mood: professional oppressive industrial containment facility
Color palette: graphite, desaturated steel blue, cold grey, dark blue-black glass, tiny muted cyan and amber signals
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane or lighting variation; do not use #00ff00 anywhere in the subject; crisp hard subject edges; no cast shadow, contact shadow, reflection, text, logo, watermark, characters or loose props
Avoid: 3D render, pseudo-3D, isometric view, perspective wall, front-facing UI monitor, floating sticker, photorealism, smooth painting, soft transparency
```

### P21 facility-pipe-bank

```text
Use case: stylized-concept
Asset type: production transparent modular pipe-bank fixture for a 2D top-down Phaser containment-facility game, final logical size 96 by 64 pixels
Primary request: one wall-attached maintenance pipe bank, readable from a strict orthographic overhead 2D game camera
Subject: three parallel heavy steel conduit pipes secured to one dark mounting rail, with coherent elbows, clamps, one compact pressure junction and restrained amber service tags without text; clearly a single wall service module
Style/medium: authentic detailed 2D pixel art on a coarse explicit square pixel grid, hard opaque pixel clusters, limited palette, no antialiasing
Composition/framing: exactly one horizontal rectangular module, centered with generous uniform padding, complete silhouette fully separated from background
Lighting/mood: professional oppressive industrial containment facility, worn but maintained
Color palette: graphite, gunmetal, desaturated steel blue, dirty cold grey, muted copper and tiny restrained amber
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane or lighting variation; do not use #00ff00 anywhere in the subject; crisp hard subject edges; no cast shadow, contact shadow, reflection, text, logo, watermark, characters, steam, leaks or loose props
Avoid: 3D render, pseudo-3D, isometric view, perspective wall, floating sticker, photorealism, smooth painting, soft transparency, tangled plumbing
```

### P22 player-opening-sheet

```text
Use case: stylized-concept
Asset type: production source reference sheet for a 48x48-per-frame top-down 2D pixel-art game character spritesheet
Primary request: Create exactly twelve isolated pose references of the same adult Foundation tactical survivor, arranged as a clean 4-row by 3-column grid.
Row order from top to bottom: facing down toward the viewer, facing left, facing right, facing up away from the viewer.
Column order from left to right: calm idle stance, clearly different mid-stride movement pose, clearly recoiling hit pose.
Subject: one consistent adult realistic-proportion survivor in a dark navy protective suit, compact chest rig, pale shoulder insignia with no readable text, black boots, and a clearly held compact weapon pointing in the facing direction.
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited steel-blue and graphite palette, no antialiasing.
Composition/framing: exact 4 by 3 evenly spaced grid, one complete full-body character per cell, identical scale in every cell, generous separation and padding, stable feet position within each row. No cell borders.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use #00ff00 anywhere in the character; crisp opaque subject edges; each pose must be visibly different; direction and weapon orientation must be unambiguous; no cast shadow, contact shadow, reflection, text, labels, numbers, logo, watermark, extra characters, loose props, muzzle flash, blood, or scenery.
Avoid: chibi or Q-version proportions, oversized head, 3D render, isometric view, side-view platform sprite, front-perspective character sheet, smooth painting, soft transparency, duplicated identical poses.
```

### P23 infected-opening-sheet-first-attempt-no-output

该次 built-in `image_gen` 调用持续约 5 分钟无输出，随后按用户指令终止；未产生可用源文件，也未进入后处理。逐字 prompt：

```text
Use case: stylized-concept
Asset type: production source reference sheet for a 48x48-per-frame top-down 2D pixel-art game character spritesheet
Primary request: Create exactly twelve isolated pose references of the same adult infected Foundation maintenance worker, arranged as a clean 4-row by 3-column grid.
Row order from top to bottom: facing down toward the viewer, facing left, facing right, facing up away from the viewer.
Column order from left to right: tense uneven idle stance, clearly different lurching mid-stride movement pose, clearly recoiling hit pose.
Subject: one consistent adult realistic-proportion infected maintenance worker in a torn grey-blue work uniform, dark work boots, utility belt, asymmetric diseased posture, readable head and arms, and only restrained dark dried blood on one sleeve and collar.
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited grey-blue, graphite and restrained dark-red palette, no antialiasing.
Composition/framing: exact 4 by 3 evenly spaced grid, one complete full-body character per cell, identical scale in every cell, generous separation and padding, stable feet position within each row. No cell borders.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal.
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; do not use #00ff00 anywhere in the character; crisp opaque subject edges; each pose must be visibly different; facing direction must be unambiguous; no cast shadow, contact shadow, reflection, text, labels, numbers, logos, watermark, extra characters, loose props, gore, exposed organs, or scenery.
Avoid: chibi or Q-version proportions, oversized head, zombie caricature, excessive blood, 3D render, isometric view, side-view platform sprite, front-perspective character sheet, smooth painting, soft transparency, duplicated identical poses.
```

### P24 infected-opening-sheet-successful-source

```text
Use case: stylized-concept
Asset type: source pose grid for a production 48x48 top-down 2D pixel-art game spritesheet
Primary request: exactly 12 isolated poses of one consistent adult infected Foundation maintenance worker in a 4-row by 3-column grid.
Rows, top to bottom: facing down, facing left, facing right, facing up. Columns, left to right: tense idle, visibly different lurching mid-stride, visibly different hit recoil.
Subject: realistic adult proportions; torn grey-blue maintenance uniform; dark work boots; utility belt; asymmetric diseased posture; readable head and arms; restrained dark dried blood only on one sleeve and collar.
Style/medium: detailed orthographic top-down 2D pixel art, hard deliberate pixel clusters, limited grey-blue/graphite/dark-red palette, no antialiasing.
Composition: equal scale, full body, generous separation and padding, stable feet within each row, no borders.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background.
Constraints: no #00ff00 in the character; no shadows, gradients, floor, reflections, text, labels, logos, watermark, extra characters, props, gore, or scenery; crisp opaque edges; every pose distinct and direction unambiguous.
Avoid: chibi, oversized head, zombie caricature, excess blood, 3D, isometric, side-view, smooth painting, soft transparency, duplicated poses.
```

### P25 player-idle-hit-remediation-source

Reference：`local-generation-archive:019f59e7-6613-73d3-9ac1-a2f4baa76dcd/exec-3d058fc0-8885-4f0b-9121-627db2e44d05.png`。输出：`local-generation-archive:019f5a0e-95c3-72b0-969d-7fc51a88a89f/exec-1edce71f-7d84-477f-94c5-36e33f44ebaa.png`。

```text
Use case: stylized-concept
Asset type: additional source pose board for a production 48x48-per-frame top-down 2D pixel-art game character spritesheet
Input images: Image 1 is the sole character identity, uniform, gear, palette, orthographic viewpoint, and pixel-art style reference.
Primary request: Generate exactly 24 isolated poses of the SAME Foundation tactical survivor from Image 1, arranged as a precise 4-row by 6-column grid.
Rows from top to bottom: natively drawn facing down toward viewer; facing left; facing right; facing up away from viewer. Do not create left/right rows by mirroring.
Columns 1-4: four genuinely articulated idle phases. Pose 1 balanced low-ready stance; pose 2 weight shifted onto one leg with the opposite knee relaxed and shoulders subtly counter-rotated; pose 3 weight shifted to the other leg with weapon and elbows changing relative positions; pose 4 alert breath/scanning stance with distinct knee, shoulder, elbow, and weapon placement. Columns 5-6: two genuinely different hit recoil poses, one torso twisting and weapon arm pulling inward, the other shoulders recoiling back with the free arm and legs bracing differently.
Subject invariants: preserve the exact same adult realistic-proportion survivor identity, dark navy protective suit, compact chest rig, pale shoulder insignia without readable text, black boots, hair, face, equipment, and compact firearm from Image 1. Weapon points consistently in the row's facing direction except during the two recoil poses.
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited steel-blue/graphite palette, crisp opaque edges, no antialiasing.
Composition/framing: exact evenly spaced 4x6 grid, one complete full-body character per cell, identical character scale, generous uniform separation and padding, stable foot baseline within each row, no cell borders.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background for local removal.
Constraints: all 24 poses must have visibly different limb articulation after translation alignment; change knees, boot separation/angle, shoulders, elbows, hands, weapon relation, and torso angle—not whole-body position, bob, scale, mirroring, recolor, or one-pixel noise alone. No #00ff00 in character; no shadows, gradients, texture, floor, reflections, text, labels, numbers, logos, watermark, extra characters, props, muzzle flash, blood, or scenery.
Avoid: duplicated poses, translation-only copies, vertical bob-only frames, scaled copies, mirrored direction rows, chibi, oversized head, 3D, isometric, side-view, smooth painting, soft transparency.
```

### P26 player-walk-remediation-attempt-no-output

Reference 同 P25。调用超过 5 分钟无输出后终止，未生成源文件。

```text
Use case: stylized-concept
Asset type: six-phase walk-cycle source pose board for a production 48x48-per-frame top-down 2D pixel-art game character spritesheet
Input images: Image 1 is the sole character identity, uniform, gear, palette, orthographic viewpoint, and pixel-art style reference.
Primary request: Generate exactly 24 isolated poses of the SAME Foundation tactical survivor from Image 1, arranged as a precise 4-row by 6-column grid.
Rows from top to bottom: natively drawn facing down toward viewer; facing left; facing right; facing up away from viewer. Do not create left/right rows by mirroring.
Columns 1-6 are one coherent looping tactical walk cycle with six genuinely articulated gait phases: left-foot contact, left-foot load, passing pose, right-foot contact, right-foot load, opposite passing pose. Across the cycle, knees bend and exchange depth, boot spacing and angles change, hips and shoulders counter-rotate subtly, elbows and held weapon shift naturally with the stride, and the final-to-first transition loops cleanly. The survivor remains combat-ready rather than sprinting.
Subject invariants: preserve the exact same adult realistic-proportion survivor identity, dark navy protective suit, compact chest rig, pale shoulder insignia without readable text, black boots, hair, face, equipment, and compact firearm from Image 1. Weapon points consistently in the row's facing direction.
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited steel-blue/graphite palette, crisp opaque edges, no antialiasing.
Composition/framing: exact evenly spaced 4x6 grid, one complete full-body character per cell, identical character scale, generous uniform separation and padding, stable foot baseline within each row, no cell borders.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background for local removal.
Constraints: every neighboring phase and phase 6 back to phase 1 must remain visibly different after translation alignment; real changes must affect legs, boots, knees, hips, shoulders, elbows, hands, and weapon relation—not whole-body translation, vertical bob, scaling, mirroring, recolor, or one-pixel noise alone. No #00ff00 in character; no shadows, gradients, texture, floor, reflections, text, labels, numbers, logos, watermark, extra characters, props, muzzle flash, blood, or scenery.
Avoid: duplicated poses, translation-only copies, vertical bob-only frames, scaled copies, mirrored direction rows, chibi, oversized head, 3D, isometric, side-view, smooth painting, soft transparency.
```

### P27 infected-idle-hit-remediation-source

Reference：`local-generation-archive:019f59e7-6613-73d3-9ac1-a2f4baa76dcd/exec-d4c287ef-366b-4f0f-983a-7e1b93fa44fe.png`。输出：`local-generation-archive:019f5a0e-95c3-72b0-969d-7fc51a88a89f/exec-b6192a8e-30e2-472e-9424-22cb24026894.png`。

```text
Use case: stylized-concept
Asset type: additional source pose board for a production 48x48-per-frame top-down 2D pixel-art game character spritesheet
Input images: Image 1 is the sole character identity, uniform, asymmetry, palette, orthographic viewpoint, and pixel-art style reference.
Primary request: Generate exactly 24 isolated poses of the SAME infected Foundation maintenance worker from Image 1, arranged as a precise 4-row by 6-column grid.
Rows from top to bottom: natively drawn facing down toward viewer; facing left; facing right; facing up away from viewer. Do not create left/right rows by mirroring.
Columns 1-4: four genuinely articulated tense idle phases. Pose 1 uneven slouch with one shoulder low; pose 2 weight sinks onto the wounded-side leg while the opposite knee and elbow change; pose 3 weight shifts to the other leg with head, shoulders, hands, and boot angles changed; pose 4 an unstable sway with distinct torso twist, arm hang, knee bend, and foot spacing. Columns 5-6: two genuinely different hit recoil poses, one folding sideways with arms reacting asymmetrically, the other twisting backward with legs bracing in a different configuration.
Subject invariants: preserve the exact same adult realistic-proportion infected worker identity, torn grey-blue maintenance uniform, dark work boots, utility belt, hair, facial damage, asymmetric diseased posture, restrained dark dried blood only on one sleeve and collar, and all equipment from Image 1.
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited grey-blue/graphite/restrained dark-red palette, crisp opaque edges, no antialiasing.
Composition/framing: exact evenly spaced 4x6 grid, one complete full-body character per cell, identical character scale, generous uniform separation and padding, stable foot baseline within each row, no cell borders.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background for local removal.
Constraints: all 24 poses must have visibly different limb articulation after translation alignment; change knees, boot separation/angle, hips, shoulders, elbows, hands, head angle, and torso bend—not whole-body position, bob, scale, mirroring, recolor, or one-pixel noise alone. No #00ff00 in character; no shadows, gradients, texture, floor, reflections, text, labels, numbers, logos, watermark, extra characters, props, gore, exposed organs, or scenery.
Avoid: duplicated poses, translation-only copies, vertical bob-only frames, scaled copies, mirrored direction rows, zombie caricature, excessive blood, chibi, oversized head, 3D, isometric, side-view, smooth painting, soft transparency.
```

### P28 infected-walk-remediation-source

Reference 同 P27。输出：`local-generation-archive:019f5a0e-95c3-72b0-969d-7fc51a88a89f/exec-4bb36632-a0dd-46e3-99d3-9127e6ac047a.png`。

```text
Use case: stylized-concept
Asset type: six-phase walk-cycle source pose board for a production 48x48-per-frame top-down 2D pixel-art game character spritesheet
Input images: Image 1 is the sole character identity, uniform, asymmetry, palette, orthographic viewpoint, and pixel-art style reference.
Primary request: Generate exactly 24 isolated poses of the SAME infected Foundation maintenance worker from Image 1 in a precise 4-row by 6-column grid.
Rows top to bottom: natively drawn facing down; facing left; facing right; facing up. Never mirror a direction row.
Columns 1-6: one coherent looping six-phase lurching walk cycle: left-foot contact, left-side load, passing pose, right-foot contact, right-side load, opposite passing pose. Make all phases genuinely articulated: alternating knee bend and depth, boot spacing and angle, uneven hip shift, asymmetric shoulder counter-rotation, head lag, elbow and hand swing, and changing torso bend. Phase 6 must loop naturally to phase 1.
Subject invariants: preserve the same adult realistic-proportion infected worker identity, torn grey-blue maintenance uniform, dark boots, utility belt, hair, facial damage, asymmetric diseased posture, restrained dark dried blood only on one sleeve and collar, and equipment from Image 1.
Style/medium: detailed orthographic top-down 2D pixel art, hard deliberate pixel clusters, limited grey-blue/graphite/dark-red palette, crisp opaque edges, no antialiasing.
Composition/framing: exact evenly spaced 4x6 grid, one full-body character per cell, identical scale, generous separation, stable foot baseline, no borders.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background.
Constraints: every adjacent phase and phase 6 back to phase 1 must differ after translation alignment through real limb and torso articulation; never use whole-body translation, vertical bob, scaling, mirroring, recolor, or one-pixel noise alone. No #00ff00 in subject; no shadows, gradients, floor, reflections, text, labels, logos, watermark, extra characters, props, gore, exposed organs, or scenery.
Avoid: duplicate poses, translation copies, bob-only frames, scaled copies, mirrored rows, zombie caricature, excessive blood, chibi, 3D, isometric, side-view, smooth painting, soft transparency.
```

### P29 player-walk-remediation-retry-no-output

Reference 同 P25。缩短 prompt 后再次调用，超过 5 分钟仍无输出并终止，未生成源文件。

```text
Use case: stylized-concept
Asset type: six-phase walk-cycle source pose board for a 48x48 top-down pixel-art game spritesheet
Input images: Image 1 is the sole identity/style reference.
Primary request: exactly 24 isolated poses of the SAME Foundation tactical survivor from Image 1, in an exact 4-row by 6-column grid.
Rows top-to-bottom: natively drawn facing down, left, right, up; never mirror a direction row. Columns 1-6: a coherent looping tactical walk cycle: left contact, left load, passing, right contact, right load, opposite passing.
Every phase must use real articulation: alternate knees and boot depth/spacing/angle, hip and shoulder counter-rotation, elbow/hand changes, and subtle firearm shift while remaining combat-ready. Frame 6 loops naturally to frame 1.
Preserve exactly: adult proportions and identity, dark navy protective suit, compact chest rig, pale shoulder insignia without readable text, black boots, hair, face, all gear, and compact firearm pointing in row direction.
Style: detailed orthographic top-down 2D pixel art, hard coarse pixel clusters, limited steel-blue/graphite palette, crisp opaque edges, no antialiasing.
Composition: evenly spaced 4x6 grid, one full body per cell, identical scale, generous separation, stable foot baseline, no borders.
Backdrop: perfectly flat uniform #00ff00 chroma key.
Constraints: adjacent phases and 6-to-1 remain visibly different after translation alignment; no translation-only, bob-only, scaling, mirroring, recolor, or one-pixel-noise variants. No green in subject, shadows, gradients, floor, reflection, text, labels, logos, watermark, extra characters, props, muzzle flash, blood, or scenery.
Avoid: duplicates, chibi, oversized head, 3D, isometric, side-view, smooth painting, soft transparency.
```

修复组装说明：built-in 输出先复制至 `.superpowers/sdd/opening-task-6-fix-sources/`。官方 `remove_chroma_key.py` 因当前 worktree 无可用 Python runtime 未能执行；未切换 CLI 或模型。实际使用项目临时 Node.js 组装脚本按四角绿幕色计算 RGB 距离（≤120）并要求绿色通道分别高于红、蓝 55，直接生成 alpha 0/255；随后按 alpha bbox 提取姿势、nearest 端点保持缩放、渲染后仅作脚底 y=44 对齐，并映射至对应旧 sheet 的 32 色 palette。该过程不绘制替代角色、不制造平移动作。独立审计脚本未导入生产测试函数；所有方向达到 idle 4/4、move 6/6、hit 2/2 normalized unique，最小循环相邻 changed-pixel ratio 为 0.8045。

历史使用记录：在 R-17 roster 替换前，`infected-opening-sheet` 曾在 `elapsedSurvivalMs < 60000` 时作为唯一权重大于 0 的普通敌人；该素材现已停止 preload，仅作历史/溯源保留，不代表当前运行时约束。

### P10 weapon-pistol-icon

```text
Use case: stylized-concept
Asset type: production weapon selection icon for a 2D industrial-horror Phaser game, logical 64 by 64 pixels
Style/medium: authentic detailed 2D pixel art on an explicit coarse pixel grid, broad deliberate clusters, maximum 24 colors, no micro-noise
Composition: exactly one isolated weapon, centered diagonally from lower-left to upper-right, fills about 48 by 28 logical pixels with generous padding, instantly readable at 64 by 64
Lighting/mood: cold overhead-left facility light, tactical Foundation-like equipment, worn professional metal
Color palette: coal black, graphite, steel grey, cold white, muted amber; restrained cold cyan only for electrical components
Scene/backdrop: perfectly flat solid chroma-key green #00ff00
Constraints: uniform green background without gradient shadow texture floor glow or reflection; no green on weapon; hard opaque pixel edges, no antialiasing or semitransparent edge; no text, number, logo, watermark, ammo, hands, character, UI border or pedestal
Avoid: 3D render, product photo, pseudo-3D showcase, isometric scene, smooth painting, chibi toy gun, extra weapons, muzzle flash, animation sheet
Primary request: compact duty semi-automatic pistol icon
Subject: one practical short-slide tactical pistol with clear barrel/slide, trigger guard and textured dark grip; restrained cold-white slide highlight and tiny amber chamber indicator
```

### P11 weapon-breacher-icon

```text
Use case: stylized-concept
Asset type: production weapon selection icon for a 2D industrial-horror Phaser game, logical 64 by 64 pixels
Style/medium: authentic detailed 2D pixel art on an explicit coarse pixel grid, broad deliberate clusters, maximum 24 colors, no micro-noise
Composition: exactly one isolated weapon, centered diagonally from lower-left to upper-right, fills about 48 by 28 logical pixels with generous padding, instantly readable at 64 by 64
Lighting/mood: cold overhead-left facility light, tactical Foundation-like equipment, worn professional metal
Color palette: coal black, graphite, steel grey, cold white, muted amber; restrained cold cyan only for electrical components
Scene/backdrop: perfectly flat solid chroma-key green #00ff00
Constraints: uniform green background without gradient shadow texture floor glow or reflection; no green on weapon; hard opaque pixel edges, no antialiasing or semitransparent edge; no text, number, logo, watermark, ammo, hands, character, UI border or pedestal
Avoid: 3D render, product photo, pseudo-3D showcase, isometric scene, smooth painting, chibi toy gun, extra weapons, muzzle flash, animation sheet
Primary request: compact breaching shotgun icon
Subject: one short-barrel pump-action breacher shotgun with thick muzzle, tubular magazine, pump fore-end and compact stock; heavier silhouette than the pistol, no shell or blast
```

### P12 weapon-tesla-icon

```text
Use case: stylized-concept
Asset type: production weapon selection icon for a 2D industrial-horror Phaser game, logical 64 by 64 pixels
Style/medium: authentic detailed 2D pixel art on an explicit coarse pixel grid, broad deliberate clusters, maximum 24 colors, no micro-noise
Composition: exactly one isolated weapon, centered diagonally from lower-left to upper-right, fills about 48 by 28 logical pixels with generous padding, instantly readable at 64 by 64
Lighting/mood: cold overhead-left facility light, tactical Foundation-like equipment, worn professional metal
Color palette: coal black, graphite, steel grey, cold white, muted amber; restrained cold cyan only for electrical components
Scene/backdrop: perfectly flat solid chroma-key green #00ff00
Constraints: uniform green background without gradient shadow texture floor glow or reflection; no green on weapon; hard opaque pixel edges, no antialiasing or semitransparent edge; no text, number, logo, watermark, ammo, hands, character, UI border or pedestal
Avoid: 3D render, product photo, pseudo-3D showcase, isometric scene, smooth painting, chibi toy gun, extra weapons, muzzle flash, animation sheet
Primary request: experimental Tesla launcher icon
Subject: one compact industrial electrical launcher with twin exposed copper induction coils, central steel emitter fork, insulated grip, cable housing and two tiny cold-cyan charge cells; unmistakably electrical but still a handheld weapon
```

## 准入备注

- 20 项文件统一保存为 8-bit RGBA；自动测试要求不透明颜色不超过共享 32 色板、alpha 只能为 0/255。
- `facility-floor`、`facility-service-floor`、`facility-hazard-stripe`、标题背景与军械库背景保持全不透明；三张地面 tile 另由自动测试逐像素验证上下与左右边缘相等。
- 其余 15 项透明区域已经二值化为 alpha 0，避免缩放后出现绿色或半透明毛边。
- 本批次没有使用用户截图、SCP Wiki 图片、现成素材包或其他第三方图像作为生成输入。
- AI 输出不是自动准入；只有本轮 production visual gate、来源审计和独立复审全部通过后，候选才能改为正式准入。

## R-17 实际生成提示与准入记录

这些素材为原创 R-17 异常殖民，不登记为现有 SCP 编号。项目整体的 SCP 衍生发布仍须在发布前按 `docs/licensing-and-commercialization.md` 复核 CC BY-SA 义务。基准 lineup 的原始输出是 `local-generation-archive:019f5e8c-8742-77f0-80d3-e643979ff61d/exec-e5f13954-551f-478d-a322-e667d2e3d7c1.png`，本地审计副本为 `.superpowers/sdd/r17-assets/reference/r17-lineup.png`。七张可接受 source board 全部按 SHA-256 与上表的 original 逐一匹配；`.superpowers/sdd/r17-assets/**` 仅为本地审计且不提交。

### P30 R-17 lineup reference

```text
Use case: stylized-concept
Asset type: visual lineup reference for seven production top-down 2D pixel-art enemy sprites in an industrial containment-horror game
Primary request: exactly seven distinct legless non-humanoid castes of one original anomalous colony, arranged in one clean horizontal lineup with wide separation: pear-shaped floating drifter, flat needle-shaped rift skimmer, ring-bound pulse sac, broad crescent-armored carapace gate, discontinuous frame-gap organism, large multi-lobed brood mass, tiny tadpole-like bud
Shared identity: dark graphite and restrained dried-red tissue, dirty off-white membranes, one cyan-white core organ per caste, fragments of Foundation-like containment clamps, electrodes, cables or stabilization rings; biological horror dominates, machinery and spatial anomalies are accents
Readability: every silhouette must remain unmistakably different in grayscale and at game-sprite scale; no design may resemble a standing human, zombie, robot soldier, animal with legs or famous existing SCP
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited 32-color family palette, crisp opaque edges, no antialiasing
Camera/composition: high orthographic overhead game view, one complete isolated creature per slot, consistent lighting and material language, no overlap
Backdrop: perfectly flat uniform solid #00ff00 chroma key
Constraints: no text, labels, numbers, logos, watermark, floor, scenery, shadows, gradients, gore spray, exposed realistic organs, extra creatures or UI
Avoid: 3D render, isometric, side view, front portrait, smooth painting, photorealism, chibi, generic zombie, generic alien, tentacle blob silhouettes that all look alike
```

### P31 R-17 common production prompt

```text
Asset type: four-frame source board for one production direction-neutral top-down 2D pixel-art enemy spritesheet
Input image: use the approved R-17 lineup only for family palette, materials, camera and this caste's identity
Composition: exactly four complete isolated frames of the SAME creature in one horizontal row, equal cells, identical scale, center point and hover baseline, generous separation, no borders
Animation: a subtle seamless loop made by real local articulation of membranes, tendrils, core light and attached hardware; never animate by scaling, translating, rotating or mirroring the whole body
Style: hard-edged orthographic top-down detailed pixel art, deliberate coarse clusters, maximum 32 colors, no antialiasing
Backdrop: perfectly flat uniform #00ff00 chroma key
Constraints: direction-neutral silhouette; no legs, no humanoid anatomy, no shadows, floor, text, labels, logos, watermark, soft alpha, extra creatures or scenery
Avoid: 3D, isometric, side view, smooth illustration, frame-to-frame identity drift, changing camera, changing body size, duplicated frames
```

### P32 r17-drifter

```text
pear-shaped floating flesh sac, three short lower tendrils, one restrained cyan-white core; four phases of asymmetric breathing and tendril curl; target visible silhouette about 36 logical pixels
```

### P33 r17-rift-skimmer

```text
flat sharp spindle-shaped flesh body, split jaw seam, trailing neural filaments; four rapid fin-and-tail contractions without changing total length; target about 28 logical pixels
```

### P34 r17-pulse-sac

```text
round membrane sac surrounding an absorbed security camera, incomplete metal stabilization ring and electrodes; four core charge phases with minor ring vibration; target about 34 logical pixels
```

### P35 r17-carapace-gate

```text
broad crescent frontal carapace shielding a rear cyan-white core, thick trailing fibers and embedded containment clamps; four heavy shell-tension phases, front remains clearly readable; target about 52 logical pixels
```

### P36 r17-frame-gap

```text
discontinuous slabs of dark tissue around a luminous spinal line and clean spatial voids; four offset phases where fragments reconfigure locally but center and total envelope remain stable; target about 44 logical pixels
```

### P37 r17-brood-mass

```text
large multi-lobed colony around several breathing sacs, containment stakes and one dominant cyan-white core; four asynchronous lobe contractions with stable outer envelope; target about 56 logical pixels
```

### P38 r17-bud

```text
tiny embryo-like bud with one long tail filament, one tiny cyan-white core and a metal tag fragment; four fast tail-wave phases; target about 22 logical pixels
```

P31+P38 只是初始基础提示，不得作为后续 replacement 的精确 correction prompt。

### P39 r17-bud dark-body color correction

Original: `local-generation-archive:019f5c42-ddb0-73d2-889d-cf86d3ad2300/exec-84d68222-3c80-4816-9e39-3e3c8acb2bf6.png`。

```text
Replace the four frames in this exact 1x4 horizontal spritesheet with a materially readable small R-17 bud that survives nearest-neighbor reduction to a 22-pixel-tall sprite. Preserve four equal frame cells, flat background exactly #00FF00, no transparency, no text, no shadow, no scenery, no perspective, no 3D. The creature must be legless and floating, with a LARGE broad dark charcoal/black organic tissue body making up at least 70 percent of its visible area, a thick near-black outer contour, muted red tissue seams/tendrils, one obvious small steel containment tag/collar, and a TINY cyan-white core no more than roughly 12 percent of the body area. Do not let the cyan core dominate. Use chunky high-contrast pixel clusters and thick shapes that remain visibly separate at 22 pixels: dark body, red tissue, steel tag, and tiny cyan core must all survive. Keep the same exact creature, part count, 22-pixel envelope, center, bottom baseline and total opaque area across all frames within 5 percent. Animate only gentle bending of the same thick tendrils and subtle body pulse; every frame silhouette must differ from all other frames without adding/removing parts. Crisp limited-palette top-down pixel art, fixed-size loop.
```

## 设施环境纵切 Task 1 真实生成与筛选记录

以下六项均在 2026-07-15 以 OpenAI built-in `image_gen` 完成，仅文本输入；工具未公开具体模型名，故不推断模型名称。没有使用用户截图、SCP Wiki 图片、素材包或其他第三方图像作为输入；没有使用 CLI/API fallback。原始和中间文件均留在 `.superpowers/sdd/facility-assets/sources/`，该目录与 1×/4× contact sheet 均为本地审计物，不暂存。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| facility-combat-floor | PNG | `assets/art/facility/combat-floor.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P40](#p40-facility-combat-floor)；original `local-generation-archive:019f6452-0dbb-7d13-9d19-326bd0d5a388/exec-f27b942d-cda0-4988-a559-fec6f3a06d56.png`；audit raw `sources/combat-floor-raw.png`；raw SHA-256 `D1453C62677DD7E3AD9524AF47390F17AA9DA18E78C02E2F2FFCF1D44A88E002` | 无手绘；`normalize_pixel_asset.py --fit cover --alpha opaque --colors 32 --seam-wrap`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `D17F66213177DE86516EF56D3B29AC6664F7F94697EA4C63588FFED169B64140`；2×2 seam 图已审查 | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、色数、alpha、接缝与视觉审查通过；不等同于商业发布准入 | 128×128 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-entry-threshold | PNG | `assets/art/facility/entry-threshold.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P41](#p41-facility-entry-threshold)；original `local-generation-archive:019f6452-0dbb-7d13-9d19-326bd0d5a388/exec-eb6c4656-3275-45d4-8f3c-8c16936bb73f.png`；audit raw `sources/entry-threshold-raw.png`；raw SHA-256 `23A5ECB2D251C6272E903BAE7F843D02EA9E5A38B541685278B2C4622A866ED4` | 无手绘；`normalize_pixel_asset.py --fit cover --alpha opaque --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `B6BC68CD27504594644AC50CA3CE1678CF2C2E9BA5575E3800B122061D973F3D` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、色数、alpha 与视觉审查通过；不等同于商业发布准入 | 128×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-maintenance-deck | PNG | `assets/art/facility/maintenance-deck.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P42](#p42-facility-maintenance-deck)；original `local-generation-archive:019f6452-0dbb-7d13-9d19-326bd0d5a388/exec-1cfc47ec-0246-4625-b1b4-15f9110b5cb9.png`；audit raw `sources/maintenance-deck-raw.png`；raw SHA-256 `8FCB07505E27C6094F31D965F0605518A0B28C36E409FB3A88D737A2E68E7FE0` | 无手绘；`normalize_pixel_asset.py --fit cover --alpha opaque --colors 32 --seam-wrap`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `8CFA9F9399ADC3403A48C2D417836E84D0F2F51782CB52487D24118311A70BAB`；2×2 seam 图已审查 | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、色数、alpha、接缝与视觉审查通过；不等同于商业发布准入 | 128×128 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-wall-bank | PNG | `assets/art/facility/wall-bank.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P43](#p43-facility-wall-bank)；original `local-generation-archive:019f6452-0dbb-7d13-9d19-326bd0d5a388/exec-8e0b337e-a003-47fd-97d0-86d71a073ad9.png`；audit raw `sources/wall-bank-raw.png`；raw SHA-256 `8077C453C741A6B5BED4003A0B09769D84F4C23B7BE84920D3176155380C916A` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 输出 `sources/wall-bank-cutout.png` SHA-256 `2CB854F0C3C6612A21ADC65C694AE1FD8AADDE52868DDCF732D3BBA9173F6F96`；随后 `normalize_pixel_asset.py --fit contain --alpha binary --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `EA4272AF5CB5445709F7DE218E0FFA93F01AC9590C1538668200550807126FAE` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、二值 alpha、无绿边、色数与视觉审查通过；不等同于商业发布准入 | 128×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-power-junction | PNG | `assets/art/facility/power-junction.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P44](#p44-facility-power-junction)；original `local-generation-archive:019f6452-0dbb-7d13-9d19-326bd0d5a388/exec-f2f222b9-ecb2-4616-8ce2-b33a6d592eee.png`；audit raw `sources/power-junction-raw.png`；raw SHA-256 `671C847DA0CB1F39679F6462B7949DE6429B7CD21F939201E948056ED08B88B9` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 输出 `sources/power-junction-cutout.png` SHA-256 `F414CB00874A11D719F9920131C8C7D20A9E3210BB9E47CFDCC675D97196642A`；随后 `normalize_pixel_asset.py --fit contain --alpha binary --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `B8F5AB5591801EFAA437344E2161B4A2DA1B6FD926A9DA117D59E51F83687546` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、二值 alpha、无绿边、色数与视觉审查通过；不等同于商业发布准入 | 96×96 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-contamination-trail | PNG | `assets/art/facility/contamination-trail.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P45](#p45-facility-contamination-trail)；original `local-generation-archive:019f6452-0dbb-7d13-9d19-326bd0d5a388/exec-29364643-61fe-466a-999d-9f68b9ba7a1d.png`；audit raw `sources/contamination-trail-raw.png`；raw SHA-256 `7DB208754B835357147987DE16BE5C285C94CA761E92EE380DD538177E0C0BCB` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 输出 `sources/contamination-trail-cutout.png` SHA-256 `162694949248E6816CB77CBCF46B5319A19C36A3D91EA2CC61DED60619EA6C93`；随后 `normalize_pixel_asset.py --fit contain --alpha binary --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `F6DBE86BD5D6DFBF67F171E19E79CFEFD5E89610F17469D7D87B1B10A5F0272F` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、二值 alpha、无绿边、色数与视觉审查通过；不等同于商业发布准入 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |

### 处理与审计产物

- 正式 PNG：`public/assets/art/facility/{combat-floor,entry-threshold,maintenance-deck,wall-bank,power-junction,contamination-trail}.png`。
- 原始、去底中间物与 SHA 审计副本：`.superpowers/sdd/facility-assets/sources/`；不暂存。
- 1×/4× contact sheet：`.superpowers/sdd/facility-assets/facility-modules-contact-sheet-{1x,4x}.png`；SHA-256 分别为 `F1E547AD79B2BBB5E5ACEA936E2FC86A9858867D30F94A7BB585F61EF146A190`、`DFDCE4ABCCE3DD6F30F5CC4B20DC45D3F86882A14DB775E17698E1B4679E5C88`；不暂存。
- 可平铺两项的 2×2 seam 审查图：`combat-floor-seam-2x2.png`、`maintenance-deck-seam-2x2.png`；逐像素首末边界与视觉检查均通过。

### 筛选与失败尝试

- P40–P45 每项均在首次 built-in 输出后通过视觉筛选；没有被拒绝或中断的图像候选，因此不存在额外失败源文件。
- 透明三项先保留 raw，再由 bundled helper 去绿；最终 normalizer 将 alpha 强制为 0/255，并把透明像素 RGB 清零。没有改用 CLI/API 或模型 fallback。
- 一次 Windows `.NET System.Drawing` 尺寸诊断在归档前停止，未改变任何候选内容、未生成新的素材候选；后续使用任务指定 Python runtime 完成尺寸、hash 与像素验证。

### P40 facility-combat-floor

```text
Use case: stylized-concept
Asset type: source art for a production 2D Phaser top-down facility room module, to be normalized to a 128 by 128 pixel PNG
Primary request: one quiet, low-noise central combat floor tile that fills the entire square edge to edge; cold grey-blue industrial metal panels, restrained 16-pixel modular seams, sparse tiny wear marks, subtle inset bolts only
Scene/backdrop: the floor itself fills the entire frame with no separate backdrop
Camera/composition: exact orthographic straight-down overhead game view, square tile, all four edges designed to repeat cleanly, no dominant center motif
Style/medium: authentic detailed 2D pixel art, deliberate coarse hard pixel clusters, strict 16px module grid, maximum 32-color cold grey-blue metal palette with only a tiny muted amber accent
Lighting/mood: flat controlled Foundation underground facility light, professional and oppressive
Constraints: fully opaque edge-to-edge module; hard edges; no text, letters, numbers, logos, people, creatures, weapons, furniture, obstacles, pickups, decals, blood, warning sign, floor shadow, gradients, soft light, antialiasing, transparency, isometric or 3D perspective, watermark
Avoid: busy noise, a visible border around the tile, a central prop, smooth painting, photorealism, 3D render, UI frame
```

### P41 facility-entry-threshold

```text
Use case: stylized-concept
Asset type: source art for a production 2D Phaser top-down facility room module, to be normalized to a 128 by 64 pixel PNG
Primary request: one heavy left-side facility entrance threshold that fills a wide two-to-one frame edge to edge; thick cold grey-blue metal sill, worn but readable yellow-and-black warning stripe band, recessed dark door channel and small structural bolts
Scene/backdrop: the threshold itself fills the whole frame with no separate backdrop
Camera/composition: exact orthographic straight-down overhead game view, horizontal 16px modular grid, wide low-profile module, no perspective
Style/medium: authentic detailed 2D pixel art, deliberate coarse hard pixel clusters, maximum 32 colors, cold grey-blue metal with a small restrained amber warning accent
Lighting/mood: flat controlled Foundation underground facility light, professional and oppressive
Constraints: fully opaque edge-to-edge module; hard edges; no text, letters, numbers, logos, people, creatures, weapons, furniture, pickups, blood, soft light, gradients, antialiasing, transparency, isometric or 3D perspective, watermark
Avoid: front-facing door elevation, a freestanding prop, smooth painting, photorealism, 3D render, UI frame
```

### P42 facility-maintenance-deck

```text
Use case: stylized-concept
Asset type: source art for a production 2D Phaser top-down facility room module, to be normalized to a 128 by 128 pixel PNG
Primary request: one maintenance-deck floor module that fills the entire square edge to edge; cold grey-blue metal plates, shallow cable troughs, rectangular inspection covers, bolts and restrained maintenance scuffs
Scene/backdrop: the floor itself fills the entire frame with no separate backdrop
Camera/composition: exact orthographic straight-down overhead game view, square tile, 16px modular grid, designed to repeat cleanly at all four edges, no obstacle silhouette and no central focal prop
Style/medium: authentic detailed 2D pixel art, deliberate coarse hard pixel clusters, maximum 32 colors, cold grey-blue metal with tiny muted amber maintenance accents
Lighting/mood: flat controlled Foundation underground facility light, professional and oppressive
Constraints: fully opaque edge-to-edge module; hard edges; no text, letters, numbers, logos, people, creatures, weapons, furniture, pickups, blood, warning sign, floor shadow, gradients, soft light, antialiasing, transparency, isometric or 3D perspective, watermark
Avoid: a busy scene, a visible border around the tile, a central machine, smooth painting, photorealism, 3D render, UI frame
```

### P43 facility-wall-bank

```text
Use case: stylized-concept
Asset type: source art for a production 2D Phaser top-down facility wall/equipment module, to be normalized to a 128 by 64 pixel PNG with binary transparency
Primary request: one wide low-profile wall-bank equipment group: cold grey-blue containment wall plate, exposed pipes, cable conduits, a few small indicator lights and maintenance housings; a single coherent horizontal facility object, not a room
Scene/backdrop: perfectly flat solid #00ff00 chroma-key green background for local removal
Camera/composition: exact orthographic straight-down overhead game view, wide two-to-one footprint, 16px module grid, generous green padding around all sides, no perspective
Style/medium: authentic detailed 2D pixel art, deliberate coarse hard pixel clusters, maximum 32 colors, cold grey-blue metal with restrained amber and cyan status lights
Lighting/mood: flat controlled Foundation underground facility light, professional and oppressive
Constraints: keep the object fully separated from the background with crisp opaque hard edges; no #00ff00 on object; no shadows, gradients, floor plane, reflections, text, letters, numbers, logos, people, creatures, weapons, furniture, pickups, blood, antialiasing, soft alpha, isometric or 3D perspective, watermark
Avoid: a full opaque rectangle, front elevation, a standalone UI panel, smooth painting, photorealism, 3D render, UI frame
```

### P44 facility-power-junction

```text
Use case: stylized-concept
Asset type: source art for a production 2D Phaser top-down facility power-node module, to be normalized to a 96 by 96 pixel PNG with binary transparency
Primary request: one compact Foundation power junction seen directly from above: square grey-blue breaker box, cable ports, thick short conduits, two small amber indicator lights and one restrained cyan power indicator; readable as a controllable-looking infrastructure object but with no text
Scene/backdrop: perfectly flat solid #00ff00 chroma-key green background for local removal
Camera/composition: exact orthographic straight-down overhead game view, compact square footprint on a 16px module grid, generous green padding on all sides, no perspective
Style/medium: authentic detailed 2D pixel art, deliberate coarse hard pixel clusters, maximum 32 colors, cold grey-blue metal with restrained amber and cyan details
Lighting/mood: flat controlled Foundation underground facility light, professional and oppressive
Constraints: keep the object fully separated from the background with crisp opaque hard edges; no #00ff00 on object; no shadows, gradients, floor plane, reflections, text, letters, numbers, logos, people, creatures, weapons, furniture, pickups, blood, antialiasing, soft alpha, isometric or 3D perspective, watermark
Avoid: a full opaque rectangle, front elevation, a UI icon, smooth painting, photorealism, 3D render, UI frame
```

### P45 facility-contamination-trail

```text
Use case: stylized-concept
Asset type: source art for a production 2D Phaser top-down facility contamination module, to be normalized to a 64 by 64 pixel PNG with binary transparency
Primary request: one restrained small anomalous contamination trail: low-profile irregular dark red and muted purple residue with a few connected drag marks and granular fragments; clearly a floor stain, not a barrier, pickup, body part or enemy
Scene/backdrop: perfectly flat solid #00ff00 chroma-key green background for local removal
Camera/composition: exact orthographic straight-down overhead game view, compact asymmetric 16px module-grid footprint, generous green padding around all sides, low visual coverage
Style/medium: authentic detailed 2D pixel art, deliberate coarse hard pixel clusters, maximum 32 colors, dark red-purple residue with near-black edges and no glow
Lighting/mood: restrained industrial containment-horror, controlled and readable
Constraints: keep the residue fully separated from the background with crisp opaque hard edges; no #00ff00 in the residue; no shadows, gradients, floor plane, reflections, text, letters, numbers, logos, people, creatures, recognizable organs, gore, weapons, furniture, pickups, antialiasing, soft alpha, isometric or 3D perspective, watermark
Avoid: a giant puddle, bright neon liquid, blood splatter gore, a full opaque rectangle, smooth painting, photorealism, 3D render, UI frame
```

## 终端覆盖层 Task 2 升级图标与终端表面素材

以下 19 项均于 2026-07-15 使用 OpenAI built-in `image_gen` 生成；工具未公开具体模型名，因此不推断。初版源板仅使用文字输入；6 张武器 tone 修订以初版正式图和同一项目源板作为本地图像参考。全程没有使用用户截图、SCP Wiki 图片、现成素材包或其他第三方图像，也没有切换 CLI/API fallback。原始、去底中间物、crop、被拒候选和 1×/8× contact sheet 均保留在 `.superpowers/sdd/terminal-task-2-assets/`，不暂存。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| upgrade-damage | PNG | `assets/art/upgrades/damage.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + `normalize_pixel_asset.py` | 2026-07-15 | [P49](#p49-weapon-tone-damage-revision)；本地参考为初版正式图与 [P46](#p46-upgrade-icons-source-board) | bundled helper 去底；alpha bbox + 横纵各 10% padding；`--fit contain --alpha binary --colors 32`；final SHA-256 `EC11D9EAA374C14D039EA8CE77E4E8B8D3CC3097B4800266058278443612580E` | 项目定制生成；仅使用项目自有生成图作参考；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | 独立审查修订后正式准入：impact chevron 可辨，98 个明确 R>G>B 琥珀像素，强青/紫 accent 均为 0，二值 alpha 与色数通过；不等同于商业发布准入 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-attack-speed | PNG | `assets/art/upgrades/attack-speed.png` | 同上 | 2026-07-15 | [P50](#p50-weapon-tone-attack-speed-revision)；同一项目参考 | 同一 helper、bbox padding 与 normalizer；final SHA-256 `36EF5D24358A6F09AD645EACDC0A3F14D804B00CD1886A97132C8DA15BBD1127` | 同上；无第三方图像输入 | 候选；商业发布前复核 | 修订后正式准入：四叶 rotor/motion 可辨，99 个明确琥珀像素，强青/紫 accent 均为 0，像素合同通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-move-speed | PNG | `assets/art/upgrades/move-speed.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 3；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 3；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `78196E2346FB3A1E9BA190042CA17964A4C89FFB3B7358F88943ED573EB8296A` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-max-health | PNG | `assets/art/upgrades/max-health.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 4；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 4；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `2497B990D284E5830A447AACF903E233CC977F80262B0D558FC07FA75D2CA5CE` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-projectile-count | PNG | `assets/art/upgrades/projectile-count.png` | 同上 | 2026-07-15 | [P51](#p51-weapon-tone-projectile-count-revision)；同一项目参考 | 同一 helper、bbox padding 与 normalizer；final SHA-256 `D56B79E388A1790951465406C08FD0515124810B6A8D226C12621645AEF0AD82` | 同上；无第三方图像输入 | 候选；商业发布前复核 | 修订后正式准入：三发散射轮廓可辨，91 个明确琥珀像素，强青/紫 accent 均为 0，像素合同通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-penetration | PNG | `assets/art/upgrades/penetration.png` | 同上 | 2026-07-15 | [P52](#p52-weapon-tone-penetration-revision)；同一项目参考 | 同一 helper、bbox padding 与 normalizer；final SHA-256 `41CF5CC82E9E5E845E23C572626E994F33206EE8E49316B7196B096AE8CF7A52` | 同上；无第三方图像输入 | 候选；商业发布前复核 | 修订后正式准入：弹体穿过双装甲板可辨，25 个明确琥珀像素，强青/紫 accent 均为 0，像素合同通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-pickup-radius | PNG | `assets/art/upgrades/pickup-radius.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 7；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 7；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `E1C855B11C71F6D683FDF8C5687D486825430DA1A4DB7819915F3A71D63FE9E0` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-emergency-heal | PNG | `assets/art/upgrades/emergency-heal.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 8；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 8；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `619DD054C736C5B64C3270385CF6126F481939891C775EA2C7CE6F96D4FF56A5` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-breacher-knockback | PNG | `assets/art/upgrades/breacher-knockback.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 9；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 9；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `D487F3981C0E636DC2391D0D1DD5D62C29829EA729ED78517FE19B081E9AACE9` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-breacher-suppression | PNG | `assets/art/upgrades/breacher-suppression.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 10；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 10；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `03992A0C62FE49260F889B78537BF233BC5CBC05CAFE52A22F6DDA95DF57BE08` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-breacher-magazine | PNG | `assets/art/upgrades/breacher-magazine.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 11；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 11；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `91C988124072DD49835C35881A7037D4B53FAD8C76152A3D065FAD9C097A5D33` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-tesla-chains | PNG | `assets/art/upgrades/tesla-chains.png` | 同上 | 2026-07-15 | [P53](#p53-weapon-tone-tesla-chains-revision)；同一项目参考 | 同一 helper、bbox padding 与 normalizer；final SHA-256 `705369193B86E44DDDEAEB0BE38A83D6B34C41B8B9A78B80BC420A3998880900` | 同上；无第三方图像输入 | 候选；商业发布前复核 | 修订后正式准入：三节点链路可辨，62 个明确琥珀像素，强青/紫 accent 均为 0，像素合同通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-tesla-cooldown | PNG | `assets/art/upgrades/tesla-cooldown.png` | 同上 | 2026-07-15 | [P54](#p54-weapon-tone-tesla-cooldown-revision)；同一项目参考 | 同一 helper、bbox padding 与 normalizer；final SHA-256 `634F7A089C4F86CE0190E16CDE0DEA1963E58113CA31467C7D8234AE3386DBE1` | 同上；无第三方图像输入 | 候选；商业发布前复核 | 修订后正式准入：Tesla 线圈/电容模块与回转箭头可辨，94 个明确琥珀像素，强青/紫 accent 均为 0，像素合同通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-pistol-boomerang | PNG | `assets/art/upgrades/pistol-boomerang.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 14；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 14；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `3B4C8EA0010BA8D1FA9A07B4838C53876B13911127D9755FEED2D417ACD147EA` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；质变轮廓、合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-breacher-explosive | PNG | `assets/art/upgrades/breacher-explosive.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 15；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 15；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `5AE8E201512382DAFAFDDF2E081F1FE11053D1070219ECBD874FF8FE2C80A4EB` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；质变轮廓、合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| upgrade-tesla-field | PNG | `assets/art/upgrades/tesla-field.png` | 同上 | 2026-07-15 | [P46](#p46-upgrade-icons-source-board) cell 16；共同 raw/cutout 来源与 SHA 见下方 | 固定 4×4 cell 16；alpha bbox + 10% padding；同一 normalizer；final SHA-256 `953E9383829C1AE34023CE8D1E2F50302CB9E3E37F126683D01E25BE72792D58` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入；质变轮廓、合同、像素与视觉审查通过 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| terminal-surface-grid | PNG | `assets/art/ui/terminal-surface-grid.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + `normalize_pixel_asset.py` | 2026-07-15 | [P48](#p48-terminal-surfaces-corrected-accepted) cell 1；raw/cutout 来源与 SHA 见下方共同流程 | 固定 1×3 cell 1；alpha bbox + 5% padding；`--fit contain --alpha binary --colors 16`；final SHA-256 `EAD83D3413BDD4E1B9C3FDA3704985ADB44FFD4E56B0573EDAA584FD86126B66` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 2 正式生产素材准入：开放线路、无内嵌文字、合同、像素与视觉审查通过 | 128×128 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| incident-stamp-frame | PNG | `assets/art/ui/incident-stamp-frame.png` | 同上 | 2026-07-15 | [P48](#p48-terminal-surfaces-corrected-accepted) cell 2；共同 raw/cutout 来源与 SHA 见下方 | 固定 1×3 cell 2；alpha bbox + 5% padding；同一 16 色 normalizer；final SHA-256 `C158EF7E96FDA6E8A8FC2BAC994BC777125035A71295E2A18E2CAE9FA8B05296` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入：红色空框、无内嵌文字、合同、像素与视觉审查通过 | 96×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| recontainment-stamp-frame | PNG | `assets/art/ui/recontainment-stamp-frame.png` | 同上 | 2026-07-15 | [P48](#p48-terminal-surfaces-corrected-accepted) cell 3；共同 raw/cutout 来源与 SHA 见下方 | 固定 1×3 cell 3；alpha bbox + 5% padding；同一 16 色 normalizer；final SHA-256 `39739733693ADDA585C1DC8A8AEF61B630226CC3AEC9173FEABC890D834BC3E2` | 同上；无第三方图像输入 | 候选；商业发布前复核 | Task 2 正式生产素材准入：绿色空框、无红色污染、无内嵌文字、合同、像素与视觉审查通过 | 96×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |

### 共同处理、来源 SHA 与审查产物

- 初版升级图标 raw：Codex 默认源 `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-3d045c2e-6f10-4277-9bcf-f88e82a8067b.png`；审计副本 `.superpowers/sdd/terminal-task-2-assets/sources/upgrade-icons-source-board.png`；1254×1254 RGB；SHA-256 `C2EE6E37A9C7395E41A6FD58F8D3602B9A4C70FE9737A98EEC666EADB21A8909`。该源板继续作为其余 10 张图标的正式来源及 6 张 tone 修订的项目内参考。
- 初版升级图标去底：bundled `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；输出 `upgrade-icons-source-board-cutout.png`；SHA-256 `E262B8A8AD3D854AA36E56499B5860B690269A7FF81B3D676DF87AE611999864`。按 round 边界固定等分 4×4，以 alpha≥128 的 bbox 加最大边 10% padding 切出 16 个 cell，再由 `normalize_pixel_asset.py --width 32 --height 32 --fit contain --alpha binary --colors 32` 以 Pillow nearest、无抖动量化输出 8-bit RGBA；其中 6 张 weapon 初版已被下述修订替代。
- 6 张 weapon tone 修订均为 1254×1254 RGB built-in imagegen 输出；默认源、审计副本和 SHA-256 如下。模型名未暴露；本地输入仅为对应初版正式图和 P46 项目源板，无第三方图像输入。

| Asset | Codex default raw | Untracked audit raw | Raw SHA-256 |
|---|---|---|---|
| damage | `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-1013bb59-7b7f-44e8-a11e-672ab15b9dc8.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-damage-imagegen-source.png` | `EBC0A57F9319A2E808531AA9A7AB9B82A2C0C9ECB0A120E3E7FB10DD2D25468E` |
| attack-speed | `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-0c6cd93f-d1b8-49d7-bad6-c163404bd7f1.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-attack-speed-imagegen-source.png` | `0F826A8A1F3756DAE4B1176AE45D2D60A468CA8B132255D4BBC4833E3BFC6745` |
| projectile-count | `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-a677b7d5-7270-495f-a450-2cf63ec8593f.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-projectile-count-imagegen-source.png` | `2BC031A4B6AC972AF81334D7333945D26EB8245C4E8E919D87E87561DA5C81EA` |
| penetration | `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-fad567f8-881a-4aba-a980-8804fcf8fbdb.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-penetration-imagegen-source.png` | `BA4D60A79ABC485E8E9A674043A7E6EF2D1312876A98E02EA83B00437F8D6E02` |
| tesla-chains | `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-0a9b1059-37cc-4b14-9e69-f67189274881.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-tesla-chains-imagegen-source.png` | `EBFC911E11CC792E6CA72CB923772A2AEB6C2F26970B646DF121649958F1EBA3` |
| tesla-cooldown | `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-a9981b60-a537-4a54-8f21-efc1d98b72af.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-tesla-cooldown-imagegen-source.png` | `47E17FDD7CB699B30B1AA3A228259669783CA0CF9A71FA3786AD8B45D19FA3EF` |

- 6 张修订均使用上述 bundled helper 精确参数去底，再按非零 alpha bbox 加横纵各 10% padding 裁切；crop 尺寸依次为 794×815、817×843、742×740、911×792、892×859、877×793。随后仅用 `normalize_pixel_asset.py --width 32 --height 32 --fit contain --alpha binary --colors 32` 输出；没有脚本改色、手绘修补或候选拼接。cutout SHA-256 依次为 `779AC0D63CCDD6EA7A7CBEA421778E08CBF0FC517022D6616E99D92197AF37CB`、`D76C5FD2D503E591F5848A35C14F1717EB1F0B3F25BEF3D2BFE5A6120E1DD4D4`、`6559E85952BC1715F58DB5AED7C021CC560AAD07887004B901DE6F9D630C7CB6`、`ECE41899222F7B602357940E8F4C61C40E12F1A8581ADFDCBCC8F1499232EBF3`、`513C4D121DC97217C0CB92FADCAF2CA3BAE453A0CDAE12A258F57D2A194AD410`、`96E6A8F63F84EF4397D6FDE4AE651E242C58716BF2472C7C0B63275B87AB9C5C`；crop SHA-256 依次为 `72376BA81A5C0AB89AB7B9F7D9415FFB45AD959F26D153ED50FD60DEF62F2CA0`、`23C06928B1287E4665D1FAA45F589773DBE3EED0AD23EF152BCB18EA06FCE4FA`、`AE41454F4D7A4BD9A58A666A118B4935044930825AB444973E71789C4E2885FD`、`4393FC73CE79F4D503312759D1ED4B21017C10CDB1F13B49C8004E7C0DDA01AE`、`3E1DF775C5032196AF083B63C8DC3564EF0DA06516D149CEED2A5BB54AC9E1BE`、`714D9B0254FFC213F9AEF3CF5D1FF4635385D71A657C798847D5963736DBE69F`。
- 终端素材 accepted raw：Codex 默认源 `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-8c92bd9e-5659-42eb-8916-938f50850e3d.png`；审计副本 `.superpowers/sdd/terminal-task-2-assets/sources/terminal-surfaces-source-board-accepted.png`；2172×724 RGB；SHA-256 `4BA7C5C07F3EC13BD3D2A6127D4EC9FDB1CCB0F251F125330CD6F75495D12E77`。
- 终端素材去底：同一 bundled helper 参数；输出 `terminal-surfaces-source-board-accepted-cutout.png`；SHA-256 `57B31367938C42E4D385954831CC551D5B70689016D0E39D3AB722C51E1E6D45`。随后固定等分 1×3，以 alpha≥128 的 bbox 加最大边 5% padding 切出三个 cell；没有手绘、重绘或颜色替换；再分别用 `normalize_pixel_asset.py --fit contain --alpha binary --colors 16` 输出 128×128、96×32、96×32 的 8-bit RGBA。
- contact sheet 均由 `scripts/art/build_contact_sheet.py` 以整数 nearest scale 生成：修订后 `upgrades-contact-sheet-1x.png` SHA-256 `7C7B52D4CEA827FB759EF7C768CFD04204B396EFB708579B01CD4A4CB96CA267`；`upgrades-contact-sheet-8x.png` SHA-256 `0EECDA7622130F14901034F4609107956DAF5EA9A08A3D979CCDBA0DC3437450`；`terminal-surfaces-contact-sheet-1x.png` SHA-256 `11B605E20DA7FE548C1F963966386B99DB30ECE26211D931F022D817D94FE6A0`；`terminal-surfaces-contact-sheet-8x.png` SHA-256 `13909B3BA4BF7A471598AFB1B74F5EC00C83C5849C55E50932082C8CD6FA98A6`。
- 逐张原始尺寸及 8× nearest 审查通过：16 个升级轮廓在 32×32 可辨，二值 alpha、透明边缘与 tone 语言明确；6 张修订的琥珀像素计数为 98、99、91、25、62、94，强青与紫色 accent 均为 0；tesla-cooldown 的线圈模块与右侧回转箭头清晰。grid 为开放线路；两个 stamp frame 无文字、同构且颜色语义分离。没有录用抗锯齿或只在缩小后才像像素画的候选。

### 被拒与中断尝试

- [P47](#p47-terminal-surfaces-first-attempt-rejected) 产生了可用输出，但因 grid 带实心深色底板，且绿色 recontainment frame 混入红/粉磨损像素而拒绝，未进入生产后处理。Codex 默认源 `local-generation-archive:019f65c4-670d-7053-a240-6b34370b3805/exec-5f6ff56c-05df-4622-bc57-c931b9e80987.png`；审计副本 `.superpowers/sdd/terminal-task-2-assets/sources/terminal-surfaces-source-board-rejected-filled-grid.png`；2172×724 RGB；SHA-256 `392326A64727E6F4B57B40AA8E66896A666A31682A65A74A4A754546993C3216`。
- 独立审查拒绝 P46 的 6 张初版 weapon final：它们分别为 damage、attack-speed、projectile-count、penetration、tesla-chains、tesla-cooldown，均无明确 R>G>B 琥珀像素且仍使用青色 accent；被替代 final SHA-256 依次为 `A73ED30CBA698AA36ABADD4CBDD5408FF445828771568BA35C1C5DA393EE2B7E`、`1F96EBC7BC3BF869166E7EF454DB2376526BFCF090128507AB629413C08D5312`、`6AC41EC22CB5C38F68E56601EA270426CB09C096A297CB83BA749814C282777C`、`0BE98C490A642BD49DEAAE4008033A798E4275713978049E6A12E471D0B2E371`、`9673E37AE58A34301E9BF3464F4601F157325432CC7B34B2B99A50E971A96259`、`4971369F17503B9C9D3988B9748A0B8A69F4BA0328C6C66919FA1C6BF79F3FB9`。
- 首次 6 项并行修订编排被用户中断，聚合调用未返回；落盘结果中 `exec-035b7087-79ad-4fc3-b62f-3b822efba770.png`（damage，SHA `884EFA9771C48B3507771BE511FC52AEC0AE656EB5AF955B3C9D9EA70882795B`，prompt P49）、`exec-ccbeeada-0bb9-458e-b4c3-060ec3b73fc3.png`（attack-speed，SHA `E22BEDF295D557F7D31BFEFAC70358C04CF16DC579F99C8B3D7CFE000E7FE1E8`，prompt P50）和 `exec-267e30c2-f4ef-4d59-8188-420e03b20287.png`（projectile-count，SHA `EC809D4381B2A18037328F88D35A84147B65CDA276D858B73841FD65E1D3B747`，prompt P55）均因后续同主题候选更清晰而拒绝；未跟踪审计副本分别为 `weapon-tone-damage-imagegen-rejected-duplicate.png`、`weapon-tone-attack-speed-imagegen-rejected-duplicate.png`、`weapon-tone-projectile-count-imagegen-rejected-duplicate.png`。`exec-fad567f8-881a-4aba-a980-8804fcf8fbdb.png` 为该中断批次中保留的 penetration 输出，prompt P52。
- 顺序重试产生 `exec-c997e5b9-ba3c-45b8-b4ec-ab24b3218cc1.png`（penetration，SHA `E076DD8C96E19D28F744B0B6B719BB97CE90FFEA1D1A17469DF5ABCB95459D3D`，prompt P56），因已录用 fad 版本而作为重复候选拒绝；未跟踪审计副本为 `weapon-tone-penetration-imagegen-rejected-duplicate.png`。随后用户停止继续生成，原 tesla-cooldown 请求未产生输出。用户之后单独授权一次 [P54](#p54-weapon-tone-tesla-cooldown-revision)，该次成功并直接录用，不再迭代。没有 imagegen 工具错误，也没有 CLI/API fallback。

### P46 upgrade icons source board

```text
Use case: stylized-concept
Asset type: unified source board for sixteen production 32x32 transparent game UI upgrade icons
Primary request: create exactly sixteen distinct icon subjects in a precise 4-column by 4-row grid, one centered isolated subject per equal cell, with generous flat-background padding and no cell borders. Reading order: 1 damage = fractured impact chevron; 2 attack speed = compact rotor with motion ticks; 3 move speed = tactical boot with forward arrows; 4 max health = armored medical shield; 5 projectile count = three diverging rounds; 6 penetration = one round piercing two plates; 7 pickup radius = central salvage diamond with concentric locator brackets; 8 emergency heal = injector and compact medical cross; 9 breacher knockback = shotgun muzzle with rearward force wedge; 10 breacher suppression = shotgun shell over a slowing clamp; 11 breacher magazine = compact box magazine with stacked shells; 12 tesla chains = three linked electrical nodes; 13 tesla cooldown = coil with segmented timer arc; 14 pistol boomerang mutation = curved returning projectile path around a pistol round; 15 breacher explosive mutation = breacher shell with contained blast petals; 16 tesla field mutation = operator core inside a circular electric field.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key background across the entire board, including gutters; no shadows, gradients, texture, lighting variation, floor, or checkerboard
Camera/composition: strict orthographic top-down Foundation terminal glyphs; exact evenly spaced 4x4 grid; single clear silhouette in every cell; every subject fully separated from every other subject and from the board edge
Style/medium: authentic detailed 2D pixel art drawn on an explicit coarse square pixel grid, hard opaque square pixel clusters, limited palette, no antialiasing, no soft edges, no smooth gradients
Color palette: shared cold charcoal and steel-blue foundation base; icons 1-13 use cyan for generic systems and restrained amber for weapon mechanisms; icons 14-16 use unmistakable violet mutation energy; high contrast at 32x32
Constraints: exactly sixteen subjects in the specified order; no letters, numbers, labels, words, logos, SCP insignia, watermark, UI borders, cell frames, badges, circles behind icons, scenery, people, hands, extra objects, or duplicated symbols; never use #00ff00 within any subject; crisp opaque edges and generous padding for local chroma removal and deterministic nearest-neighbor reduction
Avoid: 3D, isometric, perspective, photorealism, hand-painted style, vector-smooth curves, antialiasing, glow haze, soft transparency, bevels, realistic product rendering, tiny noisy detail that only becomes pixel art after shrinking
```

### P47 terminal surfaces first attempt rejected

```text
Use case: stylized-concept
Asset type: unified source board for three production transparent Foundation terminal surface assets
Primary request: create exactly three isolated subjects in a precise one-row by three-column grid with wide equal gutters and no cell borders. Left subject: one square seamless low-contrast terminal surface tile made only of sparse scanlines, tiny circuit traces, right-angle junctions and restrained node pixels, no central emblem. Middle subject: one empty wide horizontal incident-report stamp frame, distressed hard-pixel double-line rectangular outline with clipped corners and two small side registration notches, absolutely no text or symbols. Right subject: one empty wide horizontal recontainment stamp frame using the same geometry and distress language, absolutely no text or symbols.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key magenta across the full board and gutters; no shadows, gradients, texture, floor, reflections, or lighting variation
Camera/composition: strict orthographic 2D game UI source board; exact 1x3 equal-cell layout; each subject centered, fully separated, generous key-color padding; the left square tile has an edge-to-edge internal circuit pattern but remains isolated within its cell; middle and right subjects are clearly wide 3:1 empty frames
Style/medium: authentic detailed Foundation terminal pixel art on an explicit coarse square pixel grid, crisp hard opaque square pixel clusters, limited palette, no antialiasing, no soft transparency, no smooth gradients
Color palette: cold charcoal, dark steel blue and restrained cyan for the left terminal tile; dark red and muted warning red for the middle incident frame; dark green and restrained containment green for the right recontainment frame; maximum sixteen source colors overall apart from the magenta key
Constraints: exactly three subjects only; no letters, numbers, labels, words, logos, SCP insignia, watermark, icons, pictograms, UI buttons, background panels, 3D lighting, bevels, glow haze, shadows, scenery, or embedded text; do not use #ff00ff inside any subject; hard opaque edges suitable for local chroma removal and deterministic nearest-neighbor normalization
Avoid: 3D, isometric, photorealism, hand-painted style, smooth vector curves, antialiasing, soft glow, realistic rubber stamp mockup, text-like marks, tiny illegible glyphs, decorative emblems
```

### P48 terminal surfaces corrected accepted

```text
Use case: stylized-concept
Asset type: corrected unified source board for three production transparent Foundation terminal surface assets
Primary request: create exactly three isolated subjects in a precise one-row by three-column grid with wide equal gutters and no cell borders. Left subject: ONLY sparse floating cold-blue scanlines, tiny circuit traces, right-angle junctions and restrained node pixels arranged as a square seamless terminal overlay pattern; there must be no dark square fill, no panel background, no solid rectangle, no central emblem. Middle subject: one empty wide horizontal incident-report stamp frame, distressed hard-pixel double-line rectangular outline with clipped corners and two small side registration notches, absolutely no text or symbols. Right subject: one empty wide horizontal recontainment stamp frame with the identical geometry and distress language, absolutely no text or symbols.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key magenta across the full board, visible through every empty area including inside and around all three subjects; no shadows, gradients, texture, floor, reflections, or lighting variation
Camera/composition: strict orthographic 2D game UI source board; exact 1x3 equal-cell layout; each subject centered, fully separated, generous key-color padding; the left trace pattern is square and open with magenta showing between all traces; middle and right subjects are clearly wide 3:1 empty frames
Style/medium: authentic detailed Foundation terminal pixel art on an explicit coarse square pixel grid, crisp hard opaque square pixel clusters, limited palette, no antialiasing, no soft transparency, no smooth gradients
Color palette: left traces use only cold charcoal-blue, steel blue and restrained cyan; middle frame uses only near-black red, dark red and muted warning red; right frame uses only near-black green, dark green and restrained containment green. The right frame must contain zero red, orange, pink, or magenta distress pixels. Maximum sixteen subject colors overall apart from the magenta key.
Constraints: exactly three subjects only; transparent intent through removable magenta; no letters, numbers, labels, words, logos, SCP insignia, watermark, icons, pictograms, UI buttons, filled background panels, 3D lighting, bevels, glow haze, shadows, scenery, or embedded text; do not use #ff00ff inside any subject; hard opaque edges suitable for exact local chroma removal and deterministic nearest-neighbor normalization
Avoid: any solid fill behind the left grid, red contamination in the green frame, 3D, isometric, photorealism, hand-painted style, smooth vector curves, antialiasing, soft glow, realistic rubber stamp mockup, text-like marks, tiny illegible glyphs, decorative emblems
```

### P49 weapon tone damage revision

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 1 column 1
Primary request: create one isolated revised heavy impact chevron with a cracked central strike and a few compact impact fragments. Change the weapon accent language from cyan to unmistakable amber while preserving the target's semantic silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: one centered icon, generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue metal base; weapon accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: change only the accent family and cleanly redraw as needed; preserve the exact subject semantics from Image 1 and the cited Image 2 cell; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, or scene elements
Avoid: smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P50 weapon tone attack speed revision

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 1 column 2
Primary request: create one isolated revised four-blade tactical rotor with a dark circular hub and compact motion ticks. Change the weapon accent language from cyan to unmistakable amber while preserving the target's semantic silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: one centered icon, generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue metal base; weapon accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: change only the accent family and cleanly redraw as needed; preserve the exact subject semantics from Image 1 and the cited Image 2 cell; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, or scene elements
Avoid: smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P51 weapon tone projectile count revision

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 2 column 1
Primary request: create one isolated revised icon of three compact ammunition rounds diverging in a clearly readable spread. Change the weapon accent language from cyan to unmistakable amber while preserving the target's three-projectile silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp grouped silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: one centered three-round icon, generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue cartridge bodies; weapon accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: preserve exactly three rounds and their diverging spread; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, or scene elements
Avoid: arrows without ammunition bodies, smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P52 weapon tone penetration revision

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 2 column 2
Primary request: create one isolated revised version of one compact ammunition round passing cleanly through two parallel armor plates. Change the weapon accent language from cyan to unmistakable amber while preserving the target's semantic silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: one centered icon, generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue metal base; weapon accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: change only the accent family and cleanly redraw as needed; preserve the exact subject semantics from Image 1 and the cited Image 2 cell; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, or scene elements
Avoid: smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P53 weapon tone tesla chains revision

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 3 column 4
Primary request: create one isolated revised icon of exactly three circular Tesla nodes connected by one angular chained-energy path. Change the weapon accent language from cyan electricity to unmistakable amber electricity while preserving the three-node chain silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp grouped silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: three separated round nodes in a triangular chain, centered with generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue metal nodes; chained-energy accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: exactly three nodes and a clearly connected angular path; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, bloom, soft glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra node, extra icon, or scene elements
Avoid: smooth lightning glow, disconnected nodes, four or more nodes, smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P54 weapon tone tesla cooldown revision

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact tesla-cooldown edit target and semantic reference; Image 2 is the original unified pixel source-board style reference, specifically row 4 column 1
Primary request: create one isolated, clearly readable tesla-cooldown icon: a compact top-down Tesla coil or capacitor module with a distinct outer cooldown timing ring or curved return arrow wrapping around it
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down Foundation tactical terminal icon; single clear silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: centered compact module, the cooldown ring or return arrow clearly visible around the outer edge, generous even padding, no frame, no border
Color palette: deep charcoal and restrained cool gray metal; energy and timing accents only in unmistakable warm amber/orange-gold with clear R>G>B channel ordering
Constraints: preserve tesla cooldown semantics; one module plus one readable cooldown ring or curved return arrow; all subject edges crisp and opaque; no cyan or turquoise; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, bloom, soft glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, or scene elements
Avoid: projectile spread, bullets, multiple disconnected nodes, smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P55 interrupted projectile count candidate

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 2 column 1
Primary request: create one isolated revised version of three compact ammunition rounds diverging in a clearly readable spread. Change the weapon accent language from cyan to unmistakable amber while preserving the target's semantic silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: one centered icon, generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue metal base; weapon accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: change only the accent family and cleanly redraw as needed; preserve the exact subject semantics from Image 1 and the cited Image 2 cell; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, or scene elements
Avoid: smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```

### P57 contact-shadow

```text
Use case: stylized-concept
Asset type: source artwork for a 2D top-down pixel-art game contact-shadow sprite
Primary request: Create exactly one isolated horizontal oval contact shadow centered in the canvas, intended to be normalized into a 32 by 16 pixel transparent sprite.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for removal; one uniform color only, no texture, gradient, floor, lighting variation, border, or frame.
Subject: only a low-profile charcoal-to-black elliptical contact shadow viewed perfectly top-down. The darkest compact pixels are at the center. The edge falls off in 3 to 4 discrete hard-edged pixel-art bands with deliberate stair-step clusters. Wide 2:1 silhouette, symmetric enough for gameplay, clean and readable at tiny size.
Style/medium: precise hand-authored high-detail pixel art, no antialiasing, no smooth blur, no painterly brushwork, no 3D rendering.
Composition/framing: one shadow only, centered, generous flat green padding, horizontal 2:1 footprint.
Color palette: grayscale charcoal and black only in the shadow; do not use green inside the subject.
Constraints: no object, character, feet, weapon, ground tile, cast direction, glow, halo, radial blur, soft transparency, text, logo, watermark, extra marks, duplicate sprite, perspective, or 3D volume. The result must look like a utilitarian game contact-shadow sprite source, not a scene.
```

### P56 rejected penetration retry

```text
Use case: precise-object-edit
Asset type: source artwork for a 32x32 top-down Foundation terminal upgrade icon
Input images: Image 1 is the exact edit target and semantic silhouette; Image 2 is the original unified source-board style reference, specifically row 2 column 2
Primary request: create one isolated revised icon of one compact ammunition round passing cleanly through two parallel armor plates. Change the weapon accent language from cyan to unmistakable amber while preserving the target's penetration silhouette and readability.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal; one uniform color only
Style/medium: explicit hard-edged refined pixel art with visible square pixel clusters at original generated resolution; top-down tactical Foundation terminal icon; single crisp silhouette; non-3D, non-hand-painted, non-photorealistic
Composition/framing: centered horizontal round crossing two vertical plates, generous even padding, no frame, no border
Color palette: cold charcoal and restrained cool gray-blue armor plates and cartridge body; weapon accents only in warm amber/orange-gold with clear channel ordering R>G>B; use multiple amber shades for readable pixel clusters
Constraints: exactly one round and exactly two parallel armor plates; all subject edges crisp and opaque; no cyan or turquoise accent pixels; no violet, purple, magenta, red, or green in the subject; do not use #00ff00 in the subject; no gradients, antialias blur, glow, shadow, floor plane, reflection, text, labels, numbers, logo, watermark, frame, extra icon, debris, or scene elements
Avoid: a plus symbol, a gate without a projectile, smooth vector curves, soft edges, 3D bevel rendering, painterly texture, realistic materials, tiny unreadable details
```


## 玩家角色 Gate 1 剪影

本节记录玩家角色第一阶段 Gate 1（三选一剪影验收门）的全部四轮生成。十二项剪影于 2026-07-22 至 2026-07-23 使用 Kimi 内置 image_generation 插件（经 agent-gw `generate_image` 网关，1:1、1K、opaque 背景）生成；工具未公开具体模型名，故不推断。计划原假设的 OpenAI built-in `image_gen` 在本执行环境不可用，实际生成路径以本记录为准；该生成服务的输出权利条款同样须在商业发布前复核。四轮均只有文本输入；没有使用用户截图、SCP Wiki 图片、素材包或其他第三方图像作为输入；没有使用 CLI/API fallback。所有后处理使用 codex runtime Python 3.12（Pillow 12.2）执行。游戏底图来自本仓库基线经 WebBridge 真实浏览器在 960×540 普通 URL 完成标题→军械库→实战后的页面截图，未缩放。raw、cutout、final、contact sheet、zoom 与游戏 composite 全部保留在 `.superpowers/sdd/player-character/gate-1/`，该目录为本地审计物，不暂存。

2026-07-23 用户验收结论：第三轮（男性高辨识度轮，下称 r3）A/B/C 三项全部接受保留；用户同时决定未来阶段加入角色选择界面，但本阶段不实现角色选择 UI，生产顺序为一名默认角色先行进入 Gate 2，另两名排队至未来多角色阶段（每名角色将拥有独立完整 sheet）。第一轮（女性方向）因项目所有者 2026-07-23 将首名角色方向调整为成年男性而整轮被拒；第二轮（男性 r2）因真实游戏尺寸下三名候选辨识度不足（用户评价三个候选在游戏里感觉都差不多）整轮被拒；第四轮（r4 精炼轮）经用户比较被认为不如 r3，整轮否决，仅作审计保留。

### Gate 1 已接受剪影（r3，2026-07-23 用户验收保留）

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| player-silhouette-amber-recon（候选 A 琥珀侦察尖兵） | PNG | `.superpowers/sdd/player-character/gate-1/final/silhouette-a.png`（审计物，不暂存） | Kimi 内置 image_generation（agent-gw `generate_image`，模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/build_player_character_assets.py` | 2026-07-23 | [P64](#p64-gate-1-round-3-male-variant-a-accepted)；audit raw `gate-1/raw/silhouette-a.png`；raw SHA-256 `9a64d691c136b4fe954c990ea60c170f69c42fb5cb77c8b50122769e2c1090aa` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force` 输出 cutout SHA-256 `afbf10f5cd585ea5746759a664c0938581ec9bb74f122de9a6519530e4ea6f0c`；随后 `build_player_character_assets.py silhouette`（Pillow nearest、无抖动量化、8-bit RGBA、二值 alpha、≤32 色、可见高归一 48、baseline y=56）输出 final SHA-256 `f0cf72ed45e90169c44d2466c75da16107b9dbcaefc49500c279bcd9af16bfbf` | 项目定制生成；无第三方图像输入；商业发布前复核生成服务输出权利条款与项目许可 | 候选；商业发布前复核 | Gate 1 剪影验收通过（2026-07-23 用户决定三名身份全部保留）；2026-07-23 所有者选定本候选为首发默认角色，先行进入 Gate 2 生产；仅角色身份方向准入，不等同于素材生产或商业发布准入 | 64×64（可见高 48、可见宽 22、baseline y=56、二值 alpha、≤32 色） | 无 |
| player-silhouette-crimson-breacher（候选 B 暗红重装突破手） | PNG | `.superpowers/sdd/player-character/gate-1/final/silhouette-b.png`（审计物，不暂存） | Kimi 内置 image_generation（agent-gw `generate_image`，模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/build_player_character_assets.py` | 2026-07-23 | [P65](#p65-gate-1-round-3-male-variant-b-accepted)；audit raw `gate-1/raw/silhouette-b.png`；raw SHA-256 `e68bade6516583d5d5d38ebdb3549df5f0faab290f9042da6ff6e4caf371e0d0` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force` 输出 cutout SHA-256 `90339bcee8b79f61c2f169284847668860b83cf11fd818f6d1f8315d69413694`；随后 `build_player_character_assets.py silhouette`（Pillow nearest、无抖动量化、8-bit RGBA、二值 alpha、≤32 色、可见高归一 48、baseline y=56）输出 final SHA-256 `01a39c79b51f28945c6247dae741a5584fd9848a0107a9710269b8c92968b4f4` | 项目定制生成；无第三方图像输入；商业发布前复核生成服务输出权利条款与项目许可 | 候选；商业发布前复核 | Gate 1 剪影验收通过（2026-07-23 用户决定三名身份全部保留）；仅角色身份方向准入，不等同于素材生产或商业发布准入 | 64×64（可见高 48、可见宽 34、baseline y=56、二值 alpha、≤32 色） | 无 |
| player-silhouette-teal-tech（候选 C 青技术专家） | PNG | `.superpowers/sdd/player-character/gate-1/final/silhouette-c.png`（审计物，不暂存） | Kimi 内置 image_generation（agent-gw `generate_image`，模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/build_player_character_assets.py` | 2026-07-23 | [P66](#p66-gate-1-round-3-male-variant-c-accepted)；audit raw `gate-1/raw/silhouette-c.png`；raw SHA-256 `89bdfd0de7f85f34bcc7dc4d6c5b138e16e1cf218c84c206468e9db9ff0f376e` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force` 输出 cutout SHA-256 `302db100ee5aada94a2b85c8dd7c9d53bb986d0a0b3a64f8a868b4ff734ff3e9`；随后 `build_player_character_assets.py silhouette`（Pillow nearest、无抖动量化、8-bit RGBA、二值 alpha、≤32 色、可见高归一 48、baseline y=56）输出 final SHA-256 `33391f62b742427b09cae2d41799f7c37467516995481d818ae054eed36541dd` | 项目定制生成；无第三方图像输入；商业发布前复核生成服务输出权利条款与项目许可 | 候选；商业发布前复核 | Gate 1 剪影验收通过（2026-07-23 用户决定三名身份全部保留）；仅角色身份方向准入，不等同于素材生产或商业发布准入 | 64×64（可见高 48、可见宽 20、baseline y=56、二值 alpha、≤32 色） | 无 |

### 处理与审计产物

- 游戏底图：`.superpowers/sdd/player-character/gate-1/gameplay-base-960x540.png`，SHA-256 `fca2c0e6657aa4f8f76e44367c7a534d57175e329ace8478c97de47b47e0d1b4`；WebBridge 真实浏览器 960×540 普通 URL 截图（标题→军械库→实战），anchor `(600, 360)` 周围 64×64 无角色、敌人、掉落物、弹道或 HUD，不暂存。
- r3 游戏 composite：`gate-1/silhouette-{a,b,c}-game-960x540.png`，SHA-256 分别为 `7583e9faafd9268def7c7f49eb696dcc6f45b25c5c5482c901bcc538b883631a`、`6ea2b6e491172bc2c1d87513e807489d47873aaa5965f1f3aaaf38fe69ab0778`、`092057512675a8c1a68e6e4919628cb727c64ecc0b4db75226d1b0084edd539b`；命令 `build_player_character_assets.py preview --background gate-1/gameplay-base-960x540.png --silhouette gate-1/final/silhouette-{id}.png --anchor-x 600 --anchor-y 360 --output gate-1/silhouette-{id}-game-960x540.png`；64×64 候选不缩放，脚底固定 `(600, 360)`，不暂存。
- r3 contact sheet：`gate-1/silhouettes-1x.png`（192×64）SHA-256 `2c300475bc4aea8f3666ac0e6452d3c7a34a90bd27f6377c9d8d30c17b46167c`，`gate-1/silhouettes-4x.png`（768×256）SHA-256 `60e9a41dcf54bc34615484c5862d0eb694c8147c46cad6bae363ff8dcc778559`；命令 `scripts/art/build_contact_sheet.py --inputs <三张 final> --scale {1|4} --columns 3`，不暂存。
- r3 像素审查 zoom：`gate-1/zoom/silhouette-{a,b,c}-zoom.png`，SHA-256 分别为 `3b173782c1435c603850560c658be28deb53ea8fd03aaf26cf818b4092da406b`、`e6c28022757cfefce4f0bf9ed95a0fafe934c21f48f7bcbf4f53548ed34f7777`、`527126a6acd7ef3e0f46af85bc004886e80bbaaa77d3ff3b425c9387094ec942`；Pillow nearest-neighbor 放大审查图，不暂存。
- 四轮完整后处理命令（对 `id` ∈ `a,b,c`）：bundled helper `remove_chroma_key.py --input gate-1/raw/silhouette-{id}.png --out gate-1/cutout/silhouette-{id}.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force`；`build_player_character_assets.py silhouette --input gate-1/cutout/silhouette-{id}.png --output gate-1/final/silhouette-{id}.png`；preview 与 contact sheet 命令如上。四轮均先保留 raw 再去绿，builder 将 alpha 强制为 0/255；未改用 CLI/API 或模型 fallback。

### 筛选与失败尝试

- 第一轮（女性方向，2026-07-22，P58–P60）：Agent 硬门槛通过，但项目所有者 2026-07-23 决定首名角色改为成年男性，整轮方向被拒，归档于 `gate-1/rejected-female/`。raw SHA-256：`05d7ab0e5634686feb8cf43579617906a6e9d8c66729246262d201f6a00a5005`(a)、`d6e01246bdfefb1cfebcb7769f54c6664e4b1501b4b41e0aedb349849896b162`(b)、`e629f6a48eede4b092bddd4324a362764d3e8d4dd7efe2b0c92fdb5cc7385b8d`(c)；cutout：`d8ee6b229a88ab04a4ebe1fc8b1eabbe568e536c26980d43e01fa1ae8077a23a`、`758939e9a55316fe3ef657caaa7498c2c13fd992f1c62527807e76e9cabf9ae1`、`cbce43b24a87496e21c7c5df54e707358372d0fdf5bec5759f0b41ec7afc04f3`；final：`cf4fc31596c65a5e6a716751a16681ce18974db11c70ee507b97c1c36aa5e2bd`、`32f52e06a6adbbb16445a3521abb7442a096fd8fd0f8b169ba07fd5337270dee`、`6f01ae2353cb55b8cceda1e222b06512629e3b5f8032be5488b8b6bfad517d3d`；composite：`f5409897673b4f34a4b1282a4d9ca77d800319163becd96487239478dd7b6123`、`d7b5252f7b4a720f569fb2b4857fcd7c33c513671934c7ed7075a875e9e1d8c6`、`b89bbca322d22802897f3dee5043661f140159090509460c64e8698f8ae339e3`；contact：`2cc16a9dd8f90dd1b1fa588fdeb9959198d0c2d187928f5fd94d7a01882edb07`(1×)、`47419fd731c5fea7f7e7cb88a29f6e25af8430135ccf2bb54268d227c395bc6b`(4×)。均不暂存。
- 第二轮（男性 r2，2026-07-23，P61–P63）：像素合同全过，但真实游戏尺寸下三名候选辨识度不足，用户评价三个候选在游戏里感觉都差不多，整轮被拒，归档于 `gate-1/rejected-male-r2/`。raw：`c0740fad1ef938a2f6cf7001ae8cd3e539f619d6cfa6573f43625f445d187101`、`b00542f5fa9d6247ae89d945de986cf8e7e92859f445fa5a06664f3ed4c2a94a`、`3c2180fa5e3d0e58ec07e4f20bb3ce607353c3b62b15540de3d87eb8d4c6ba6a`；cutout：`57945cfb3a236e016ff510564187dacff7a0a0c693ea857405ed5b3ba5446b7d`、`632bf5e90a6b35ce40aece3d7d1dc621bb4f71e98c2b24cc7d11975735e04a9c`、`ccd9f0f1c3abc4fa5c85a6f30b65f66d587b8dee091e7c49ab1df6762eaff89e`；final：`3bd0b6d52722a12f9f60aded145640f89d981adfe5460bcdf64fca544fb8a18b`、`280baa8f33d9bc3632413be987f2e4750dc1588d52c07e6dc6977b553f872133`、`44e4d90b7c01b486ec40f546503a120558909a15815204f68913407bf5cf22ab`；composite：`1e0a21511e18ebd93b912fc490c630894a1f8900a5325024883b8f2aab6879cd`、`ee8212aa23e43e5be45fb3dd53f52c037c214c08127812166de924115c8e3a3e`、`1d8a2c29751a1c7ba4ba1873ecd2d317a7e5a6a6a925f3e5ee5b10ff6739d60e`；contact：`4a9306efac4cc9a6440431055669a4dc4192dc172268f86273b148ed2f459d6b`(1×)、`3d4a08acbb854d8a7c584c58d370193f7aceec15b6569260c08a4c9027ef4635`(4×)。均不暂存。
- 第四轮（r4 精炼轮，2026-07-23，P67–P69）：在 r3 身份基础上做精修尝试，用户比较后认为反而不如上一版（r3），整轮否决，归档于 `gate-1/superseded-r4/`。raw：`9f2bd99e7dc202d5daf127c30381a2065119104faeb6502af85d8ffc9c8e7bd1`、`30da276570990dace736b3ceed88732bc90997acceb048b3e46428b24fccdf92`、`81c91b11c218e1cfa5af1a27d2fadab8288cb9ae68ec5d8a3a55cc7bd4cc8adb`；cutout：`6ad146444a49b889189b7016e94efa038d0725f2027ce216d3112674aa0869df`、`01a5b7b33f8666624d0529ca52235989ec6a09fe3d44a316a92f3e8864a51877`、`6fb84bc3756326f50a8c9627d0f3469a201ed0588c36b3235ca69133b30d6597`；final：`bcdfcf7187f409d6e88d7f264678e9e66dba5145b9e23b2da7c93fc9243fd5dc`、`8e402fd01a429fddb4ca6cea3348b9f138a138b15380075b1c642aacceb3441f`、`be65b83226cc7fb96953cfcffe46e3d6114dd53e66e495700286799d46a45fce`；composite：`d5c9d4ee7a5885bdd6111829dc9bef747b9e844b48277229069606078d336b8c`、`0ccbc8cf852dad339590a1050a3a293493aefaf71b70428a7e32650a208a88de`、`a3a792ae8e9947615e68dc62615cff1b60629792ca569a854b8a5fdf5ac652ea`；contact：`271166de9eb3786bbc9d545b6de5ef6b0389a94101e2e499241eb25e50424305`(1×)、`0350364ffa4f205f5c17a59d7f9a1b37a4aff62235ef2420cfcf83724d56b03a`(4×)。均不暂存。
- WebBridge 截图驱动的请求/响应痕迹与 vite 日志见 `gate-1/webbridge/`，仅为审计，不暂存；`gate-1/capture-gameplay.sh` 为可复用的截图采集脚本，同属不暂存审计物。

### P58 gate-1 round-1 female variant a rejected

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult female Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant A: compact agile responder; short asymmetric bob visible around a low-profile half-mask; slim but realistic armored vest; muted amber shoulder identification strip.
```

### P59 gate-1 round-1 female variant b rejected

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult female Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant B: balanced containment specialist; tied-back braid loop visible behind full respirator and goggles; medium protective vest; desaturated teal forearm identification tab.
```

### P60 gate-1 round-1 female variant c rejected

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult female Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant C: robust breach responder; close-cropped side hair under a compact protective hood; heavier rectangular over-vest without oversized armor; muted crimson collar identification tab.
```

### P61 gate-1 round-2 male variant a rejected

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant A: compact agile responder; short tactical crop hair visible around a low-profile half-mask; slim but realistic armored vest; muted amber shoulder identification strip.
```

### P62 gate-1 round-2 male variant b rejected

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant B: balanced containment specialist; short buzz cut visible around a full respirator and goggles; medium protective vest; desaturated teal forearm identification tab.
```

### P63 gate-1 round-2 male variant c rejected

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant C: robust breach responder; close-cropped hair under a compact protective hood; heavier rectangular over-vest without oversized armor; muted crimson collar identification tab.
```

### P64 gate-1 round-3 male variant a accepted

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, instantly readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color covering a LARGE clearly visible feature rather than a tiny tab; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant A: lean recon pointman, visibly the slimmest of three teammates; short hair under a single wide glowing AMBER visor band that wraps the whole upper head like a bright horizontal bar; lighter graphite-gray uniform tone; narrow shoulders; compact submachine gun held low; the amber visor band must be the largest and brightest color area on the character, unmistakable at tiny size.
```

### P65 gate-1 round-3 male variant b accepted

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, instantly readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color covering a LARGE clearly visible feature rather than a tiny tab; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant B: heavy breach responder, visibly the broadest of three teammates with a wide shoulder and back silhouette; bare buzz-cut head with a full respirator whose round jaw filters widen the head profile; two large muted CRIMSON shoulder pauldron pads forming bulky blocks on both shoulders; dark navy uniform; compact bullpup shotgun silhouette held low; the crimson pauldrons must be the dominant color feature, unmistakable at tiny size.
```

### P66 gate-1 round-3 male variant c accepted

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, instantly readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color covering a LARGE clearly visible feature rather than a tiny tab; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant C: containment tech specialist with a unique gear silhouette; hooded head with a slim teal visor slit; a tall slim backpack with a short antenna rising behind one shoulder and a glowing desaturated TEAL equipment panel covering most of the backpack; dark navy and graphite uniform; compact rifle held low; the backpack plus antenna and the teal panel must make this character unmistakable at tiny size.
```

### P67 gate-1 round-4 male variant a superseded

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, instantly readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: master-level detailed orthographic top-down 2D pixel art, deliberate hard pixel clusters, clean value grouping, crisp readable shapes at tiny size, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color covering a LARGE clearly visible feature rather than a tiny tab; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant A (refine an approved identity, keep it recognizable): lean recon pointman, visibly the slimmest of three teammates; short hair under an angular glowing AMBER visor band with a designed angular goggle frame wrapping the upper head; athletic narrow stance; suppressed compact submachine gun held low; graphite uniform in a slightly lighter value so the figure separates cleanly from dark floors; the amber visor band remains the largest and brightest color area, unmistakable at tiny size.
```

### P68 gate-1 round-4 male variant b superseded

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, instantly readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: master-level detailed orthographic top-down 2D pixel art, deliberate hard pixel clusters, clean value grouping, crisp readable shapes at tiny size, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color covering a LARGE clearly visible feature rather than a tiny tab; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant B (refine an approved identity, keep it recognizable): heavy breach responder, visibly the broadest of three teammates; massive ANGULAR shoulder pauldrons in muted crimson with dark armored cores, clearly designed equipment rather than round blobs; thick reinforced chest plate; wide braced stance; bare buzz-cut head with full respirator whose round jaw filters widen the head profile; dark navy uniform; compact bullpup shotgun held low; the crimson pauldrons remain the dominant color feature, unmistakable at tiny size.
```

### P69 gate-1 round-4 male variant c superseded

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult male Foundation anomalous-response operative, instantly readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: master-level detailed orthographic top-down 2D pixel art, deliberate hard pixel clusters, clean value grouping, crisp readable shapes at tiny size, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color covering a LARGE clearly visible feature rather than a tiny tab; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
Variant C (refine an approved identity, keep it recognizable): containment tech specialist; clean hooded head profile with a slim teal visor slit; tall slim backpack carrying a short comms mast tipped with a small teal light; large desaturated TEAL equipment panel with vertical light strips covering most of the backpack; dark navy and graphite uniform; compact rifle held low; backpack, mast and teal panel keep this character unmistakable at tiny size.
```

## 玩家角色 Gate 2 原型

本节记录玩家角色第一阶段 Gate 2（down 方向移动原型验收门）的全部生成。两轮方向板于 2026-07-24 使用 Kimi 内置 image_generation 插件（经 agent-gw `generate_image` 网关，1:1、1K、opaque 背景）生成；工具未公开具体模型名，故不推断；该生成服务的输出权利条款同样须在商业发布前复核。两轮均以 Gate 1 已接受剪影 A（[P64](#p64-gate-1-round-3-male-variant-a-accepted)）作为 Image 1 唯一身份、造型、识别色与像素风参考输入；没有使用用户截图、SCP Wiki 图片、素材包或其他第三方图像作为输入；没有使用 CLI/API fallback。所有后处理使用 codex runtime Python 3.12（Pillow 12.2）执行。raw、cutout、被拒轮次、提示词、浏览器 smoke 截图与状态快照全部保留在 `.superpowers/sdd/player-character/gate-2/`，该目录为本地审计物，不暂存。

2026-07-24 用户验收结论：原型经 `?playerCharacterPrototype=live` 实时预览试玩（WASD 全触发原型动画、呈现朝向钉死 down），用户回复"可以"，批准进入 Gate 3 完整 120 帧四方向 production，Gate 2 以此形式验收通过；造型与尺寸无负反馈。原型在 production 用户接受前不删除、不替换默认角色；当前仅经开发门显示，`DEFAULT_OPENING_PLAYER_ASSET_ID` 仍为 `legacy`。

### Gate 2 已接受原型（r2，2026-07-24 用户批准进入 Gate 3）

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| player-response-operative-prototype（琥珀侦察尖兵 down 方向移动原型表） | PNG | `public/assets/art/characters/player-response-operative-prototype.png` | Kimi 内置 image_generation（agent-gw `generate_image`，模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `gate-2/clean_board_components.py` + `scripts/art/build_player_character_assets.py` | 2026-07-24 | [P70](#p70-gate-2-down-prototype-r2-accepted)；audit raw `gate-2/raw/down-prototype.png`；raw SHA-256 `9643fadffb8cba64be3acdc2b5d0099f52282ad156d40e1d8b2b8a3bb073b48a` | 无手绘；bundled helper chroma 抠图后，`clean_board_components.py` 连通分量清洗移除 5499 个游离像素（含 raw 左下"AI生成"水印残留，水印整体落在 row 6 空白区，未被读入任何帧），输出 clean cutout SHA-256 `6db1772ae5c07dd5ee0170b5a6d5be0f0c186035eab27a393a7353aa55732221`；随后 `build_player_character_assets.py prototype`（6×6 网格裁帧、Pillow nearest、二值 alpha、可见高归一 50、五动作中位 49–50、baseline 对齐）输出 prototype SHA-256 `584d714f33f01429bf842c3e3bc1f3d95e2df61fe7f84c613afd2e010081cca2` | 项目定制生成；无第三方图像输入；商业发布前复核生成服务输出权利条款与项目许可 | 原型；商业发布前复核 | Gate 2 原型验收通过（2026-07-24 用户试玩后批准进入 Gate 3）；仅 down 方向五动作原型准入，不含 hit、left/right/up 方向与 legacy 像素；不等同于 production 或商业发布准入 | 1792×64（28 帧 64×64：idle 4 + forward/backward/strafeLeft/strafeRight 各 6，二值 alpha） | 无 |

### 处理与审计产物

- 运行时接入：Task 4 运行时角色呈现合同（commit `d01a46c`，`driver` 身体保护收窄为世界几何比较）+ `main.js` 双开发门 `?playerCharacterPrototype=1`（bridge 烟雾）与 `=live`（实时预览，呈现朝向钉死 down，WASD 全触发原型动画）；`manifest.js` 新增 `playerCharacterPrototype` entry；`build` 通过且 dist grep 无 `playerCharacterPrototype` 泄漏到默认路径。
- 浏览器 smoke：`.superpowers/sdd/player-character/gate-2/run_prototype_smoke.py`，最终输出 `SMOKE_OK: 24 states, 11 screenshots, 0 console errors`；截图与 `state-snapshots.json` 存于 `gate-2/`，不暂存。WebBridge 后台标签页 RAF 冻结经 `Page.addScriptToEvaluateOnNewDocument` 注入 `requestAnimationFrame→setTimeout` shim 解决；live 模式以琥珀像素指纹（sheet 688、上屏 15–63、legacy 0–16）与 WASD 实测验证。
- 评审页：`gate-2/gate-2-review.html`（含 `=live` 说明与 WASD 行为），不暂存。
- 测试证据：Node 全套 339/339（含 driver 12、art-assets、player-character-assets 原型合同）；Python 13/13（builder）；与基线相比无回归。

### 筛选与失败尝试

- 第一轮（r1，2026-07-24，P71）：生成结果为 4×5 网格而非指定的 6×6、backward 行画成背面（违反"全部正面朝向"约束）、画面带"AI生成"水印，Agent 硬门槛不通过，未进入抠图与组装，归档于 `gate-2/rejected-r1/`。raw SHA-256 `6581a8e19b4ba4dd7ccd015fa76f0e1ba7326001ad05f53a9abb7972d19d2300`；prompt 归档 SHA-256 `5ea887bd3b8cd182930b675db0ee6fe7f1c1f363a27f9b1e821ebfdc48dc10d1`。均不暂存。

### P70 gate-2 down prototype r2 accepted

```text
Use case: identity-preserve
Asset type: source pose board for one-direction prototype of a production 64x64 top-down 2D pixel-art player spritesheet
Input images: Image 1 is the sole approved identity, silhouette, uniform, protection gear, identification color and pixel-art reference
Primary request: exactly 28 isolated poses of the same adult male Foundation anomalous-response operative arranged in a precise 6-column by 6-row grid of 36 equal square cells that fills the entire canvas edge to edge; every pose natively faces straight down toward the viewer with the amber visor band clearly visible
Layout: row 1 columns 1-4 are four idle phases, columns 5-6 stay empty flat green; row 2 columns 1-6 are six forward tactical walk phases; row 3 columns 1-6 are six backward tactical walk phases; row 4 columns 1-6 are six left-strafe phases; row 5 columns 1-6 are six right-strafe phases; row 6 columns 1-6 stay empty flat green
Facing: all 28 poses show the FRONT of the character facing the viewer; the backward-walk row keeps the identical front view and only reverses the leg stepping; never draw the back, backpack or rear of the character
Motion: real alternating boot contact, knee bend, hip/shoulder counter-rotation and compact weapon stabilization; backward visibly plants heels and withdraws weight; strafes use distinct crossing/opening footwork without rotating the torso away from down
Scene/backdrop: perfectly flat uniform #00ff00 chroma-key background in every cell including the 8 empty cells, no cell border, no grid lines
Style/medium: detailed orthographic top-down 2D pixel art, coarse hard pixel clusters, realistic adult proportions, same palette and identity as Image 1, no antialiasing
Composition/framing: one centered pose per populated cell, equal scale, full body, stable baseline, generous cell padding, no overlap between cells
Constraints: every populated pose differs by real limb articulation after translation alignment; preserve exact hair/head silhouette, respirator/goggles, tactical uniform, amber visor identification color and compact held firearm; weapon keeps pointing down; no mirroring, recolor-only, translation-only, bob-only or scale-only variants; no shadow, floor, text, logo, watermark, muzzle flash, blood, extra person, floating weapon or separate shoulder module
Avoid: chibi, oversized head, 3D, isometric, side-view, rear view, smooth painting, soft transparency, duplicated poses, wrong column count, missing cells
```

### P71 gate-2 down prototype r1 rejected

```text
Use case: identity-preserve
Asset type: source pose board for one-direction prototype of a production 64x64 top-down 2D pixel-art player spritesheet
Input images: Image 1 is the sole approved identity, silhouette, uniform, protection gear, identification color and pixel-art reference
Primary request: exactly 28 isolated poses of the same adult male Foundation anomalous-response operative in a precise 6-row by 6-column grid, all natively facing down toward the viewer
Layout: row 1 columns 1-4 are idle phases and columns 5-6 empty; row 2 is forward tactical walk phases; row 3 is backward tactical walk phases; row 4 is left-strafe phases; row 5 is right-strafe phases; row 6 empty
Motion: real alternating boot contact, knee bend, hip/shoulder counter-rotation and compact weapon stabilization; backward visibly plants heels and withdraws weight; strafes use distinct crossing/opening footwork without rotating the torso away from down
Scene/backdrop: perfectly flat uniform #00ff00 chroma-key background in every cell, no cell border
Style/medium: detailed orthographic top-down 2D pixel art, coarse hard pixel clusters, realistic adult proportions, same palette and identity as Image 1, no antialiasing
Composition/framing: equal scale, full body, stable baseline, generous cell padding, no overlap
Constraints: every populated pose differs by real limb articulation after translation alignment; preserve exact hair/head silhouette, respirator/goggles, tactical uniform, identification color and compact held firearm; weapon keeps pointing down; no mirroring, recolor-only, translation-only, bob-only or scale-only variants; no shadow, floor, text, logo, watermark, muzzle flash, blood, extra person, floating weapon or separate shoulder module
Avoid: chibi, oversized head, 3D, isometric, side-view, smooth painting, soft transparency, duplicated poses
```

## 玩家角色 Player Overhaul Body Gate A2

本节记录 2026-07-31 完成的两个 5 帧真实游戏内动态小样，以及 2026-08-03 的项目所有者选择。Body Gate A0 的战术 Q 版比例已接受；静态 A1 路线因游戏内仍像贴图、候选差异不足而失败。A2 因此只比较同场景、同一低饱和灰色 dummy equipment、同一动作顺序下的 A 黑灰突入员和 B 灰白防化员。两套 ImageGen 输出都只作为身份与动作参考，最终小样在原生 64×64 网格中重建，没有直接缩小参考图。

2026-08-03 项目所有者回复“先用A吧”：A 黑灰突入员获准作为 Body Gate B 单方向 28 帧原型的唯一身份参考。该结论不批准普通游戏默认切换、四方向正式表、正式装备或商业发布。B 灰白防化员本轮暂不采用，完整保留在 `.superpowers/sdd/player-overhaul-phase1/gate-a/` 作为可回退对照，不删除。

| Asset | Type | Path | Tool/model | Date | Source / SHA-256 | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A 黑灰突入员 ImageGen 参考 | PNG | `.superpowers/sdd/player-overhaul-phase1/gate-a/breacher-imagegen-reference.png` | OpenAI ImageGen（工具未暴露具体模型名） | 2026-07-31 | [P72](#p72-body-gate-a2-a-黑灰突入员参考)；SHA-256 `acc24220c3a27f27cefd07bee31b8d610c6b1f08e6152356bb4e93b5be3e1e9c` | 无直接资产化；仅用于观察职业轮廓、头盔、琥珀护目镜和步态 | 项目定制生成；无第三方图像输入；商业发布前复核生成服务输出权利条款与项目许可 | 本地参考；不可单独视为正式商业资产 | 仅身份与动作参考 | 生成服务未要求额外署名；商业发布前复核 |
| B 灰白防化员 ImageGen 参考 | PNG | `.superpowers/sdd/player-overhaul-phase1/gate-a/cbrn-imagegen-reference.png` | OpenAI ImageGen（工具未暴露具体模型名） | 2026-07-31 | [P73](#p73-body-gate-a2-b-灰白防化员参考)；SHA-256 `9dac0e9fb6f647ed228068ab856652e07a85fa8bee2b5eee0fcbed7414fdd364` | 无直接资产化；仅用于观察防化头罩、面罩、黄色警示带和压重步态 | 项目定制生成；无第三方图像输入；商业发布前复核生成服务输出权利条款与项目许可 | 本地参考；不可单独视为正式商业资产 | 本轮暂不采用，保留可回退对照 | 生成服务未要求额外署名；商业发布前复核 |
| A 黑灰突入员 5 帧动态小样 | PNG | `public/assets/art/characters/player-response-operative-breacher-sample.png` | Pillow 原生像素重建脚本 | 2026-07-31 | A 参考 + `.superpowers/sdd/player-overhaul-phase1/gate-a/build_a2_dynamic_samples.py`；脚本 SHA-256 `8bbdf1b0614f7f6cddb9ed131c6f8e3891804cdc024662e8e6934c67c3ad6346`；输出 SHA-256 `a37d0d906e7656909bdecb63cb8638e9149e3061c135d7846d58f71131fb0640` | 在原生 64×64 网格中以硬边有限色板重建；二值 alpha；帧 0 left-facing idle，帧 1–4 为独立窄步幅移动；baseline y=56；没有前臂、手、武器、枪口、烘焙阴影或抗锯齿光晕 | 项目自制派生小样；参考由项目定制生成；商业发布前复核生成服务条款 | 开发态 Gate 小样；非正式商业资产 | Gate A2 选择通过，仅准入 Gate B 单方向 28 帧 | 320×64（5×64×64） | 无 |
| B 灰白防化员 5 帧动态小样 | PNG | `public/assets/art/characters/player-response-operative-cbrn-sample.png` | Pillow 原生像素重建脚本 | 2026-07-31 | B 参考 + 同一重建脚本；输出 SHA-256 `93bfb707c4baabbd3aa4fcf1cf198b4060c580d39debe517f29f986d541714dc` | 在原生 64×64 网格中以硬边有限色板重建；二值 alpha；帧 0 left-facing idle，帧 1–4 为独立宽步幅压重移动；baseline y=56；没有前臂、手、武器、枪口、烘焙阴影或抗锯齿光晕 | 项目自制派生小样；参考由项目定制生成；商业发布前复核生成服务条款 | 开发态 Gate 小样；非正式商业资产 | 本轮暂不采用，保留可回退对照 | 320×64（5×64×64） | 无 |
| A 黑灰突入员 two-direction 质量小样 | PNG + 本地审计证据 | `public/assets/art/characters/player-response-operative-breacher-sample.png`；审计详情见下节 | OpenAI built-in ImageGen 仅动作参考 + Pillow 确定性原生像素 builder | 2026-08-04 | 完整 prompt、两输入/输出、builder/test/socket/PNG/review SHA-256 均登记于下节 | 只把参考中的步态、压重和重心信息重建到固定 5 帧左向原生像素资产；运行时右向仅镜像 body 与当前 frame socket | 项目定制参考 + 项目自制确定性重建；商业发布前仍须复核生成服务条款与项目许可 | 开发态质量 Gate；非正式商业资产 | 仅供 960×540 用户视觉验收；不批准 28/120 帧、正式武器、默认切换或商业发布；原 Gate B 28 帧路线和证据暂停且保留 | 320×64（5×64×64，RGBA，二值 alpha，9 个实际不透明 RGB 色，baseline y=56） | 无；商业发布前复核 |

### 临时接点与实机证据

- A 临时接点（`gripX,gripY / supportX,supportY`）：`21,31 / 36,33`、`20,30 / 35,32`、`22,32 / 37,34`、`20,31 / 34,33`、`22,30 / 36,32`；全部为 `front`。
- B 临时接点：`18,32 / 41,34`、`17,31 / 40,33`、`19,34 / 42,36`、`17,33 / 39,35`、`19,31 / 41,33`；全部为 `front`。
- A 6 秒实机 GIF：`.superpowers/sdd/player-overhaul-phase1/gate-a/a2-sample-a-6s.gif`，SHA-256 `7b362e55ae2be2ce088b93ea44a9319725548178b21c0fd18b9ecbbf526eb594`。
- B 6 秒实机 GIF：`.superpowers/sdd/player-overhaul-phase1/gate-a/a2-sample-b-6s.gif`，SHA-256 `8ccaba8ae823984dcf032f521405503a484819396e23072569234ce02c8aaf70`。
- 原生场景无标签并排图：`.superpowers/sdd/player-overhaul-phase1/gate-a/a2-ab-unlabeled-960x540-each.png`，SHA-256 `c4f2cbe3bdf4dbbf83236bb1660e52afce58a4fb5690094c3b78d41e3ad50f3f`。
- A 步态时长 `110/90/110/90ms`，停止反馈 `90ms`、无回摆；B 步态时长 `150/130/150/130ms`，停止反馈 `180ms`、一次 1px 回摆。
- 两套小样只通过显式开发 URL 使用；普通 URL 仍选择 legacy。dummy equipment 只读取已提交的表现角度，不创建子弹、不定义伤害、不改变目标。

### 2026-08-04 A 黑灰突入员 two-direction 质量小样登记

- ImageGen 输入 1（身份/装备参考）：`.superpowers/sdd/player-overhaul-phase1/gate-a/breacher-imagegen-reference.png`，SHA-256 `acc24220c3a27f27cefd07bee31b8d610c6b1f08e6152356bb4e93b5be3e1e9c`；输入 2（已接受的 64px 轮廓、比例、色块与原生左向可读性）：`public/assets/art/characters/player-response-operative-breacher-sample.png` 的 Gate A 版本，SHA-256 `a37d0d906e7656909bdecb63cb8638e9149e3061c135d7846d58f71131fb0640`。
- ImageGen 输出：`.superpowers/sdd/player-overhaul-phase1/two-direction-quality-sample/imagegen-motion-reference.png`（1983×793），SHA-256 `ba6900c79f78bc7e0f5eba6457d2bbba798fc8672018bca4517d8699be19a556`。它仅用于动作观察，绝不直接资产化；输出并非原生 64px 可切帧表，比例/细节也高于既接受样片。输出出现的完整前臂和手违反 body-only elbow attachment stumps 约束，明确不采用为最终 builder 的手臂或像素规则。
- 完整 ImageGen prompt：

```text
Use case: stylized-concept
Asset type: motion reference for a 64px top-down game sprite
Primary request: create one five-pose horizontal motion-reference strip for the exact same adult SCP Foundation black-and-charcoal breacher shown in the references. Pose 1 is a grounded left-facing idle. Poses 2-5 are one complete left-facing run cycle: left-foot contact, compression/passing, right-foot contact, recovery/passing.
Input images: Image 1 is the exact profession and equipment identity reference; Image 2 is the exact approved 64px silhouette, proportions, palette blocks and native left-facing read that must be preserved.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, no floor.
Style/medium: crisp hard-edged limited-palette tactical chibi pixel-game animation reference.
Composition/framing: exactly five equally spaced full-body poses in one horizontal row, identical camera angle and body scale, generous separation, both boots visible.
Constraints: preserve the same helmet, broad amber visor, charcoal wedge torso, adult tactical proportions and body-only elbow attachment stumps in all five poses. Show clear alternating foot plants, a brief compression pose, restrained shoulder/hip counter-motion and stable head scale. No complete forearms, hands, weapon, muzzle, holster, shadow, effects, labels, grid lines, text or watermark. Do not use #ff00ff in the subject.
Avoid: identity drift, different characters, front/back views, flattened body, soft gradients, blur, antialiased halo, whole-body bouncing, exaggerated cartoon jumping.
```

- 可复现文件 SHA-256：builder `scripts/art/build_player_two_direction_asset.py` `bad69681e2184d86b25c1963ef575e126454b213c703f32a761ae277a73cca3f`；质量测试 `scripts/art/test_player_two_direction_asset.py` `e02b6ab17f6ac0db3f7be1866d759e03d0eed236dcc8fafbd43ae5dbd7843a77`；socket JSON `scripts/art/data/player-two-direction-quality-sample-sockets.json` `8562afe584ca899fe9ebb04f8848246bf767dde6c50fc85806790701f6278844`；生成 socket JS `src/art/playerTwoDirectionQualitySampleSockets.js` `d2e5f3758392724eb8f032cf2ece39da9d59fe65e4a0a38116489f4cb2808bcb`；最终 PNG `c95e247abac034c6fd770d685f1e45f9fab12279d639e63850c572ef95cc8396`；最终审查图 1× `quality-sheet-1x.png` 同 PNG hash，nearest 8× `quality-sheet-8x.png` `1dcc924fdbaf9b56ba2026722348ed238ff79471d1e2b48b338d2c833cadfc27`。
- 资产合同：320×64、5×64×64、RGBA、alpha 仅 `0/255`、全表 9 个实际不透明 RGB 色、baseline `y=56`；frame 0 固定 RGBA SHA-256 `a22cbc0606d41dc59c4c008e9c56e1d5aff96b0d619b2271c15ab553aad7911f`。帧语义为 1 idle + 4 run（左脚接触、压重/交错、右脚接触、恢复/交错）；唯一原生素材为左向，右向运行时镜像 body 与当前 frame socket，无 side-step。
- 表现合同：two-direction 固定脚点；停止时 frame 2 收势恰为 100ms 后回 idle；武器 aim 独立于 body，后坐仅移动 rig，不移动角色或游戏锚点。缺资产、接点、手臂、测试武器或生命周期任一失败时整包回退 legacy，普通 URL 不泄漏开发预览。
- 琥珀上限：项目所有者已确认把原 `<=90` 修正为 `<=100`，因为冻结 frame 0 的同一检测谓词已有 100 个琥珀像素；保留 frame 0 hash 和身份不变，否则两个硬约束数学上无法同时满足。
- Gate 冻结范围：这是开发态质量验收，尚未批准 28/120 帧、正式武器、默认切换或商业发布。原 Gate B 28 帧候选路线及其 rejected/结构证据均暂停、保留且不删除。

### P72 Body Gate A2 A 黑灰突入员参考

```text
Create a five-pose concept strip for one adult SCP Foundation mobile task force breacher,
shown left-facing in a true top-down three-quarter game view. Pose 1 is a grounded idle;
poses 2 through 5 are four clearly different walk-cycle poses. Use the already approved
restrained tactical-chibi proportion: helmeted head about one third of visible height,
broad but compact shoulders, short stable legs and practical boots. Identity must read
from large shapes at tiny game size: dark charcoal and steel-grey armor, angular ballistic
helmet, one wide horizontal amber visor, compact wedge-shaped shoulder silhouette.
Body-only modular base in every pose: head, torso, upper arms, hips and legs present;
both complete forearms, both hands, every firearm, every blade, every weapon, every
muzzle, every shoulder-mounted device and every weapon-shaped holster absent. Leave
clean attachment space at both elbow ends. Transparent background, no baked shadow,
no floor, no text, no labels, no UI, no floating equipment. Serious SCP containment
tone, crisp hard-edged limited-palette pixel-game concept, no soft gradients, no blur,
no antialiased halo, no cute eyes, no mascot styling. This is a pose and identity
reference, not a finished spritesheet.
```

### P73 Body Gate A2 B 灰白防化员参考

```text
Create a five-pose concept strip for one adult SCP Foundation CBRN containment operator,
shown left-facing in a true top-down three-quarter game view. Pose 1 is a grounded idle;
poses 2 through 5 are four clearly different walk-cycle poses. Use the already approved
restrained tactical-chibi proportion: large sealed hood about one third of visible height,
wide protected shoulders, compact wrapped torso, short stable legs and heavy sealed boots.
Identity must read from large shapes at tiny game size: grey-white sealed suit, round CBRN
hood, dark respirator faceplate, one broad yellow contamination-warning band, visibly
wrapped and wider silhouette. Body-only modular base in every pose: head, torso, upper
arms, hips and legs present; both complete forearms, both hands, every firearm, every
blade, every weapon, every muzzle, every shoulder-mounted device and every weapon-shaped
holster absent. Leave clean attachment space at both elbow ends. Transparent background,
no baked shadow, no floor, no text, no labels, no UI, no floating equipment. Serious SCP
containment tone, crisp hard-edged limited-palette pixel-game concept, no soft gradients,
no blur, no antialiased halo, no cute eyes, no mascot styling. This is a pose and identity
reference, not a finished spritesheet.
```

## 玩家角色 Player Overhaul Body Gate B（首版失败，重制中）

2026-08-03 按用户已选择的 Gate A2 方案 A（黑灰突入员）进入单方向 28 帧验证。当前候选只用于 `?playerPresentation=body` 开发门；普通游戏仍使用 legacy，未准入 left/right/up、hit、默认角色或正式商用素材。

2026-08-03 项目所有者在原生游戏画面审阅后否决首版 Gate B：首版只继承了黑灰配色和琥珀面罩，没有保持 A 的尖锐头盔、斜楔躯干、前后肩层次与整体体量，人物身份明显漂移且观感弱于 A2 预览。首版结构证据完整保留在 `.superpowers/sdd/player-overhaul-phase1/gate-b/rejected-2026-08-03-identity-drift/`，不得以既有自动测试结果视为美术通过。当前 Gate 已重开，先验证单个 down-facing 身份锚点；未通过前不重建整套、不进入 Task 9。

ImageGen 连续三次使用下列逐字 prompt，但输出出现 backward 行转成背面、strafe 行转成侧面、棋盘背景等违反合同的问题，均被拒绝并仅保留在 `.superpowers/sdd/player-overhaul-phase1/gate-b/rejected-imagegen/`：attempt-1 SHA-256 `d1b1bb36a507e36c03c920265fcbb12162794bd2f1c5346b3645d74e6259a450`、attempt-2 `7043bdca987a0ed3bfc309c4ce74751cef8280ff6f94e224af3c2ce497ac35a0`、attempt-3 `4fc8618cffc9ece28457f5b849c5521f9082e31c19197fc0dd567b0eeb9d5d88`。没有用模糊抠图修补这些失败输出。

```text
Using the approved body-only SCP Foundation operative as the exact identity reference,
create one orthographic top-down 3/4-view animation board on a transparent background.
The operative faces downward in every occupied cell. Keep the same approved restrained
tactical-chibi proportions, adult identity, profession silhouette, headgear, dominant
color blocks, identification markings, boots and palette in every frame.
Body-only modular base in every frame: torso, upper arms, hips and legs are present;
both forearms, both hands, all weapons, all muzzles, all shoulder devices and all
weapon-shaped holsters are absent. Preserve clear attachment space at both elbow ends.
Use a precise 6-column by 6-row grid with equal cells and no grid lines or labels.
Occupied cells: row 1 columns 1-4 are idle; row 1 columns 5-6 are empty; row 2 has
six forward-walk poses; row 3 has six backward-walk poses; row 4 has six strafe-left
poses; row 5 has six strafe-right poses; row 6 is empty. Every occupied pose is unique,
feet use a consistent baseline, torso size and camera angle never change, and movement
has grounded weight rather than exaggerated jumping. Crisp hard-edged limited-palette
pixel-game rendering, transparent background, no shadow, no text, no effects, no blur,
no antialiased halo and no extra objects.
```

为继续验证“28 帧、脚底、接点、遮挡和 dummy equipment”这组结构合同，当前候选由本地 Pillow 脚本按 A 的大轮廓与琥珀面罩重建，不冒充被拒的 ImageGen 输出：

| Asset | Path | Processing / SHA-256 | Admission |
|---|---|---|---|
| 6×6 down 动作板 | `.superpowers/sdd/player-overhaul-phase1/gate-b/down-board.png` | `build_gate_b_board.py`（SHA-256 `2eac87e9079f40cb84afc28f51acc81b9d5116dadbe1377aa900712720acc74b`）生成；board SHA-256 `b422fed8684d24c6e477e9f8155bfc35f2aecb666b712290a71d412a15a28bb7` | 本地开发证据，不暂存 |
| 28 帧 body-only 原型 | `public/assets/art/characters/player-response-operative-body-prototype.png` | 6×6 裁帧、64×64 归一化、二值 alpha、≤32 色；SHA-256 `a2c7c9d29982492b718b05a34d6dbc368b134cbd6ae87157e06891838ef479bf` | Gate B 待用户接受；非默认、非 production |
| 权威接点 JSON | `scripts/art/data/player-response-operative-body-sockets.json` | 从最终归一化 28 帧中的 grip/support 标记逐帧复测，共 17 组不同坐标；SHA-256 `5f307a1e3a20cc26d4d0f9ef32bf1e96b1a5ee8aa066c85a9edb3d55017690f2` | 仅 down、28 项 |
| 冻结运行时接点模块 | `src/art/playerResponseOperativeBodySockets.js` | 由 builder 原子生成；SHA-256 `3c5b681ea4cc2b7f5de34f061694977206e9ee470296ebb469f833de6aa6cb99` | 随候选整包 fallback |
| 接点检查图 | `.superpowers/sdd/player-overhaul-phase1/gate-b/body-prototype-socket-overlay.png` | SHA-256 `98c7d56c44f4b9d686a3adf720bde6b06f9806fa6aad8a7fd9c1066ac3397b96` | 本地验收证据，不暂存 |

后处理命令为 `build_player_character_assets.py body-prototype` 与 `socket-overlay --frame-count 28`；builder 当前 SHA-256 `184bc38151c4fc1df5a9f4686e514a7c25013b1e4655fb463c43de7bb0e08c41`。当前候选的许可基础是项目自行编写的程序化像素重建；A 身份参考仍继承 Gate A2 的生成服务条款复核要求。最终准入结论等待用户查看原生 1×28 表、接点图和 960×540 实机截图后确认。

## R-17 普通敌人 Gate 2 动作表（Gate 5 production admission）

本节登记裂吻梭、芽体与缺帧体三张正式动作表。项目所有者已接受 Gates 1–4 的九张 final，Gate 5 将三张表与其余六张一起原子加入普通 production preload/bundle；上方七条 legacy R-17 登记仍是不完整、缺失或失败时的 fallback，未被替换或删除。P74–P84 的共同、身份、动画板、角色/clip 与 SCP-049 提示/lineage 附录保持原始来源记录。

外部证据根目录为 `C:\scp-survivor-workspaces\evidence\enemy-scp049-visual-overhaul`；下文 `gate-1/...`、`gate-2/...` 均相对于该目录。外部 evidence 不随 Git 提交；Gate 2 行中的旧 development-only 描述是当时的历史状态，当前 production admission 以本节 Gate 5 reconciliation 为准。

| Asset | Type | Path | Tool/model | Date | Source / SHA-256 | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| r17-rift-skimmer-action-sheet | spritesheet PNG | `public/assets/art/enemies/r17-rift-skimmer-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Gate 1 cleanup + `build_enemy_boss_assets.py` | 2026-08-26 | 唯一图像输入 `gate-1/normalized/r17-rift-skimmer.png`，SHA-256 `789A41F703E537A9556931C66DB4C39936DE52429F4D7DFF41DD28CE66908C29`；共同提示 [P74](#p74-r-17-gate-2-common-animation-board-prompt)，所选逐字提示 [P75](#p75-rift-skimmer-gate-2-selected-exact-prompts)；所选 raw/keyed 与淘汰链见本节及 `gate-2/logs/r17-rift-skimmer-prompt-ledger.md`；public 与 normalized 最终 SHA-256 均为 `7B944216E4B78EAACB1A36D8AE023AC03C343E5FBDA523E56FC4EC226065E304` | 对所选 board 做可审计色键；signed `int16` 近绿 predicate；move/pierce 仅右补 2px 透明列；Gate 1 cleanup；按 move/hit/death/pierce 组装；无主体像素增补或重绘。旧 `uint8` 下溢候选已拒绝 | 项目定制生成；唯一图像输入为项目已接受 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；不得由静态 PASS 推断正式商用准入 | Gate 2 review candidate; dev-only, not production-admitted | 864×48（18×48×48；move 0–5、hit 6–7、death 8–13、pierce 14–17；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |
| r17-bud-action-sheet | spritesheet PNG | `public/assets/art/enemies/r17-bud-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Gate 1 cleanup + `build_enemy_boss_assets.py` | 2026-08-26 | 唯一图像输入 `gate-1/normalized/r17-bud.png`，SHA-256 `DF1DC4BC4FE54A7EF2A0B010F5AB7A77B9A1B69B81F1D23208DB80878BA1E8C9`；共同提示 [P74](#p74-r-17-gate-2-common-animation-board-prompt)，所选逐字提示 [P76](#p76-bud-gate-2-selected-exact-prompts)；31 次调用及处理链见 `gate-2/logs/r17-bud-prompt-ledger.md`（ledger SHA-256 `8E53AA469BEF682DEE19743D2EEEDA9F86CD1646723FEBB79140FE37119C0F7A`）；public 与 normalized 最终 SHA-256 均为 `22FF646CE9EE1DDC1B67305C95E5D4FA9C6C862A494976598AC87025E0FA99E6` | 所选 raw 经明确容差色键、外连绿边/残绿 predicate、最小透明补列与 Gate 1 cleanup；按 move/hit/death/snap 组装；未为对齐或过门禁添加/删除合法主体像素；旧人工补像素与删 steel lineage 禁用 | 项目定制生成；唯一图像输入为项目已接受 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；不得由静态 PASS 推断正式商用准入 | Gate 2 review candidate; dev-only, not production-admitted | 576×32（18×32×32；move 0–5、hit 6–7、death 8–13、snap 14–17；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |
| r17-frame-gap-action-sheet | spritesheet PNG | `public/assets/art/enemies/r17-frame-gap-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Gate 1 cleanup + `build_enemy_boss_assets.py` | 2026-08-26 | 唯一图像输入 `gate-1/normalized/r17-frame-gap.png`，SHA-256 `E9D209902B2291B8996FE8CB071F6AAA0B2FE52376064D42CDEEBED661471F56`；共同提示 [P74](#p74-r-17-gate-2-common-animation-board-prompt)，所选逐字提示 [P77](#p77-frame-gap-gate-2-selected-exact-prompts)；source audit `gate-2/logs/static-source-audit-rift-frame-gap.md`，SHA-256 `36D71A20F04BD3245A503F1129006A26CB9C37B46EEAF7A9C2E19AB664F555D6`；public 与 normalized 最终 SHA-256 均为 `FF72566E4C612EE6292E6135B0F06F2E7D12AA53FE0219F82B6304AB41BCF9C5` | 所选 board 经色键、绿边/grid/debris 清理、Gate 1 cleanup 后按 move/hit/death/role 组装；role 八格由 builder 拆为 phase-out 与 reappear-dash。特定 grid/fringe/debris 的逐字命令未落盘，明确记为 `UNKNOWN`，不冒充全链可独立重跑 | 项目定制生成；唯一图像输入为项目已接受 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；不得由静态 PASS 推断正式商用准入 | Gate 2 review candidate; dev-only, not production-admitted | 1408×64（22×64×64；move 0–5、hit 6–7、death 8–13、phase-out 14–17、reappear-dash 18–21；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |

### 静态审查、处理链与最终产物

- Rift Skimmer：最终静态 verdict `PASS`，Critical 0、Important 0；每帧 9–20 色，无触边或 1px island，baseline `y=46`，clip 中心漂移不超过 0.5px；death cyan `7→6→0→0→0→0`，pierce 从左/front cyan aperture 发力。完整静态来源审计为 `gate-2/logs/static-source-audit-rift-frame-gap.md`；独立审查结论只保存在 agent final 与该汇总审计中，单独 review report 路径为 `UNKNOWN`。
- Bud：最终静态 verdict `PASS`，Critical 0、Important 0；独立报告 `gate-2/review/r17-bud-static-review.md`，SHA-256 `88627F6732DB3A2DF6D5DB2DE2E0C025974F729D94F4BB65B492545920AFE2C3`；death cyan `8→4→2→2→0→0`，无 relight。报告中的移动宽度切换、针点级 steel 与合法小分量均保留为真实 `960×540` 复核项。
- Frame Gap：最终静态 verdict `PASS`，Critical 0、Important 0；每帧 11–17 色，无触边或 1px island，baseline `y=62`；phase-out opaque `1066→854→647→216`，reappear-dash `347→448→476→661`。完整静态来源审计同上；单独 review report 路径为 `UNKNOWN`。
- 三张 normalized/public 文件已逐字节核对；最终 SHA 分别为 `7B944216E4B78EAACB1A36D8AE023AC03C343E5FBDA523E56FC4EC226065E304`、`22FF646CE9EE1DDC1B67305C95E5D4FA9C6C862A494976598AC87025E0FA99E6`、`FF72566E4C612EE6292E6135B0F06F2E7D12AA53FE0219F82B6304AB41BCF9C5`。静态 PASS 不替代项目所有者的逐类型实机视觉 verdict。

#### Rift Skimmer 所选来源与处理

| Clip | Prompt id | Selected raw / SHA-256 | Selected keyed / SHA-256 |
|---|---|---|---|
| move | `move-attempt-03` | `gate-2/raw/r17-rift-skimmer-move-attempt-03.png` / `60D2C8A8CBD4E6F678BD3D94B8134383A36B6E6F4CFF7EFA93A7FD44BD69DDF2` | `gate-2/keyed/r17-rift-skimmer-move.png` / `D5D7F8DEB1080FEBAFBAC5C42379C71A7E534D59731A0724414A885BDDE63DEA` |
| hit | `hit-attempt-01` | `gate-2/raw/r17-rift-skimmer-hit-attempt-01.png` / `23755079D59CC82F77495498A181A558C60213278A70737D230A02FED57E52E8` | `gate-2/keyed/r17-rift-skimmer-hit.png` / `D45712DE4043036E1B079A104741D25B582CED75DA0E2E29EBE7FEACA8D18E3F` |
| death | `death-attempt-13` | `gate-2/raw/r17-rift-skimmer-death-attempt-13.png` / `AAEECB114DB3E0C1A32B5FA0827ABD9CE068FB5F7464CF0BF150DA9869936D6B` | `gate-2/keyed/r17-rift-skimmer-death.png` / `B6E50D4483B7562E4C0ED4F88DBD35943A9541E3FEC69F15DB740F0E7A79ADCD` |
| pierce | `pierce-attempt-04` | `gate-2/raw/r17-rift-skimmer-pierce-attempt-04.png` / `4DF901767ACC384624F79144464B572EA241B0575C1788FB9EBDD4234D428C9A` | `gate-2/keyed/r17-rift-skimmer-pierce.png` / `87EB0BA58EEF02DD38787489EE1979227A8706A6C78E5DA3CEE2CAB949A7A325` |

处理链：bundled chroma helper 的逐字 invocation/参数未写入 Rift ledger，因此该一步为 `UNKNOWN`；其后把 RGB 转为 signed `int16`，以 `alpha>0 && G>=80 && G-max(R,B)>=16` 移除满足该 predicate 的近绿 opaque 像素，move/hit/death/pierce 分别移除 4432/2812/5923/3042 px；move 与 pierce 只在右侧补 2 列透明像素，未裁切、缩放、移动或换序；再执行 `cleanup_gate1_assets.py --alpha-threshold 248 --colors 31`，最后由 `build_enemy_boss_assets.py r17-action` 组装。旧 `uint8` 下溢路径错误删除 cyan/steel，normalized SHA `DAF786421B768C39E278E8B8312CC772EFB77F72BFC4619F22BADA9D4BED2BA8`，已拒绝。

#### Bud 所选来源与处理

| Clip | Prompt id / prompt SHA-256 | Selected raw / SHA-256 | Selected keyed / SHA-256 |
|---|---|---|---|
| move | `move-15` / `4FE1E0091DC520DDEE2FB918591AAFF98869055BF59FA5E5479A807196F522C5` | `gate-2/raw/r17-bud-move-attempt-15.png` / `CD0333BF877232DB23085909ED38EB5406D0A6A4E860AC333AB5521F8833E64C` | `gate-2/keyed/r17-bud-move.png` / `FA5E92BFE3F072C06B66ABA3362750FAFBFCA672392D743293B77B34DBDC4573` |
| hit | `hit-04` / `D4BE51F76D25873B13E71CDC97946597EAE057E96151B69961A4DD78C6BA09C9` | `gate-2/raw/r17-bud-hit-attempt-04.png` / `C7AB0805E6B4A7EB3C70530A7F9C5ADAA205052DD8AFDC8501683CBB9AC9EA95` | `gate-2/keyed/r17-bud-hit.png` / `4D8588FF91DFD07E1925C7ADB80DFB12C239ED78CF62ADFAD83D4EBC53542828` |
| death | `death-08` / `6C536312A60FAE1B360AE8FCA94827BCC632C11982DB66790576F85D77817537` | `gate-2/raw/r17-bud-death-attempt-08.png` / `9858813B2FE62B06A368222F8503446270E5322B32E043875891A22A823DB34C` | `gate-2/keyed/r17-bud-death.png` / `7E13555932E7EE23668B70E5FCD67EC32E8C55B7382D4C252BFD019A82326486` |
| snap | `snap-03` / `AE84D40CE130E13D8A21D8DB97AE5BE4B8CD4D36517C7B847A3BC175F7125BA4` | `gate-2/raw/r17-bud-snap-attempt-03.png` / `DB55EF964776FF8B95F6B5DC639404837D184B5F743BE9F971D39AA4EA9A1770` | `gate-2/keyed/r17-bud-snap.png` / `6187EC50641318FDF8108BFE8812F6DB3B74859A9E0DAA3776AA1F87A141E034` |

处理链完整记录于 Bud ledger：四张所选 raw 先执行 bundled `remove_chroma_key.py`（`#00FF00`、tolerance 36、spill cleanup、force）；move/death 只删除 8 连通到外界的候选绿边，hit 以 tolerance 180 重键后按无坐标残绿 predicate 清理，snap 以 tolerance 200 重键；move/death/snap 分别做 `1774→1776`、`1774→1776`、`1703→1704` 的最小透明补列，hit 不补；然后执行 `cleanup_gate1_assets.py --alpha-threshold 248 --colors 31`。Death 最后一格再以全局无坐标 predicate 清除 98 个残绿像素，opaque bbox 不变，未增补或重绘主体；四板最终由 `build_enemy_boss_assets.py r17-action` 组装，fresh probe 与最终 sheet 字节相同。

#### Frame Gap 所选来源与处理

| Clip | Prompt id | Selected raw / SHA-256 | Selected keyed / SHA-256 |
|---|---|---|---|
| move | `move-attempt-01` | `gate-2/raw/r17-frame-gap-move-attempt-01.png` / `E8787ED72E5238EE5A06FB6F540759B69659A06FCEAB1E499E52896EDB439417` | `gate-2/keyed/r17-frame-gap-move.png` / `981C2354107DEB20F4A98773B317FD3EBB31E5ACEA3BC62CB6091B991CF79B16` |
| hit | `hit-attempt-01` | `gate-2/raw/r17-frame-gap-hit-attempt-01.png` / `296935EEAFB3587D58728D045824D6BF3AF7DA76E6692FD0A918570E066588FB` | `gate-2/keyed/r17-frame-gap-hit.png` / `568648706C2268BE8238F0AFEE279D4CFD10F49CD89C999D46C37F7C86C51E3E` |
| death | `death-attempt-01` | `gate-2/raw/r17-frame-gap-death-attempt-01.png` / `2AF22C7E11AB6C59E78F87D5444375F0DC691E3FB1AAE46007411FBAFBEA8C07` | `gate-2/keyed/r17-frame-gap-death.png` / `277556AC69DFD2D365E94513C538FFD1238CB743C1ED10566E1705D52026534C` |
| role | `role-attempt-01` | `gate-2/raw/r17-frame-gap-role-attempt-01.png` / `191734E34E931725F7870CB89A7F0A273FB2A2F0CFD232286E00C59B0C72524F` | `gate-2/keyed/r17-frame-gap-role.png` / `DFC0DF99E7CB0D427EE9D4DA56F456E887954CC775E070E8C120EA2676E56F62` |

Frame Gap 四个 clip 各只有一次 ImageGen 调用，没有被拒 ImageGen attempt。命名中间文件证明 chroma→fringe→grid/debris→selected keyed 的处理顺序，且 reviewer 逐像素复建最终 22 帧与稳定候选一致；但特定 grid/fringe/debris 清理脚本或逐字命令没有落盘，故完整前处理可复现性明确为 `UNKNOWN`。`gate-2/normalized/r17-frame-gap-action-sheet-prefringe.png` 的当前文件实测 SHA-256 为 `7DA0A6036B61577CEAF3EBB70E2BC28254A2A2A8AEA1A5414C45852DF6F9D549`；它只是被最终 fringe-clean 取代的处理中间输出，不是第二次 ImageGen attempt，也未选用。

### Rift Skimmer 被拒 ImageGen attempts

下表每个 attempt 的实际 raw 路径为 `gate-2/raw/r17-rift-skimmer-<attempt>.png`；所列 SHA 均与当次 generated-original 字节核对一致。所选四次已在上方登记，不重复列入淘汰表。

| Attempt | Raw SHA-256 | Rejection reason |
|---|---|---|
| `move-attempt-01` | `9660FD69FB68917BD46B167315C56C3014D3D806FFA99779AAED88340230D1BB` | cleanup/build：cell 1 主体触及 frame edge |
| `move-attempt-02` | `70AFEDC9B4FC5C93713924F10135CB8373405B68AB9DB35304FCF39244AEBB1D` | `1774×887` 宽度不能整除 6 cells |
| `death-attempt-01` | `CC5CE2CD00B2685FE672467CF28087A9477EF63B1E68E743087F7FEDD2FB0ED5` | 后段全局缩小，并有内部绿条/绿孔 |
| `death-attempt-02` | `4DB0D7BEE6782694FEF9A71C8A32411B253F9E0138CE67B05BE7A26539A8CFDA` | builder：cell 0 主体触边 |
| `death-attempt-03` | `871A95A3AC0E4BA564980790E39B87DA8C9CD9DCF69BB49707DBCDB3456E0FCF` | 视觉动作可用，但 builder 仍报 cell 0 主体触边 |
| `death-attempt-04` | `7EF11D9D5DF342C8EE09A01F0B575D613E269E0725E28E562B079331F91E20AB` | builder：cell 0 主体触边 |
| `death-attempt-05` | `1A17590DC37B84CD0553FD1D0BC172CAE658E34EB54E4E385790B321CE66410D` | 前四姿势跨数学 cell 边界 |
| `death-attempt-06` | `DA043321757900078BA06BBB2C7A0BB9CEA832B1A531E31C571FDF31BAFF44AA` | 尺寸虽小但整体向内聚集，前三格仍跨边界 |
| `death-attempt-07` | `F324421038E9199C8217E60561EDD3576E69DF9CB5A291C5686B6C51E1FB4FBA` | frames 4–5 出现内部绿孔 |
| `death-attempt-08` | `75202E161E791B9D360A9C752F71C8C9BDE4C9566509E4FC5C2D81B4076132C2` | 内部绿色侵入仍在，早期姿势过宽 |
| `death-attempt-09` | `C8800E1935B0F78C6636307A29D0C4F0781402B7C812ADAD6D67F0582D558D77` | 死亡动作太弱，主要读作尾部变短而非头/rail/组织崩塌 |
| `death-attempt-10` | `CE0684529AFB177E7811B58B41AFCD899214331F5CDEFE7BC0CF0A49A2AD92AE` | cells 1–3 合法主体像素触及数学边界 |
| `death-attempt-11` | `836952561C66BD63B322874344957E55D15BF68DDAF916D07E28DB9E1B83608B` | cyan 熄灭语义可用，但 cells 0–2 alpha bbox 触边 |
| `death-attempt-12` | `655A15D22A3D815844C29217CC0C915902920703C6AAFA9249863CF91DE81EA0` | 网格与 cyan 序列改善，但卷尾形成封闭绿孔 |
| `death-attempt-14` | `BA84CDB15029B85527F86A886A82BB37463129E09ED60C329B5B1337C0064876` | stop 到达前已在 flight；attempt 13 已过合同，14 反而弱化崩塌/footprint 进程 |
| `pierce-attempt-01` | `BED21221C8B6A1C695052916823E6202476FF17D4E698043702D2E25B02AE8DF` | frame 3 变成长细 spear/trail，并有内部绿色 |
| `pierce-attempt-02` | `B83DB8C504B50B2948D4A23EF5C2B4DA8CB196E4DA311F2A4BA430BDF29019AA` | 第三姿势读作右侧尾刺，与左/front cyan aperture 冲突 |
| `pierce-attempt-03` | `9A90C414C16CCDB9F165C2CE1906DAC03FFE86307FCFEBE4E00E27CF3397D86D` | 攻击方向已改正，但第一姿势右尾触数学 cell 边界 |

### Bud 被拒与未选 ImageGen attempts

下表 Prompt SHA 是账本中 UTF-8 逐字 payload 的 SHA-256；Raw SHA 与 generated-original 一一相同。实际 raw 路径遵循 `gate-2/raw/r17-bud-<clip>-attempt-<NN>.png`。所选四次已在上方登记；`death-09` 是停止后的保留输出，未进入 key/build，故标为 unselected 而非 rejected。

| Attempt | Prompt SHA-256 | Raw SHA-256 | Disposition / reason |
|---|---|---|---|
| `move-01` | `A54894A32041944C7302B67A7ADE190E36A66F5DEEDFB253E25FE4B9B8B7798E` | `B1D123FD0A471CC7FAD0A379361CDCD77691A529B8FC62CFBCAB3ACF6F16F697` | rejected：旧处理为通过 1px 门禁删除合法 steel tag，frames 0/2 钢件不可读；lineage 禁用 |
| `move-02` | `CB4B3F5258C07787D94F98245BDC8DBA8FDB64AAF95C21F79D0765EF5968A59F` | `CC3148B9A6DAEEBC2D31DE63DC98CC0109E0007D77087E259F30EB1F66E372EF` | rejected：钢件膨胀成多重/双环，身份材料失真 |
| `move-03` | `CB5C2A53673B10638E3466125C4B1D731567EB77DAB50D51310FBBADB1403F6A` | `92EB2586BA49F14E7B518F37CFE15A53FBD72B257D0C7D00C1C267C84A76141A` | rejected：身份较好，但 builder 报 normalized cell 1 主体触边 |
| `move-04` | `02E87D0ED87F9F6A4C69664EEDF2B9BA74F8BFBCA384741228CC0ECA0D3CA1A4` | `B9382A99645D25C818171824DD6240FE6EBDF40222FFDD4DAF6AA5961CD0DBE8` | rejected：出现第二 cyan/teal 点，且 normalized cell 0 有 singleton |
| `move-05` | `89B2DA9092F0C3726F4692CFDB4CBE6CF8F46C9AF064C7D476619D9A5542C1D3` | `0E2456D38E2114346B6278D1AAE137E58B9A4F8FAC5A652935E1603900610246` | rejected：detached steel highlight；normalized cell 0 singleton |
| `move-06` | `193F72818947976D623C4CBC45CD73AB670CC5E15D03B386D53F69878BB8E9FB` | `06324D0D9C03AE91E48F58A2D66D5924900E066D915AE3889DE71FCD054FA61C` | rejected：normalized cell 4 主体触边 |
| `move-07` | `5C94CF1ACA1FD12A0A0589713563C5E8F1CDCB310F8303E19511311AE6274D7E` | `FB00C0BB828CF02B1476E3E92F9E86086637D7C0E4CEFBE60FA572F20CDF40A0` | rejected：normalized cell 1 有 isolated single-pixel component |
| `move-08` | `8573CA2E37E2C192CCE624C57B5ED678F8250BF0DA5706E51061C73C14C11572` | `114414DD8B6D2AE7753BE22202360371CFE990FDA86FB998494B93E3F76AD4EB` | rejected：steel tag 读成双环/8 字硬件 |
| `move-09` | `B5ED423180A9ACE9F09154892F6AF6985159098D4BA703C422BD45A63AF644A8` | `4833C4691114AE3C6F5B9FA73B33D9E66633828270D845149562BF2EE0EC2AE8` | rejected：动作弱、washer 过大；32px steel 塌为零散点并有分离暗块，不做 debris salvage |
| `move-10` | `3DFD9636108260F53588EB2C6681094965C664B9602151E02DBB5B5791618E60` | `123A549E8EC8357B79E30C8F8E848662E5D02262E7DD93DF275FAE5092A9CD14` | rejected：steel 仅成小亮点；singleton 含合法 steel/深红像素，不删除主体过门禁 |
| `move-11` | `AF0B57333E3D78AF7BF3E04DB46CB40C99AACF0A6171B7ADD3DE52AC55369045` | `B7F21B8AE8E6575B7A1EC759395601B19764CB07C789B005366BFF02C8C23859` | rejected：normalized cell 1 singleton 涉及 cyan，不能按背景碎屑删 |
| `move-12` | `0EDB908308BBFA9B5ABAF6DC52F716C3E940BC6684C9D9BCEDBCBF03B742ADAB` | `3E1C8187F8479D94C1555FB106E8D588AF3B41E4CDB140DF760DBB4B63B6F03D` | rejected：尾部跨逻辑 cell 边界，39–47px 连通触边不是 debris |
| `move-13` | `A3947E567BFFEE506720A610BEC0A952E34DEF4754F44B8C6EEE50A35E5F9E9D` | `3A603B61860CBB53C67C1CA4AA45679339727FB7D11D7A0EB7AA3023DE8BF2AD` | rejected：center/baseline 不稳；frame 1 baseline 29，其余 30 |
| `move-14` | `E9A55F0F5C943C8078374DA8B529279638B8B4834240E58823D24F62D401DF4D` | `E30E389B6F1C8AC1DBE54743372073549C0F6E3F35F916B95A6F7EFF7CCBC4F6` | rejected：尾端形成平底脚/吸盘/平台，不像漂浮 comma swim |
| `hit-01` | `10982A3485F27127791899ECE9F517B4DD719FE66800347DB5F09EC45AC695B4` | `23AC47FDE87227797C1100F03684B1F1A8387D2C834F39DF667AF44265D19415` | rejected：不是 exact 2 cells，视觉产生 8 格 |
| `hit-02` | `1E22DA3236BEE06D436488237BEBB18AC011E0E884DD6ECDE74DDD80369FFE7E` | `6ED867A85C1717A697A5A8A16B8D5B4B84C6A6587C516A02E3965A0E12BF96A1` | rejected：出现 debris/impact marks，姿势与锚点不稳 |
| `hit-03` | `B681CF8D87B65473A7921EE0EDD747C911D8DC367AFCB6EC269869D5B4625566` | `B6A1E4C98C9DB76B2EA69A8730B26074A961A0C43E33BBBDE619C6F6BC29A596` | rejected：旧候选为对齐 baseline 人工补入 frame 6 `(13,30)` 主体像素；lineage 禁用 |
| `death-01` | `96E903B36A8D30732BF70174A8D044D7D808C889B0CA905722BC657D639D52DE` | `42842396D2BE27C7EA829632A39B27DC97FA436C681598612B3C8962DDF8BFAA` | rejected：过度结构化，core/硬件/整体缩放偏离芽体身份 |
| `death-02` | `744D81FD8FF9CC1418AAF1DE8BD599B2B576EABD9E79CF18C76D16A2D6887157` | `B3C97E53CCF052EBF82D67B4BE3AEA86EF776402CE4F516DECD6BE29691D2708` | rejected：身份、共享尺度、core 衰减与 steel 稳定性不足 |
| `death-03` | `0FB2E205FACD82FB7CD61494729F97ACFE04C69E10048237BD2D7A24F107CB4F` | `D751F4018119204D88D2A34FAFCA048A0F0FAE9968C277227EB45C10AD7B57D5` | rejected：身份、共享尺度、core 衰减与 steel 稳定性仍不足 |
| `death-04` | `B51A0C2C45D481581B4026F54D3411BDB330C9F2C2718CBBE9B21319B65FD155` | `3F0E422E0EE14388EAF95D5DAC56A51C96F04D82FDFD3577C556FA907A978FB6` | rejected：旧 final cyan `0→2→0→1→1→0`，熄灭后复亮 |
| `death-05` | `348ACBD0D8F4FFE1C1E74F042E381FD71D603A9535C18AED19088D0D5BB5E13A` | `1D452F3B7A0789EECF7D7B7404D9BEA698AB4B9F74FFB323DD9321F4FFB65854` | rejected：整体缩小、steel ring 沿尾迁移且 frame 3 core 过早消失 |
| `death-06` | `C5E14328B8C0A01AE0289D6EBCC9E0978774BAD07678D4666D467FF2D49CBCE7` | `C8C3AA1A1D279A1001E024D6FD34A484552294F895EFDF005519FBE5C9C8E0CE` | rejected：frame 3 baseline 29、其余 30；不补主体像素修门禁 |
| `death-07` | `F0A8A2839E081FE8A5DB758CC7A75AB8A517E438E78CDE3CE183F886DC8BF111` | `165C730CD1A7286684A598B0281C92A2C547538F07A50E2A8D4141A5AB594F1D` | rejected：虽 builder PASS，但轮廓/尾部近乎不变，死亡读成 recolor/idle |
| `death-09` | `F459690BCD02FAA9912AB1B55A1F6B2CFE19E929318C7D4C565B6AC0924AA27C` | `E0654E688915259A05C8092D94DF98A184DE5AA974BECBA232145E5C321DA488` | unselected：Death08 已满足无 relight 合同；只保留 raw，未 key/build |
| `snap-01` | `A367332AB38D514E73E5BF60E8FB8907C9EE16B0C6F2310A2082B244B4B13E47` | `1A5143ED69F48BBA381D8F8C5B4417557B1B960A566A5C821E1F7DCC595133DA` | rejected：大 bite/tongue 改变身份，steel ring 读到尾端 |
| `snap-02` | `F5CE052159A6BD50FAE6DB32257A7A49560D06777FA86173143B1DDCB79295CC` | `5778E6A5CF7517037AEDD8B1EF1BB8047C2C60A769F817D151DE728A396FDB39` | rejected：额外 forked tongue/projection，并有 cyan 重复风险 |

### Gate 5 final admission reconciliation — Gate 2 sheets

The historical rows above retain their original Gate 2 state and complete lineage. The following final governance rows are authoritative after the owner accepted Gates 1–4; legacy R-17 PNGs remain fallback assets and were neither replaced nor deleted.

| Asset | Accepted source SHA-256 | Accepted final SHA-256 | Rejected candidates | Admission |
|---|---|---|---|---|
| r17-rift-skimmer-action-sheet | `789A41F703E537A9556931C66DB4C39936DE52429F4D7DFF41DD28CE66908C29` | `7B944216E4B78EAACB1A36D8AE023AC03C343E5FBDA523E56FC4EC226065E304` | Complete raw/keyed and rejected chain retained in the historical row and `gate-2/logs/r17-rift-skimmer-prompt-ledger.md` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |
| r17-bud-action-sheet | `DF1DC4BC4FE54A7EF2A0B010F5AB7A77B9A1B69B81F1D23208DB80878BA1E8C9` | `22FF646CE9EE1DDC1B67305C95E5D4FA9C6C862A494976598AC87025E0FA99E6` | Complete raw/keyed and rejected chain retained in the historical row and `gate-2/logs/r17-bud-prompt-ledger.md` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |
| r17-frame-gap-action-sheet | `E9D209902B2291B8996FE8CB071F6AAA0B2FE52376064D42CDEEBED661471F56` | `FF72566E4C612EE6292E6135B0F06F2E7D12AA53FE0219F82B6304AB41BCF9C5` | Complete raw/keyed and rejected chain retained in the historical row and `gate-2/logs/static-source-audit-rift-frame-gap.md` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |

### P74 R-17 Gate 2 common animation-board prompt

以下段落逐字位于本轮每个所选 prompt 的开头；P75–P77 仍复制完整 prompt，不依赖读者自行拼接。每次调用仅使用对应 Gate 1 accepted silhouette 作为唯一 `referenced_image_paths` 输入。

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.
```

### P75 Rift Skimmer Gate 2 selected exact prompts

Rift ledger 保存全部 22 次调用的逐字 prompt、generated-original/raw 路径、hash 与 disposition：`gate-2/logs/r17-rift-skimmer-prompt-ledger.md`，SHA-256 `942DAD4CE1772077DD07A2FA171D8FC7E32BD0614535C8AA3260CCE08A70C8D3`。下列四段是最终所选调用的完整逐字 prompt。

#### move-attempt-03 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

Requested cell count: exactly 6 equal-width cells. A fast low skimming cycle: wide head leads, dorsal steel rail stabilizes, sharp tail flexes with readable horizontal thrust; the body never becomes a thin line.

Correction constraints: output an exact 1800×900 horizontal canvas organized as six invisible 300×900 cells. Every pose must remain wholly inside its own cell with at least 15 percent flat #00FF00 safety margin on every side; no pose or pixel may touch or cross a cell boundary. Use fully opaque hard-edged subject pixels against a fully opaque perfectly flat #00FF00 background, with no transparency, no semi-transparent pixels and no transitional green fringe.
```

#### hit-attempt-01 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

Requested cell count: exactly 2 equal-width cells. A very short non-stagger hit reaction: the front aperture compresses and the shell recoils one pixel-equivalent, then remains ready to move.
```

#### death-attempt-13 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

Requested cell count: exactly 6 equal-width cells. A committed display-only collapse: neural aperture fails, wide head buckles, rail releases, dark tissue folds inward into a clear inert remnant; no gore and no global shrink.

Correction constraints: the creature faces LEFT and the cyan neural aperture is at the LEFT/front. Frames 1-2: cyan aperture flickers and compresses. Frames 3-4: it visibly dims. Frames 5-6: it is fully extinguished and dark with zero cyan. The left/front wide head buckles, steel dorsal rail releases and folds, and dark tissue folds inward into an inert remnant. The right tail folds as a SOLID compact dark wedge pressed flat beneath and against the main body in every frame. Never draw the tail as a loop, ring, U-shape, horseshoe or separated curl; it must create no enclosed hole and show no background through it. No global shrink: all six chunky wide bodies share one scale and roughly constant footprint. Use exactly six equal mathematical cells across the entire canvas. Center one subject in each cell, with the same broad uninterrupted green gutters and clean spacing at every 1/6 boundary; no pose pixel touches or crosses a boundary. Place first pose in the far-left cell and sixth in the far-right cell. No green holes, internal green light, green cracks or green materials anywhere inside a pose. Every region inside the silhouette is filled by dark body, steel, wine-red tissue, or the allowed cyan aperture state. Use fully opaque hard-edged subject pixels.
```

#### pierce-attempt-04 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

Requested cell count: exactly 4 equal-width cells. A successful-contact pierce: wide head compresses, cyan aperture narrows, sharp nose thrusts once, then settles without moving the board position.

Direction and sizing correction: the creature faces LEFT and the cyan neural aperture is the LEFT/front in all four cells. Cell 1 ready; cell 2 compresses the LEFT/front head and narrows cyan; cell 3 makes one short compact LEFTWARD nose thrust immediately around cyan; cell 4 settles. The RIGHT tail braces as a short solid wedge pressed tightly against the body and never extends toward the next cell; it is never the attack spike. Render every complete pose uniformly at only 80 percent of the previous board's sprite size, while keeping one identical shared scale, chunky wide proportions and a stable footprint. Use exactly four equal mathematical cells across the entire canvas, one centered pose per cell, with very broad uninterrupted flat-green gutters at every quarter boundary. Keep at least 15 percent of each cell width transparent green at both left and right around every pose; no pose pixel touches or crosses a boundary. No part thrusts right; no thin line, long spear, beam, filament, stretched tail, trail, green hole or internal green light. Use fully opaque hard-edged subject pixels.
```

### P76 Bud Gate 2 selected exact prompts

Bud ledger 保存全部 31 次调用的逐字 prompt、UTF-8 payload SHA、generated-original/raw 路径、hash 与 disposition：`gate-2/logs/r17-bud-prompt-ledger.md`，SHA-256 `8E53AA469BEF682DEE19743D2EEEDA9F86CD1646723FEBB79140FE37119C0F7A`。下列四段是最终所选调用的完整逐字 prompt。

#### move-15 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

A high-frequency comma-shaped swim: the single tail filament whips through a native six-pose cycle while the head and tag ring stay readable.

exactly 6 cells; closed steel tag ring at head-tail junction must be chunky and continuously attached/readable in every final 32x32 frame, survive nearest reduction as at least a multi-pixel closed loop/component, never become isolated 1px dots; one tail only; no debris.

The steel tag is one simple small circular O-ring or washer with exactly one visible transparent hole. Organic tissue at the head-tail junction directly touches its outside rim; no separate mount, link, second hole, chain, clamp, or extra steel. At final 32x32 scale the rim is at least two pixels thick, one 4-connected closed component, and readable in all six poses. No isolated steel highlight or floating metal.

Exactly one cyan core total per pose. Place it deeply embedded inside a solid filled head, fully surrounded by continuous opaque charcoal tissue. No transparent gap, hollow, cutout, second cyan glint, or reflection.

Use six exact equal logical cells. Pose centers are precisely at 8.33%, 25%, 41.67%, 58.33%, 75%, and 91.67% of canvas width. Keep each complete pose within the middle 45% of its logical cell and at least 25% cell width of pure #00FF00 margin on both sides. No part may approach or cross an invisible cell boundary.

Keep the head, cyan core, washer, junction, shared body scale, and lowest floating y-coordinate stable in all six cells. Motion is compact lateral tail deformation only: small left bend, small right bend, tight left curl, tight right curl, shallow S-bend, and straight recovery. No long horizontal sweep. Every tail tip reaches precisely the same lowest floating baseline while remaining organic and suspended.

At final 32x32 scale, each tail ends in a compact rounded or diagonally rounded cap: its lowest opaque row contains 2 or 3 connected tail pixels, and the cap remains at least 2 opaque rows deep, continuously attached to a tail at least 2 pixels thick. The cap must look like the natural end of one soft filament, never a flat foot, shoe, base, platform, pedestal, stand, suction cup, horizontal bar, bulb, or separate blob. No diagonal-only or one-pixel tail tip.

Use simplified solid coarse pixel clusters and thick filled shapes. The entire non-green subject in every pose is one single 4-connected opaque component. Head and neck are solid filled masses without transparent internal gaps except the washer's one hole. No separate black outline, exterior border fragment, detached pixel, micro-detail, tiny speck, floating highlight, or particle.
```

#### hit-04 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.
A tiny but readable hit recoil: head curls away and tag ring jolts; do not turn it into a round blob.
exactly 2 cells; the head performs a short, tight curl-back recoil, but the single tail tip keeps the same continuous anchor point and the same vertical extent in both frames; a chunky closed steel tag ring remains continuously readable in both final 32x32 frames; both poses naturally share the same baseline and center after nearest-neighbor reduction without any subject-pixel additions or deletions; no detached marks. Exactly one tail and one closed steel ring per pose; no debris, impact lines, extra objects, extra rings, spikes, limbs, or projections.
```

#### death-08 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

The bud loses tail tension, head curls shut, cyan bud core extinguishes and the tag ring settles into an inert comma remnant; no gore and no global shrink.

exactly 6 cells; cyan core must monotonically dim with NO relight: frames1 bright, frame2 dimmer, frame3 faint, frames4-6 completely dark/no cyan pixels; chunky closed tag ring remains readable and settles; tail loses tension, comma remnant, no shrink/debris.

Maintain one shared body scale and nearly identical head-body footprint in all six cells: no progressive shrink, no smaller icon, no disappearance. The cyan core is the only cyan material and must be visibly present in exactly frames 1, 2, and 3 with strictly decreasing pixel area and brightness, then absolutely absent in frames 4, 5, and 6. No cyan reflection, second glint, teal steel, or relight. When the core is dark, replace it with solid charcoal tissue only: no eye, eyelid, mouth, face, horizontal black slit, seam, or facial expression.

Exactly one chunky steel tag ring total per pose, fixed at and continuously attached to the same head-tail junction. Its functional steel segment remains continuous, stable, distinct from the cyan core and dark organic body, and readable in every final 32x32 frame while it settles slightly. No tail-tip ring, second ring, chain, extra hardware, detached steel highlight, or floating metal.

Use six exact equal logical cells. Pose centers are precisely at 8.33%, 25%, 41.67%, 58.33%, 75%, and 91.67% of canvas width. Keep each complete pose within the middle 48% of its cell with at least 23% cell width of pure #00FF00 margin on both sides. No part approaches or crosses an invisible cell boundary.

Make the six final 32x32 silhouettes clearly and progressively different, especially the one tail. Frame 1 has a taut narrow S-tail. Frame 2 loosens into a wider shallow S. Frame 3 bends into a lower open C. Frame 4 droops into a hooked J. Frame 5 folds into a heavy low comma. Frame 6 settles into an inert compact comma curl. These are one continuous tail losing tension, not six translations. Each adjacent silhouette change must be easily visible at native 32x32 size, including frames 4-6; do not repeat an idle tail or rely on recoloring.

Preserve the same head size, total body height, central axis, and lowest floating y-coordinate while the tail changes laterally and curls. No global shrink. At final 32x32 scale, the entire non-green subject in every pose is one single 4-connected opaque component. The tail remains at least 2 pixels thick and ends in a compact rounded or diagonally rounded cap whose lowest row has 2 or 3 connected opaque pixels and is at least 2 rows deep. Keep that organic tail end at the same lowest floating baseline in all six poses. Never form a flat foot, base, platform, pedestal, suction cup, horizontal bar, detached blob, diagonal-only pixel, or one-pixel tail tip.

Use simplified solid coarse pixel clusters and thick filled shapes. Head and neck are solid filled masses without transparent internal gaps except the ring opening. No separate black outline, exterior contour fragment, detached pixel, micro-detail, speck, particle, debris, or gore.
```

#### snap-03 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.
A successful-contact snap: head opens, tail braces, head bites or lashes once, then closes; preserve the comma silhouette.
CRITICAL OUTPUT CONSTRAINT: exactly four equal-width cells and exactly four character poses total, one pose per cell. Use the bite interpretation only, not a lash. Preserve exactly one single tail filament, exactly one small cyan core, and exactly one small closed steel tag ring per pose. The ring stays fixed at the same head-tail junction as the reference. Frame 1 closed ready pose; frame 2 a narrow short head slit; frame 3 a compact closed-down bite with no projection beyond the original head envelope; frame 4 closed recovery. The tail only bends conservatively to brace. No tongue, spear, tentacle, teeth row, giant jaws, detached marks, particles, projectile, prey, target, extra material, extra cyan spot, extra ring, limbs, blades, prongs, global movement, or round blob.
```

### P77 Frame Gap Gate 2 selected exact prompts

四次调用均只使用 `gate-1/normalized/r17-frame-gap.png`，且全部入选，没有 correction suffix 或第二次 attempt。Producer final 记录每次实际 prompt 是 P74 共同段落、一个空行、再加对应 motion text；下列为四段完整逐字文本。API 外层封装/换行及逐次 prompt payload SHA 未单独落盘，因此该元数据为 `UNKNOWN`，不补推断值。

#### move-attempt-01 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

Three to five large disconnected masses orbit asymmetrically around one vertical empty gap with coherent forward drift; never form a uniform ring.
```

#### hit-attempt-01 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

A short spatial hit reaction: the central gap pinches and two masses offset, while the calibration clamp remains visible.
```

#### death-attempt-01 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

The phase relationship fails: large masses lose alignment and fold toward an inert broken gap, with no particle-only disappearance and no gore.
```

#### role-attempt-01 selected

```text
Preserve this exact approved character identity, silhouette proportions, dark blue-black/charcoal body, sparse dark wine-red tissue cracks, one small cyan anomaly focus, one steel functional material, hard upper-left pixel light, limited palette and orthographic top-down game-sprite perspective. Produce a single horizontal pixel-art animation board with the exact requested number of equal-width cells, one centered pose per cell, a perfectly flat #00FF00 chroma background, no dividers, no text, no labels, no floor, no shadow, no camera movement, no anti-aliasing and generous outer margin. Keep a single shared scale and a stable contact/floating baseline across every cell. Motion must be native silhouette deformation and material movement, not translation, rotation, recoloring, global scaling or particle noise.

Frames 1 to 4 are a missing-frame disappearance: outer masses drop out in large readable chunks while the cyan spatial gap and steel clamp hold the last stable reference. Frames 5 to 8 reconstruct into immediate forward dash: large masses re-lock around the gap, then elongate once along the committed dash without changing world position in the board.
```

## R-17 普通敌人 Gate 3 动作表（Gate 5 production admission）

本节登记 Drifter、Pulse Sac、Carapace Gate 与 Brood Mass 四张锁定 Gate 3 动作表。项目所有者已接受 Gates 1–4，Gate 5 将这四张与其余五张 final 原子加入 production；它们保留所有 source/final hash、处理链和拒绝候选，且不改变七张 legacy R-17 fallback 或静态 SCP-049 fallback 的身份、路径和可解析性。production admission 不等同于商业发布；许可证复核与既有署名义务继续适用。

外部证据根目录为 `C:\scp-survivor-workspaces\evidence\enemy-scp049-visual-overhaul`；下文 `gate-1/...`、`gate-3/...` 均相对于该目录。每次内置 `image_gen` 调用只使用对应 Gate 1 accepted reference 作为唯一图像输入；没有用户截图、SCP Wiki 图片、素材包或其它第三方图像输入。模型名未由工具暴露，故不推断。

Carapace Gate 旧 sheet `947C7C829FA978376A7ECDE34A9B19E197B740F9A952D8A174DF993DE988FCFF` 是已结案的 rejected 历史：其 brace/charge 因组织占比、steel 连续性与三角假前脸而未通过独立静态审查，已以 `rejected-947c` 后缀保留，不是当前 pending 或 final。当前登记的 Carapace Gate 是 attempt08 确定性 remediation 后的新 final `4775A31F1341D245725FA569DA28FB38476024C5DE6205CB323F91CF0694C776`；attempts 15–18 也均为 rejected 历史。

| Asset | Type | Path | Tool/model | Date | Source / SHA-256 | Human edits / deterministic processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| r17-drifter-action-sheet | spritesheet PNG | `assets/art/enemies/r17-drifter-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + deterministic evidence processors + `build_enemy_boss_assets.py` | 2026-08-26 | 唯一图像输入 `gate-1/normalized/r17-drifter.png`，SHA-256 `2783916CF336FA3AE0F0C40FCEDEA6C707B0EA5644E2F54CE85A5F3E3B6B14C0`；evidence final `gate-3/normalized/r17-drifter-action-sheet.png` 与本表 public 路径逐字节相同，SHA-256 均为 `9F9F07490834273BC742BDDCA319FE9FC0529E8993987534505EB8CF449152FD`；共同提示 [P74](#p74-r-17-gate-2-common-animation-board-prompt)，所选精确 tail/correction [P78](#p78-drifter-gate-3-selected-exact-prompt-tails)；ledger `gate-3/logs/r17-drifter-prompt-ledger.md`，SHA-256 `F6676F061651012F577D83482D532D06156C10579247E806E456201DD85F5021`；producer review `gate-3/review/r17-drifter-producer-review.md`，SHA-256 `846F48E7EC11E92460409B002923997C67CDB6E86D918AC630348B999E768CFA` | 所选 raw 先做 `#00FF00` tolerance 36 hard key + spill cleanup，再做 binary alpha、broad green rejection、clip-global MAXCOVERAGE 32 色与最小断开噪点审计；最后以无坐标 `g>=40 && g-r>=12 && g-b>=12` predicate 把非 cyan 暗绿/olive 确定性映射为 blue-black。alpha、几何、帧序和非匹配 RGB 不变；含 815 个 olive 像素的前版 `EAAF29C9...` 已拒绝并保留 | 项目定制生成；唯一图像输入为项目 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；未做 production 或商业准入 | Gate 3 review candidate; dev-only, not production-admitted | 864×48（18×48×48；move 0–5、hit 6–7、death 8–13、contact 14–17；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |
| r17-pulse-sac-action-sheet | spritesheet PNG | `assets/art/enemies/r17-pulse-sac-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + deterministic evidence processors + `build_enemy_boss_assets.py` | 2026-08-26 | 唯一图像输入 `gate-1/normalized/r17-pulse-sac.png`，SHA-256 `4C67ACF78365C823B4A95C6971D0F8B001DA88E003FD87D71A18CEAE6154748D`；evidence final `gate-3/normalized/r17-pulse-sac-action-sheet.png` 与本表 public 路径逐字节相同，SHA-256 均为 `5544920457DCE1B8EF0DEC09103A5568B7707294D97FC266E9ADCCD2125D516D`；共同提示 [P74](#p74-r-17-gate-2-common-animation-board-prompt)，所选精确 tail/correction [P79](#p79-pulse-sac-gate-3-selected-exact-prompt-tails)；ledger `gate-3/logs/r17-pulse-sac-prompt-ledger.md`，SHA-256 `DB9CE5AC958E4F02D8F65E7C20AA33C6D9653A87EEBECE02961E6D54A8B3410B`；producer review `gate-3/review/r17-pulse-sac-producer-review.md`，SHA-256 `025A9CBA893BCC3DC6281AD629DF1C4A7D8A4A2425DB3D15B3F61D7717F2A6D6` | RGB selected board 用 tolerance 64 hard key；透明 move board 用完整 tolerance 36 + `--spill-cleanup` 路径并在 shared processor 以 alpha 224 gate；随后做 broad green rejection、clip-global 32 色和断开噪点清理。最终 palette remediation 清除非 cyan olive，并从 death local frame 3 起确定性熄灭饱和 cyan/teal；alpha、几何与帧序不变。含 708 个 olive 像素且 death relight `[20,1,0,0,5,1]` 的前版 `0BA3C9C5...` 已拒绝并保留 | 项目定制生成；唯一图像输入为项目 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；未做 production 或商业准入 | Gate 3 review candidate; dev-only, not production-admitted | 960×48（20×48×48；move 0–5、hit 6–7、death 8–13、shoot 14–19；release 为 global frame 18；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |
| r17-carapace-gate-action-sheet | spritesheet PNG | `assets/art/enemies/r17-carapace-gate-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + deterministic evidence processors + `build_enemy_boss_assets.py` | 2026-08-27 | 唯一图像输入 `gate-1/normalized/r17-carapace-gate.png`，SHA-256 `7A2909CE91036C399063F411728D14BD7798097A5D2EC7413B11612BE44C9346`；selected lineage/remediation contract [P81](#p81-carapace-gate-gate-3-selected-lineage-and-remediation-contract)；ledger `gate-3/logs/r17-carapace-gate-prompt-ledger.md` SHA-256 `FF7D33C5D8C1FEBA2F66119BF7E9FED78E4173EDF32D2EA591758B6FD121934F`；producer review `gate-3/review/r17-carapace-gate-producer-review.md` SHA-256 `503442E4AB26B3644893EF5B1AEB29BB6C677963A86FC5E44FB1EC64EDF9678B`；independent review `gate-3/review/r17-carapace-gate-independent-review.md` SHA-256 `64199FAD804F90A1DEDEE12CC3BAE5FAA2225565D88C1E1EBDE23C0D780724A3`；evidence final `gate-3/normalized/r17-carapace-gate-action-sheet.png` 与本表 public 路径逐字节相同，SHA-256 均为 `4775A31F1341D245725FA569DA28FB38476024C5DE6205CB323F91CF0694C776` | move/hit/death 字节冻结，只替换 role8；selected attempt08 raw 与 generated original SHA-256 均为 `9E95984C17C989F6154637F75CA318F55EEFC22ACEFCDA6D6BF664263A635C93`，逐字 exact generation prompt 因 producer 中断未持久化，精确记为 `UNKNOWN — not persisted before interruption`，禁止推断。pre-remediation SHA-256 `74BD93E404014BF0C7CFDBF4809B86E3B054EFE13EDEB557E70AE22AA740AFE0`；deterministic cleanup 只改 4720 个 steel RGB 与 frame 2 的 4px cyan 碎簇，alpha、轮廓、几何和帧序不变，final role SHA-256 `A63F32925BC172EC7987876C25B06B4051F477DE802C96E1469A9A208D14023E`。remediator `FD61A715EDEDDFB006A73B9388F872A649F4FF12727C0E473BF7F955D2578B40`；focused test `BC8BD13FFA290881602D7AA3DF2D0365956B2964F48864AF94CC3A3D11645A8E`；role audit `C1C1B18BD2A57DB85ADB6F19B2C804D5CF564D435A2000BC3B1C00B62C0407BA`。唯一有界容差是 charge 首格 area `913` 相对建议下限 `921` 低 `0.87%`；无第二项容差 | 项目定制生成；唯一图像输入为项目 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；未做 production 或商业准入 | Gate 3 review candidate; dev-only, not production-admitted | 1408×64（22×64×64；move 0–5、hit 6–7、death 8–13、brace 14–17、charge 18–21；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |
| r17-brood-mass-action-sheet | spritesheet PNG | `assets/art/enemies/r17-brood-mass-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + deterministic evidence processors + `build_enemy_boss_assets.py` | 2026-08-26 | 唯一图像输入 `gate-1/normalized/r17-brood-mass.png`，SHA-256 `E3EC5B05A47AD4960B151A11196B5C87568EF8B8271832AE1D485D1EEBD3E518`；evidence final `gate-3/normalized/r17-brood-mass-action-sheet.png` 与本表 public 路径逐字节相同，SHA-256 均为 `D86B730AB9AAE6C24769779EB9B6DB5EA436E0F70F1049D69D11D2F282F1FDB6`；共同提示 [P74](#p74-r-17-gate-2-common-animation-board-prompt)，所选精确 tail/correction [P80](#p80-brood-mass-gate-3-selected-exact-prompt-tails)；ledger `gate-3/logs/r17-brood-mass-prompt-ledger.md`，SHA-256 `6786AB06699161DBE5646FF6367CFA975A609B7DDF35F25B2E255AEDAC443431`；producer review `gate-3/review/r17-brood-mass-producer-review.md`，SHA-256 `C9852EEFED99277B4B7F3E63AC6A5592FC188DE544CF8A12108AD200BE047FED` | 所选 raw 做 tolerance 36 hard key、broad green removal、component repack 与 clip-global 32 色。Split-10 的 2×4 完整姿势按 row-major 搬到单行，零 resample、零重着色、opaque count `468512→468512`；最终 alpha-preserving despill 只把仍为 green-dominant 的 G 降至 `max(R,B)`，不增删或移动主体像素。最终 broad/olive/任何 green-dominant 均为 0 | 项目定制生成；唯一图像输入为项目 Gate 1 素材；无第三方图片输入；仓库分发与 SCP 衍生义务依 `LICENSE-MAP.md`，商业发布前复核 OpenAI 输出权利与项目许可 | 开发态候选；未做 production 或商业准入 | Gate 3 review candidate; dev-only, not production-admitted | 1408×64（22×64×64；move 0–5、hit 6–7、death 8–13、split 14–21；RGBA、二值 alpha） | 当前无第三方图像署名；商业发布前复核生成服务条款与项目许可 |

### Gate 5 final admission reconciliation — Gate 3 sheets

The historical rows above retain exact processing and rejected candidates. These final governance rows supersede their earlier dev-only admission text; all seven old R-17 sheets remain present and resolvable as fallbacks.

| Asset | Accepted source SHA-256 | Accepted final SHA-256 | Rejected candidates | Admission |
|---|---|---|---|---|
| r17-drifter-action-sheet | `2783916CF336FA3AE0F0C40FCEDEA6C707B0EA5644E2F54CE85A5F3E3B6B14C0` | `9F9F07490834273BC742BDDCA319FE9FC0529E8993987534505EB8CF449152FD` | Complete raw/keyed and rejected chain retained in the historical row and `gate-3/logs/r17-drifter-prompt-ledger.md` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |
| r17-pulse-sac-action-sheet | `4C67ACF78365C823B4A95C6971D0F8B001DA88E003FD87D71A18CEAE6154748D` | `5544920457DCE1B8EF0DEC09103A5568B7707294D97FC266E9ADCCD2125D516D` | Complete raw/keyed and rejected chain retained in the historical row and `gate-3/logs/r17-pulse-sac-prompt-ledger.md` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |
| r17-carapace-gate-action-sheet | `7A2909CE91036C399063F411728D14BD7798097A5D2EC7413B11612BE44C9346` | `4775A31F1341D245725FA569DA28FB38476024C5DE6205CB323F91CF0694C776` | Old sheet and attempts 15–18 remain explicitly rejected; attempt08 prompt remains `UNKNOWN` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |
| r17-brood-mass-action-sheet | `E3EC5B05A47AD4960B151A11196B5C87568EF8B8271832AE1D485D1EEBD3E518` | `D86B730AB9AAE6C24769779EB9B6DB5EA436E0F70F1049D69D11D2F282F1FDB6` | Complete raw/keyed and rejected chain retained in the historical row and `gate-3/logs/r17-brood-mass-prompt-ledger.md` | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |

### 处理器、所选/淘汰链与静态证据

- 共同 deterministic 基线：bundled `remove_chroma_key.py` SHA-256 `7E51236919203B61D07DDFFDC6E0B5F501A28661003F5851F26FFBB64BDEC1EA`；最终 shared `quantize_selected_board.py` SHA-256 `FE2DA4FC412E6744CE2300E2A27A5EA4DA959BD74D7794D9DFFCE79D97202926`；builder SHA-256 `4B92466A786F8543986307DE1D5556A21D6D86EC0FB4448EE01A340B610EB445`；contract SHA-256 `615F557915771A161FDC126AB7A377F511561FACF5CB07C8EEAA8E4468370670`。
- Drifter/Pulse palette helper `gate-3/logs/remediate_selected_palette.py` SHA-256 `C342804C87F21BE006172C1FA334B1CC823E41CFEE429A0F36CDBE759B545035`；其 3 项 focused tests 在当前 evidence 快照通过。Drifter 最终 18/18、Pulse 最终 20/20 均为单一 4-connected 主体，binary alpha、hidden RGB 0、两种 green predicate 均为 0；Pulse death saturated cyan/teal 为 `[20,1,0,0,0,0]`。
- Brood 的 `neutralize_green_dominance.py` SHA-256 `BB92D40C36AF2C65EDBE0F59BE6A1BA9E01253505E60BB8FD74B4E04BE7D6AC8`，Split row-major helper SHA-256 `5188B2EC364EAF4E20C3CFF7A1FE00E69B0770AD8BC8F007582319E5DEDD9C1B`。Brood 结论仅为 producer review 加 deterministic audit：22/22 单连通、binary alpha、每帧 ≤32 色、三种 green audit 均为 0；这里不称其为独立审查。
- Carapace 的当前 final 只把旧 sheet 的 role8 换成 attempt08 remediation 结果；move/hit/death 字节不变。remediator、focused test、role audit、producer review 与 independent review 的完整 hash 已在本节行和 [P81](#p81-carapace-gate-gate-3-selected-lineage-and-remediation-contract) 锁定；这里不把 `UNKNOWN` prompt 重构成任何文字，也不把独立静态推荐升级成项目所有者实机验收。
- Drifter review：`gate-3/review/r17-drifter-clips-gray-1x.png` SHA-256 `55BD9FC5EC8CDDD0208B2F03704568CC95E6C8D68F8196E55505DD2384A6ADB3`；8× SHA-256 `488047B2A58DE1F1DCF8995646DC8CF278C8C7757F1EB7970456FC0BCEAA9E88`。Pulse 4× review：`gate-3/review/r17-pulse-sac-action-sheet-4x.png` SHA-256 `4D172D30DD271966323686BDA5D3EC85572FF76B7BCE64EC9C9469C6198F4999`。Brood native contact 与 final 字节相同；4× `gate-3/contact/r17-brood-mass-action-sheet-4x.png` SHA-256 `77D1A864387399C3BA26E092CE068D04B507CF514B0E2EB1095B26224B0460CB`。
- Gate 3 当时的 evidence/public byte equality、builder/static PASS 与运行态审查记录的是当时 development-candidate 接线；Gate 5 reconciliation 已将四张纳入 production，当前权威状态见本节的 Gate 5 final admission rows。该历史证据仍只证明静态结构、像素与已登记的确定性合同，不改变商业发布与署名复核边界。

| Asset | Selected raw → final keyed | Rejected ImageGen attempts / superseded candidates |
|---|---|---|
| Drifter | move-01 `CEC6D23DCCA48B93E3A045EC968591A53E8EBF51197A9810C64CF71169C956C2` → `D43196A2231F2497D219197BE3182E12EFE30F6E9D6ED1FEEBF510F208E9854E`；hit-01 `0671B1021A0C3B7CD69422EFF39D7E95B4B56C45BF035188DE9C287544C2102E` → `7256B84941D3B6101088563E04DB820099438590394989B2288E0695707E1D7F`；death-04 `A5F30FC985A08EBB8AEBE5116DB80D05BF903752B5EABD0F5C4641F60E37DDCA` → `C8B028D6BDBF5351FB83252A2CA7F6AE5297A305DD366509E6E727F0E6FF2363`；contact-01 `D05AA688408545C8EDFB14C0703FF50700993255C72EEDB794504388620A59E1` → `529CBA773F0698CBDBDEAECC52C34202E27DF188FD510F44319928D214CB9751` | death-01/02/03；pre-shared、pre-broad 与含 815 olive px 的 pre-palette candidate 均按 suffix 保留 |
| Pulse Sac | move-01 `5B60DE7335CDF141B33845B05C55E62705C61EC70F7E3952AA6580B60C5ADC2A` → `8537C2D55FAD1A62CFFA9F96C2DEE3A9A0C2F4E9BC890BD3528BD1E1915C325B`；hit-03 `7FBF21FE55C44429EE70D7EA137D3DFDE7565C7BC995585AB22B77295EE62E42` → `F5623F5A60D387A2EE9F9D3A67C0B298D1B4DF5FE6AB5FA715441B2C8212F76D`；death-02 `65A25548CE653A1E87DCC5C9D384AAF5F8AB13F3F15BDD4BB93E5CF8FB6CD600` → `7F0EB5044FED21B3F4D794794C1FA6DB2EB9CBD6F5C55188A7A8AAE57AB89E98`；shoot-01 `6ADDC60EB8B3D782E6A497A80E367B6A26693111A26D5AA75BBEE5A9B660E3EA` → `65BBAC6EE8F2F10DEF3BEC2FF4F42642B8E9E030F9ABA3FADFCBDE61D427E412` | hit-01/02、death-01；含 olive 与 late death relight 的 pre-palette candidate 按 suffix 保留 |
| Carapace Gate | move/hit/death 延续冻结字节；role attempt08 raw/original `9E95984C17C989F6154637F75CA318F55EEFC22ACEFCDA6D6BF664263A635C93` → pre-remediation `74BD93E404014BF0C7CFDBF4809B86E3B054EFE13EDEB557E70AE22AA740AFE0` → final keyed role `A63F32925BC172EC7987876C25B06B4051F477DE802C96E1469A9A208D14023E` | 旧 sheet `947C7C829FA978376A7ECDE34A9B19E197B740F9A952D8A174DF993DE988FCFF` 与 attempts 15–18 明确 rejected；attempt08 exact prompt 为 `UNKNOWN — not persisted before interruption`，不得推断 |
| Brood Mass | move-05 `ED6DF3230062E0B77BA81C07F01F9D052C246AF63D271080B184589432E75C93` → `7BFC37BAB9AD94B3B2F4D86220454306F3544D72C364CAFCD256065E9E923909`；hit-03 `CB75F4A6A8358934A4467F58A452EDB75DFE607C2A1954AAE9AA13DC7D56CE3C` → `4A878B0BF5FFFDA12F426F30538B089F0D466B4E39135B8712655BFB6DB4AADF`；death-04 `09CC6918715411EA262A6783E1C889F6D326205E7B9EF81140975ADEE2E4E1FA` → `FDBF7F1EE1032389D578B9DBF5FBAE3E7FEA3C88D08510C16FDB2345C7FB8AE3`；split-10 `8247C28220C5D9F100DACAB72A38509AB48A97D21AF04D210EC30CE404A9CD7F` → `165FF013A621432F4F439DA35DE982D36AB43A6CCF9F24C3CD9DFDD15B44E3BB` | move-01–04、hit-01–02、death-01–03、split-01–09；全部 22 个 raw 与 generated original byte-equal，淘汰 raw 未覆盖 |

### P78 Drifter Gate 3 selected exact prompt tails

四个实际完整 prompt 均由 [P74](#p74-r-17-gate-2-common-animation-board-prompt) 的共同段落、一个空行、下列对应 tail 逐字组成；death 再以一个空行连接其 correction。除这些内容外没有其它文字。唯一引用为 `gate-1/normalized/r17-drifter.png`。

#### move-attempt-01 selected（prompt SHA-256 `2C87432A99F3CDA70D37C865F40A5F5E0AB467111D0A549FD22274FBB3F6A4B8`）

```text
Requested cell count: exactly 6 equal-width cells. A restrained floating locomotion cycle: broad upper body shifts weight, three lower tendrils alternate, cyan breathing node stays singular and containment band remains stable.
```

#### hit-attempt-01 selected（prompt SHA-256 `FD033D69481EB42D5DC6A7366FE34D6A6A928DA9A8FBACA5F5F955B5446D4CA9`）

```text
Requested cell count: exactly 2 equal-width cells. A short non-stagger hit reaction: broad body compresses and containment band catches the recoil.
```

#### death-attempt-04 selected（prompt SHA-256 `DD62C02DA8AC658773025C0494A11043BC332266A369EFDA769651C13625C0B7`）

```text
Requested cell count: exactly 6 equal-width cells. The floating body loses lift, three tendrils fold, red cracks close and the node extinguishes into an inert bound remnant; no global shrink.

Correction constraints: exactly six equal mathematical cells. Every pose has exactly three short unbranched lower tendrils: one left, one center and one right, with no forks, loops or extra ends. Frames 1 and 2 keep those three tendrils identifiable; frames 3 to 6 fold them upward and press them against the lower body without making an enclosed loop, hollow ring, transparent internal cavity, mouth or face. The final inert bound remnant has a solid dark lower body beneath the steel band. The cyan node follows this exact irreversible schedule: frame 1 has one bright multi-pixel cyan node; frame 2 has the same single node still visibly present but smaller and dimmer; frames 3, 4, 5 and 6 contain absolutely zero cyan, teal, turquoise, blue-green dot, glow, reflection or relight. Fill the former node region with solid dark charcoal tissue in frames 3 to 6. Red tissue cracks close progressively until frame 6 has no more than one tiny dark wine-red seam. The plain unlit steel containment band remains continuous and readable in all six frames. Keep the broad upper silhouette at one shared scale and roughly constant width; no global shrink, disappearance, debris or particles. Every pose stays fully inside its own cell with broad flat-green gutters.
```

#### contact-attempt-01 selected（prompt SHA-256 `08681AECD267BFD3FE85D7AACC6652923F5ECA5630DBA9E1E735BDAD0245609D`）

```text
Requested cell count: exactly 4 equal-width cells. A successful-contact action: broad body contracts, three tendrils brace, then the narrow lower body thrusts forward once and settles.
```

### P79 Pulse Sac Gate 3 selected exact prompt tails

四个实际完整 prompt 均由 P74 共同段落、一个空行、下列对应 tail 逐字组成；hit 与 death 再以一个空行连接 correction。Pulse ledger 未单独落盘 prompt payload SHA，因此该字段为 `UNKNOWN`，不补推断值。唯一引用为 `gate-1/normalized/r17-pulse-sac.png`。

#### move-attempt-01 selected

```text
Requested cell count: exactly 6 equal-width cells. A stable hovering cycle: organic sac flexes inside the negative-space ring while the steel stabilizer stays readable and the cyan aperture pulses subtly.
```

#### hit-attempt-03 selected

```text
Requested cell count: exactly 2 equal-width cells. A short hit reaction: sac dents against the steel ring and central aperture contracts.

Correction constraints: draw exactly two complete poses centered in two equal mathematical cells. The outer steel stabilizer must have exactly the same diameter, footprint, four hardware anchors, center, baseline and scale in both cells; it is rigid and does not shrink, expand, rotate, flip or deform. Only the organic sac inside the ring dents and the one cyan aperture contracts. No sparks, detached glints, particles, white flash fragments, green pixels, extra cyan specks or cracks outside the body. Keep at least 20 percent flat #00FF00 margin around each pose.
```

#### death-attempt-02 selected

```text
Requested cell count: exactly 6 equal-width cells. Pressure vents inward, aperture extinguishes, sac collapses within the intact stabilizing ring and settles; no explosion, gore or global shrink.

Correction constraints: output an exact 1800×900 horizontal canvas divided into six invisible 300×900 cells. Center one complete pose in each cell, keep every pose inside the middle 75 percent of its cell width, and leave uninterrupted #00FF00 at every cell boundary. Frame 1 retains the single cyan aperture, frame 2 visibly dims it, and frames 3 through 6 contain absolutely no cyan, teal, green, blue glow or detached colored specks anywhere. Keep the steel stabilizer intact and show collapse through the organic sac, not by shrinking the whole ring. Use fully opaque hard-edged subject pixels against fully opaque flat #00FF00.
```

#### shoot-attempt-01 selected

```text
Requested cell count: exactly 6 equal-width cells. Frames 1 to 4 visibly charge the existing cyan pulse aperture without changing world position; frame 5 is the exact release pose; frame 6 settles. The animation must not imply a projectile before release.
```

### P80 Brood Mass Gate 3 selected exact prompt tails

四个实际完整 prompt 均由 P74 共同段落、一个空行、下列对应 motion text、一个空行、对应 correction 逐字组成。唯一引用为 `gate-1/normalized/r17-brood-mass.png`。Split-10 的生成结果为 2×4，但 prompt 本身仍逐字要求单行；随后只做已审计的 row-major 零重采样搬运。

#### move-attempt-05 selected（prompt SHA-256 `6DBC9757694C2BFE49F5BED96AB30ABC358B2B9156EB86B4768377A56BCFD72A`）

```text
Requested cell count: exactly 6 equal-width cells. Preserve the accepted large multi-lobed outline; move only a few major lobes and internal weight, avoiding evenly distributed bubbling.

Correction constraints: exactly six clearly separated complete poses, all at one identical large readable scale, approximately 70 percent of the first attempt's sprite size, with broad flat #00FF00 gutters and no overlap. Keep exactly three chunky containment spikes and one small singular visible cyan brood core in every pose. The full silhouette uses a continuous solid dark outer outline at least 12 generated pixels thick. Every lobe, spike base, core housing and material highlight joins the main mass through solid opaque bridges at least 32 generated pixels thick so chroma cleanup and nearest-neighbor reduction cannot break any connection; no hairline, one-pixel connector, detached speck or floating highlight. The lower spike terminates in one broad blunt cap on the same baseline. Only a few major lobes deform inside the retained scaffold. No green or near-green subject pixels or fringe; use fully opaque hard-edged subject pixels.
```

#### hit-attempt-03 selected（prompt SHA-256 `D01A9B301FC53101010170DBB3002C3A7C0B1A2A358E6DE65EFE873A004D7F74`）

```text
Requested cell count: exactly 2 equal-width cells. A short heavy hit reaction localized around the upper brood core and three containment spikes.

Correction constraints: exactly two equal mathematical cells, one centered pose in each, with one identical occupied outer width and height. Keep exactly three chunky containment spikes fully attached by solid opaque bridges at least 16 generated pixels wide; every spike terminates in a blunt cap at least 16 generated pixels wide, never a one-pixel tip. Keep one small cyan brood core visible and singular in both poses. Show the hit only as compact compression around the upper core and spike anchors, not a broad red flare. Every material region and highlight is joined to the main mass by at least a 16-generated-pixel-wide opaque bridge; no detached speck, tiny detail, thin connector, green fringe or near-green fringe. Use fully opaque hard-edged pixels and broad flat #00FF00 gutters.
```

#### death-attempt-04 selected（prompt SHA-256 `20F3864C0C4941DF464149F38CAB1AE8BBE47E5EC7D9533A901659E298C919A7`）

```text
Requested cell count: exactly 6 equal-width cells. For non-splitting clones only: major lobes lose tension, brood core extinguishes and containment spikes settle into one inert colony mass.

Correction constraints: exactly six clearly separated complete poses at one identical large scale. Preserve one broad connected multi-lobed colony envelope through all six cells; lobes sag and fold inside a retained wide footprint, never shrinking, dissolving or leaving thin fragments. A natural dark lower colony lobe, not an added object, provides one broad opaque bottom edge at least 48 generated pixels wide on the identical baseline in every pose. No platform, floor, pedestal, base plate or detached object. Keep exactly three chunky containment spikes physically attached. The lower spike folds sideways and settles against the lower lobe without extending below its broad bottom edge; the left and right spikes lower into the inert remnant. The cyan brood core dims progressively and is fully dark by the final pose. All lobe and spike connections are at least 32 generated pixels thick; no hairline, one-pixel connector, detached speck or floating highlight. No green or near-green subject pixels or fringe; use fully opaque hard-edged pixels and broad flat #00FF00 gutters.
```

#### split-attempt-10 selected（prompt SHA-256 `D108FD56D4DD6219CB18D4A12EF3C469F9A85751A65982552F7F87381188AD39`）

```text
Requested cell count: exactly 8 equal-width cells. A true split display: upper brood core opens, three major internal channels separate toward three directions and containment spikes release, clearly explaining three already-committed Bud spawns; do not generate the children inside the board and do not delay their gameplay spawn.

Correction constraints: exactly EIGHT poses in one single horizontal row: closed, core crack, first internal channel, second internal channel, third internal channel, clamps open, hold, settle. Use eight equal cells and compact poses centered at 6.25, 18.75, 31.25, 43.75, 56.25, 68.75, 81.25 and 93.75 percent width. Lock the ENTIRE broad multi-lobed outer mother silhouette as one unchanged closed shell in all eight poses: no outer lobe opens, lifts, stretches, separates or changes the occupied bounding box. All split motion happens INSIDE this fixed broad shell. One small compact cyan upper-central core opens without growing. Three thick dark wine-red internal channels sequentially appear toward upper-left, upper-right and lower-center, but terminate well inside the opaque outer lobes and never reach the silhouette edge. The exactly three steel spike anchors remain at fixed symmetric perimeter positions; only broad clamp collars around their bases visibly open. No Y silhouette, arms, tendrils, external channels, detached lobes or children. All visible color blocks and highlights are broad and connected; no micro glint or isolated accent. Palette strictly blue-black/charcoal, dark wine-red, neutral steel and one small cyan core; no olive, green, yellow-green or turquoise body. No particles, shrink or dissolve; fully opaque hard-edged pixels.
```

### P81 Carapace Gate Gate 3 selected lineage and remediation contract

本节是 selected lineage 与 deterministic remediation 合同，不是 prompt 登记，也不补写不存在的逐字生成提示。attempt08 的 exact generation prompt 永久保持 `UNKNOWN — not persisted before interruption`；不得根据图像、后续 retry prompt 或审查意见反向重构。

- 唯一图像输入：`gate-1/normalized/r17-carapace-gate.png`，SHA-256 `7A2909CE91036C399063F411728D14BD7798097A5D2EC7413B11612BE44C9346`。没有用户截图、SCP Wiki 图片、素材包或其它第三方图像输入。
- selected fallback source：`gate-3/raw/r17-carapace-gate-role-replacement-attempt-08.png`；raw 与 generated original 逐字节相同，SHA-256 均为 `9E95984C17C989F6154637F75CA318F55EEFC22ACEFCDA6D6BF664263A635C93`。完整 lineage 见 `gate-3/logs/r17-carapace-gate-prompt-ledger.md`，SHA-256 `FF7D33C5D8C1FEBA2F66119BF7E9FED78E4173EDF32D2EA591758B6FD121934F`。
- remediation 输入：`gate-3/keyed/r17-carapace-gate-role-replacement-attempt-08-pre-normalized.png`，SHA-256 `74BD93E404014BF0C7CFDBF4809B86E3B054EFE13EDEB557E70AE22AA740AFE0`。脚本 `gate-3/logs/remediate_r17_carapace_attempt08.py` SHA-256 `FD61A715EDEDDFB006A73B9388F872A649F4FF12727C0E473BF7F955D2578B40`；focused test `gate-3/logs/test_carapace_attempt08_remediation.py` SHA-256 `BC8BD13FFA290881602D7AA3DF2D0365956B2964F48864AF94CC3A3D11645A8E`；role audit `gate-3/logs/audit_r17_carapace_role_replacement.py` SHA-256 `C1C1B18BD2A57DB85ADB6F19B2C804D5CF564D435A2000BC3B1C00B62C0407BA`。
- 确定性变更严格限于 RGB：把 4720 个 plate/steel 像素映射为 neutral steel，并清除 frame 2 的 4px cyan 碎簇。alpha、轮廓、位置、几何、连通性和八帧顺序全部不变；final role `gate-3/keyed/r17-carapace-gate-role.png` SHA-256 `A63F32925BC172EC7987876C25B06B4051F477DE802C96E1469A9A208D14023E`。
- 唯一有界容差：charge 首格 area `913`，比静态审查建议下限 `921` 低 8px / `0.87%`；该建议值不是运行时合同，为保持独立推荐的 alpha 不变，使用 `≤1%` 量化容差。无第二项容差或非容差失败。
- move/hit/death 保持冻结字节，只替换 role8。最终 `gate-3/normalized/r17-carapace-gate-action-sheet.png` 与 `public/assets/art/enemies/r17-carapace-gate-action-sheet.png` 逐字节相同，SHA-256 均为 `4775A31F1341D245725FA569DA28FB38476024C5DE6205CB323F91CF0694C776`。
- producer review `gate-3/review/r17-carapace-gate-producer-review.md` SHA-256 `503442E4AB26B3644893EF5B1AEB29BB6C677963A86FC5E44FB1EC64EDF9678B`；independent review `gate-3/review/r17-carapace-gate-independent-review.md` SHA-256 `64199FAD804F90A1DEDEE12CC3BAE5FAA2225565D88C1E1EBDE23C0D780724A3`。两者均为静态审查证据，不是项目所有者 `960×540` 实机验收。
- 旧 sheet `947C7C829FA978376A7ECDE34A9B19E197B740F9A952D8A174DF993DE988FCFF` 与 replacement attempts 15–18 全部明确 rejected 并保留，不得恢复为 current final。
- Historical Admission at Gate 3 was `Gate 3 review candidate; dev-only, not production-admitted`; Gate 5 final reconciliation above is now authoritative.

## SCP-049 Gate 4 正式动画表（Gate 5 production admission）

本节登记 SCP-049 的 80×96 四方向 locomotion 与正式 action sheet。项目所有者已接受 Gates 1–4，Gate 5 将两张与七张 R-17 action sheet 原子加入普通 production manifest、preload 与 bundle；候选 metadata 仅作为 provenance，不再过滤 production preload。旧 `scp-049.png` 始终保留为 locomotion/action 缺失时的静态 fallback，未被替换或删除；商业发布与署名义务仍须依现有许可记录执行。

外部证据根目录为 `C:\scp-survivor-workspaces\evidence\enemy-scp049-visual-overhaul`；下文 `gate-1/...` 与 `gate-4/...` 均相对于该目录。外部 evidence 不随 Git 提交。

| Asset | Type | Path | Tool/model | Date | Source / SHA-256 | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| scp-049-locomotion-sheet | spritesheet PNG | `public/assets/art/characters/scp-049-locomotion-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Pillow evidence processors + `build_enemy_boss_assets.py` | 2026-08-27 | 唯一图像输入 `gate-1/normalized/scp-049.png`，SHA-256 `5630BB463CBF28B04ABF589CF1A6AC771AD12F14C00AB0EDDA73D8C825A37BAD`；逐字提示、八次调用、所选/淘汰链见 `gate-4/logs/scp-049-locomotion-prompt-ledger.md`，ledger SHA-256 `E8E9876BEFF58C91F09998C1A56AE46981A4CD1159672B854A4A0B550E367F4E`；normalized/public final SHA-256 均为 `FE7C23BC628F9CAD458F7864FDE1937D8D5774294137AE886D9B6CBF6C068C21` | 四张所选 board 做 hard chroma、binary alpha、全局限色、连通域按原生左右顺序搬运、nearest 归一化与合同组装；随后 exact-RGB 映射 835px 绿/橄榄污染，alpha/轮廓/位置/帧序不变；左/右十对均非相同或镜像；locomotion cyan=0 | 项目定制生成；唯一图像输入为本项目已接受的 SCP-049 Gate 1 素材；无第三方图片输入；仓库分发继续受 `LICENSE-MAP.md` 与 SCP 衍生义务约束，商业发布前复核 OpenAI 输出权利及项目许可 | 开发态候选；静态 PASS 不构成正式商用准入 | Gate 4 review candidate; dev-only, not production-admitted | 800×384（4 rows × 10×80×96；down/left/right/up；每方向 idle 0–3、walk 4–9；RGBA、二值 alpha） | 必须署名 [SCP-049](https://scp-wiki.wikidot.com/scp-049) 条目作者 Gabriel Jade 与 2018 重写合作者 djkaktus，并附 CC BY-SA 3.0；衍生发布须遵守相同方式共享 |
| scp-049-action-sheet | spritesheet PNG | `public/assets/art/characters/scp-049-action-sheet.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Pillow evidence processors + `build_enemy_boss_assets.py` | 2026-08-27 | 唯一图像输入同上；逐字提示、六次调用、所选/淘汰链见 `gate-4/logs/scp-049-action-prompt-ledger.md`，ledger SHA-256 `DE7D3B221D59162A762A431DCF7FE985772363B0B072A40649B8F8C6CC13E352`；normalized/public final SHA-256 均为 `96B8E0CD49405C538D4744B004E61DC2BCFCB6265DBA12651D30600BAE76413D` | 所选 clip 做 hard chroma、binary alpha、全局限色、零重采样 row/component 搬运、nearest 归一化与合同组装；exact-RGB 映射 2622px，其中清除 hit-overlay frame 10 的 1px 误青，alpha/几何不变；cyan 仅为 recontain frames 16–18 的外部 Foundation 节点 | 项目定制生成；唯一图像输入、许可与复核边界同 locomotion；无第三方图片输入 | 开发态候选；静态 PASS 不构成正式商用准入 | Gate 4 review candidate; dev-only, not production-admitted | 1520×96（19×80×96；frenzy-enter 0–4、frenzy-loop 5–8、hit-overlay 9–10、recontain 11–18；RGBA、二值 alpha） | 同 locomotion：Gabriel Jade、djkaktus、SCP-049 条目及 CC BY-SA 3.0 署名/相同方式共享要求 |

### Gate 5 final admission reconciliation — SCP-049 sheets

The historical rows above retain prompt, source and rejected-candidate evidence. These two final governance rows supersede their earlier dev-only admission text; static `scp-049.png` remains present and resolvable as the action/locomotion fallback.

| Asset | Accepted source SHA-256 | Accepted final SHA-256 | Rejected candidates | Admission |
|---|---|---|---|---|
| scp-049-locomotion-sheet | `5630BB463CBF28B04ABF589CF1A6AC771AD12F14C00AB0EDDA73D8C825A37BAD` | `FE7C23BC628F9CAD458F7864FDE1937D8D5774294137AE886D9B6CBF6C068C21` | down-01, right-01 and up-02 rejected for nine poses; up-01 rejected for wrong direction | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |
| scp-049-action-sheet | `5630BB463CBF28B04ABF589CF1A6AC771AD12F14C00AB0EDDA73D8C825A37BAD` | `96B8E0CD49405C538D4744B004E61DC2BCFCB6265DBA12651D30600BAE76413D` | frenzy-loop-01 rejected for continuity; hit-overlay-01 rejected for replacement body | production admitted after Gates 1–4; Gate 5 integrated acceptance pending |

### P82 SCP-049 Gate 4 selected lineage、remediation 与静态审查

- Locomotion 所选 raw：down-02 `B7E78B781DCD747CC94DC0C32240E877826D6D0A0B1A1A10C5CF111EBB58713B`、left-01 `98DCDBB918DED4177CF082ABA7DA101AA6B9E03DCCD7C1FE0FCCEC353FB0D5B1`、right-02 `BBD1BF5A74F4519F3A038CAF645195ED30559EF2D1EDB7236CB0899F0513529D`、up-03 `90F5041FEB58CC06A9491FBDDA944C17768A554B42E3B4E2F942F17634334993`。down-01/right-01/up-02 因九姿势拒绝，up-01 因方向错误拒绝；无 pending attempt。
- Action 所选 raw：frenzy-enter-01 `43E6EDE1261B214ECDA74563A43F225284DE9F016D9B760F359FFDC4429EE8EC`、frenzy-loop-02 `A0F6F550843C8AE3C935176ECE6BCD315EF4288EA0C9F2F467168750292D4839`、hit-overlay-02 `4075041D4B503EB7D279F80CD37D1FFAF7B28868049D39A5693EEABB6ADA7F31`、recontain-01 `F37D9A40B703693ED459DE7BD685376B984686EDA8CDDC8BEACE92DDF0DE42C0`。frenzy-loop-01 因连续性拒绝，hit-overlay-01 因完整替换身体拒绝；无 pending attempt。
- Pre-remediation sheets `AB88586C703F5C3461EEC5398656BD0022C8A8836E10BD00C5D8DBAC9F2A3A70` / `17D6468207826B23C4831FA2E0384ADFBDF54D769D476DB0F6E5C4F54DAF4853` 已按 suffix 保留，不是 current final。`gate-4/logs/remediate_scp049_gate4_palette.py` SHA-256 `9F7BB8B0245192DF7FA6F9FC21244ABBC34EA19CDEE1E55F364C4D87B1BFDEBC` 只做锁定 source hash 的 exact-RGB 变换；最终 alpha channel 与 pre-remediation 字节相同。
- 独立静态审计 `gate-4/review/scp-049-gate4-static-audit.md` SHA-256 `0AA6AB0A8D53F2EF65C35BF3D09925F48958C70CB0D0A7A4C83C2442AED633E9`，结论 PASS。Locomotion producer review SHA-256 `212A4B50DEC99680751AD8D25AAAC12883AD3FC7935F14A0EA5BD8288A1B2A48`；Action producer review SHA-256 `8C7ED12FCD8E8BF662C85073BC216E4B6F05D62D8EDFD58FC1AF004BCCC40FA5`。producer review 与独立静态审计均不是项目所有者视觉验收。
- 4× nearest contact：locomotion `gate-4/contact/scp-049-locomotion-sheet-4x.png` SHA-256 `7047D8325B1D5D57DFC8F4C49E45B5A52DEA7FE9E46612D7323FD880A9C59152`；action `gate-4/contact/scp-049-action-sheet-4x.png` SHA-256 `35F213F4F7AEF2C7289E406A0E90DAA4F4971C0B6E1EE2D0BA95144E44803FAB`。
- 静态像素门禁为每帧 RGBA、binary alpha、hidden RGB 0、非空、不触边、无 1px alpha island、opaque palette ≤32；locomotion 无 cyan，action 的 cyan 只存在于 recontain frames 16–18。Hit overlay 是上下分离的稀疏 fragment；最终 recontain frame 保留接地、无活动酒红的 beak-and-cloth remnant，不是全局缩小消失。
- 已知 Minor：frenzy-loop frames 5–8 的低亮衣料量化色 `(40,51,37)` 在原生 1×与实际角色尺度下仍读作蓝黑/紫黑，不满足冻结的 green/olive predicate；黄铜、象牙与后背扣件的近综合色同样保留，不能为追求扩大的颜色谓词而误删功能材料。
- 运行态审查 `gate-4/review/scp-049-gate4-runtime-review.md` SHA-256 `25B3BAE17CC6417DC499DC633FB4FA78FEEB1E1605933A98FF5FB05149DBC6D8`，结论为 dev-only Runtime PASS。证据包含七张真实 Phaser `960×540` canvas 截图，覆盖 candidate locomotion、frenzy-enter、frenzy-loop、hit-overlay、recontain frames 17/18 与 forced legacy 对照；candidate 实际请求两张 Gate 4 sheet，forced legacy 只请求旧 `scp-049.png`。浏览器原始 JFIF 截图按解码后 RGB 像素转存为真正 PNG，未做内容编辑。为免六分钟等待造成非美术噪声，Boss 状态由本地临时调试引用触发，该引用在截图后已回滚，最终 diff 不包含调试入口或时间线改动。
- Gate 4 当时的 builder validation、静态回归、development-candidate runtime review 与 normalized/public byte equality 是历史证据；Gate 5 reconciliation 已将两张纳入 production，当前权威状态见本节 Gate 5 final admission rows。历史 `960×540` 截图仍可用于复核画布表现，但不再是等待 production admission 的前提；商业发布与署名复核边界不变。

### P83 SCP-049 Gate 4 locomotion exact prompt ledger

Gate 4 locomotion 的四方向 prompt、修正 prompt、每次调用的 raw/original SHA-256、selected/rejected disposition 和唯一静态 SCP-049 输入均完整持久化于外部 evidence：`gate-4/logs/scp-049-locomotion-prompt-ledger.md`（SHA-256 `E8E9876BEFF58C91F09998C1A56AE46981A4CD1159672B854A4A0B550E367F4E`）。该 ledger 的唯一引用输入为 `gate-1/normalized/scp-049.png`，SHA-256 `5630BB463CBF28B04ABF589CF1A6AC771AD12F14C00AB0EDDA73D8C825A37BAD`；Gate 1 静态来源的逐字 prompt 见 `gate-1/logs/source-manifest.md` 与 [P9](#p9-scp-049)。本登记不转录或重建这些逐字 prompt，以 ledger 为唯一权威原文。

### P84 SCP-049 Gate 4 action exact prompt ledger

Gate 4 action 的 frenzy-enter、frenzy-loop、hit-overlay 与 recontain prompt、修正 prompt、每次调用的 raw/original SHA-256、selected/rejected disposition 和唯一静态 SCP-049 输入均完整持久化于外部 evidence：`gate-4/logs/scp-049-action-prompt-ledger.md`（SHA-256 `DE7D3B221D59162A762A431DCF7FE985772363B0B072A40649B8F8C6CC13E352`）。唯一引用输入同 [P83](#p83-scp-049-gate-4-locomotion-exact-prompt-ledger)；最终 source/final hashes、处理和 rejected lineage 见 P82。本登记不转录或重建未在仓库持久化的 prompt payload，以 evidence ledger 为唯一权威原文。
