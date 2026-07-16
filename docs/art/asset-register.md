# 正式素材准入登记表

本表记录正式素材的真实生产信息。既有 20 项静态门禁候选历史记录保留不变；R-17 七套动画素材已通过独立的四帧 production gate 并正式准入；设施环境纵切 Task 1 的六张模块 PNG 已通过素材合同、二值 alpha、色数、接缝和视觉审查；终端覆盖层 Task 2 的 16 张升级图标与 3 张终端表面素材已通过尺寸、二值 alpha、色数和逐张视觉审查，其中 6 张 `tone=weapon` 图标已在独立审查后换为明确琥珀版本；战斗反馈 Task 1 的 contact-shadow 已通过尺寸、二值 alpha、灰黑色板、manifest/fallback 同键及视觉审查。登记现共计 53 项；被 manifest 停止 preload 的 `infected-staff` 仍作为历史来源记录保留。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| facility-floor | PNG | `assets/art/facility/floor.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P1](#p1-facility-floor)；无图像输入 | 从生成的重复面板中裁取单元；nearest 缩至 32×32；强制首末行列一致；转 RGBA；无抖动量化到共享 32 色板；保持全不透明 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-wall | PNG | `assets/art/facility/wall.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P2](#p2-facility-wall)；无图像输入 | 官方 `remove_chroma_key.py` 去底/去绿边；裁切；nearest 缩放；alpha 二值化；置入 64×64 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-door | PNG | `assets/art/facility/door.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P3](#p3-facility-door)；无图像输入 | 首版因正面立面被拒；重生成高俯视浅带门；去色键、裁切、nearest 缩放、alpha 二值化；纵向 nearest 拉伸到 20px 保持小尺寸可读；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-console | PNG | `assets/art/facility/console.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P4](#p4-facility-console)；无图像输入 | 首版因正面机柜被拒；重生成顶部平面主导设备；去色键、裁切、nearest 缩放、alpha 二值化；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-vent | PNG | `assets/art/facility/vent.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P5](#p5-facility-vent)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；置入 32×32 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| facility-decal | PNG | `assets/art/facility/decal.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P6](#p6-facility-decal)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；置入 32×32 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 32×32 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| player | PNG | `assets/art/characters/player.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P7](#p7-player)；无图像输入 | 首版因正视长比例被拒；第二版去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=46；共享色板量化；用色板内钢灰/棕色像素重绘 3×7 滑套、枪口和短握把 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 48×48 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| infected-staff | PNG | `assets/art/characters/infected-staff.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P8](#p8-infected-staff)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=46；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 | 48×48 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| scp-049 | PNG | `assets/art/characters/scp-049.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P9](#p9-scp-049)；无图像输入 | 前两版因正面立绘/错误冠饰被拒；第三版重生成高俯视素布兜帽；去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=78；共享色板量化 | SCP-049 衍生视觉；合并/发布须满足项目文档所述 CC BY-SA 3.0 署名与相同方式共享要求并再次复核；未使用第三方图像输入 | 条件候选；商业发布与分发方式须先完成许可复核 | 静态门禁候选 | 64×80 | 必须署名 [SCP-049](https://scp-wiki.wikidot.com/scp-049) 条目作者 Gabriel Jade 与 2018 重写合作者 djkaktus，并附 CC BY-SA 3.0；衍生发布须遵守相同方式共享。未使用条目原图。 |
| r17-drifter | spritesheet PNG | `assets/art/enemies/r17-drifter.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled chroma helper + Sharp | 2026-07-14 | 基础提示为 [P31](#p31-r-17-common-production-prompt)+[P32](#p32-r17-drifter)；accepted replacement original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-0ea14189-2748-4028-b8f5-50a152ba373b.png`；exact correction prompt unavailable in repository; do not attribute to base prompt alone；audit source `.superpowers/sdd/r17-assets/sources/r17-drifter.png` | exact chroma key；four equal cells；per-cell union alpha bbox；one shared nearest scale；common center/bottom baseline；binary alpha；no-dither <=32-color quantization；RGBA output 192x48 | Project-commissioned generation; approved lineup was the only image input; no third-party images; commercial release must recheck OpenAI output rights | candidate pending commercial review | R-17 animation gate admitted | 192x48, 4x48x48 | no third-party attribution currently; recheck OpenAI terms before commercial release. Rejected predecessor: `.superpowers/sdd/r17-assets/sources/r17-drifter-rejected-short-frame2.png` (initial original `C:\Users\24037\.codex\generated_images\019f5e8c-8742-77f0-80d3-e643979ff61d\exec-d86dea1b-1760-4a31-8b12-7a15bb75003b.png`), rejected for short frame 2. |
| r17-rift-skimmer | spritesheet PNG | `assets/art/enemies/r17-rift-skimmer.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | 基础提示为 [P31](#p31-r-17-common-production-prompt)+[P33](#p33-r17-rift-skimmer)；accepted replacement original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-d25b5a45-2e24-4985-ad8e-ce38fdceeda1.png`；exact correction prompt unavailable in repository; do not attribute to base prompt alone；audit source `.superpowers/sdd/r17-assets/sources/r17-rift-skimmer.png` | bundled chroma helper；four equal cells；per-cell union alpha bbox；one shared nearest scale；common center/bottom baseline；binary alpha；common deterministic no-dither <=32-color classification；RGBA output 192x48。审计 normalizer 原先错误地把 extent 28 的全部非 cyan 像素硬编码为 `139,112,111`，本次仅删除该 special branch，使 rift 与其他尺寸使用同一 charcoal/red/light-steel/brown/cyan 规则；source、scale、geometry 与门禁未改变。Current production SHA-256 `9E0C59A7C345DD4EB871ACBAA442B7FA3C57BB3EAEA7DC7E3E2674F3ABAFE4AD` | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation and material-semantic gates admitted | 192x48, 4x48x48 | Rejected retries retained, never production: `r17-rift-skimmer-rejected.png` (wrong pear-shaped initial result; original `C:\Users\24037\.codex\generated_images\019f5e8c-8742-77f0-80d3-e643979ff61d\exec-01bfb948-f6a5-4ea6-83fc-72f392975a3b.png`), one user-interrupted retry after about 16.6 seconds (no output or source path; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `r17-rift-skimmer-rejected-thin-tips.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-b6377d76-f6f1-41a2-ac4c-bc8b4679467b.png`, thin tips; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `r17-rift-skimmer-rejected-area-variance.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-bf130ba7-01fb-4ee1-9304-a546417ca565.png`, area ratio >1.20; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `.superpowers/sdd/r17-assets/sources/r17-rift-skimmer-rejected-color-collapse.png` (previous two-color production SHA-256 `C0AC839F6F81164A53C121FD63EAA231222D41F0EA466004B74F21E340167E65`, rejected because the extent-28 branch collapsed all non-cyan materials to one brown value). |
| r17-pulse-sac | spritesheet PNG | `assets/art/enemies/r17-pulse-sac.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | 基础提示为 [P31](#p31-r-17-common-production-prompt)+[P34](#p34-r17-pulse-sac)；accepted replacement original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-b1fdafc0-8ebe-41e7-81a8-c3c593a24166.png`；exact correction prompt unavailable in repository; do not attribute to base prompt alone；audit source `.superpowers/sdd/r17-assets/sources/r17-pulse-sac.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 192x48 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 192x48, 4x48x48 | Rejected retries retained, never production: `r17-pulse-sac-rejected-low-silhouette-motion.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-b4e52eb5-f241-4c77-89fa-d06e25c540d4.png`, alpha pair 1<->2 <0.015), `r17-pulse-sac-rejected-unequal-envelope.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-a956e1c8-2a58-423d-8eef-63c8b14cb15b.png`, extents 32/34/31/31; exact correction prompt unavailable in repository; do not attribute to base prompt alone). |
| r17-carapace-gate | spritesheet PNG | `assets/art/enemies/r17-carapace-gate.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | [P31](#p31-r-17-common-production-prompt)+[P35](#p35-r17-carapace-gate)；accepted original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-e965b64f-51a5-4fef-b0e9-e1b45b63802b.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-carapace-gate.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 256x64 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 256x64, 4x64x64 | no third-party attribution currently; recheck OpenAI terms before commercial release. |
| r17-frame-gap | spritesheet PNG | `assets/art/enemies/r17-frame-gap.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | [P31](#p31-r-17-common-production-prompt)+[P36](#p36-r17-frame-gap)；accepted original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-87988fa6-decd-47d3-9768-92e766ca9d48.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-frame-gap.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 256x64 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 256x64, 4x64x64 | no third-party attribution currently; recheck OpenAI terms before commercial release. |
| r17-brood-mass | spritesheet PNG | `assets/art/enemies/r17-brood-mass.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | [P31](#p31-r-17-common-production-prompt)+[P37](#p37-r17-brood-mass)；accepted original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-75cca67a-fe50-4ef3-917f-f3bb0fc00069.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-brood-mass.png` | same deterministic chroma/cell/shared-nearest/baseline/binary-alpha/<=32-color RGBA pipeline; final 256x64 | Project-commissioned generation; approved lineup only; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation gate admitted | 256x64, 4x64x64 | no third-party attribution currently; recheck OpenAI terms before commercial release. |
| r17-bud | spritesheet PNG | `assets/art/enemies/r17-bud.png` | OpenAI built-in `image_gen` + bundled chroma helper + Sharp | 2026-07-14 | exact correction prompt [P39](#p39-r17-bud-dark-body-color-correction)；accepted original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-84d68222-3c80-4816-9e39-3e3c8acb2bf6.png`；audit source `.superpowers/sdd/r17-assets/sources/r17-bud.png` | bundled chroma helper；four equal cells；per-cell union alpha bbox；one shared nearest scale；common center/bottom baseline；binary alpha；no-dither <=32-color RGBA output。审计 normalizer 原先错误地将 extent 22 硬编码为单一青色，本次删除该分支，使 extent 22 与其他尺寸使用同一套确定性多色分类/量化规则；未逐帧手绘、未使用单色替换、未放宽门禁；final 128x32 | Project-commissioned generation; approved project source was the only image input; no third-party images; recheck before commercial release | candidate pending commercial review | R-17 animation and visual-semantic gates admitted | 128x32, 4x32x32 | Rejected retries retained, never production: `r17-bud-rejected-short-frame4.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-359238e9-ac2c-4c4b-8b1f-ac934ec2f0d9.png`, short frame 4), `r17-bud-rejected-area-variance.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-671f4a03-3de3-42e8-9dc4-ff79db24a068.png`, area ratio >1.20; exact correction prompt unavailable in repository; do not attribute to base prompt alone), `r17-bud-rejected-color-collapse.png` (original `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-2ff87af1-292f-49bd-8f4c-46a4fb39df19.png`, committed output collapsed to one cyan opaque color; exact correction prompt unavailable in repository; do not attribute to base prompt alone). |
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
| player-opening-sheet | PNG spritesheet | `assets/art/characters/player-opening-sheet.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露）+ Node.js nearest/binary-alpha assembly | 2026-07-13 | 原概念源 [P22](#p22-player-opening-sheet)；补帧 [P25](#p25-player-idle-hit-remediation-source)；两次 walk 调用 [P26](#p26-player-walk-remediation-attempt-no-output)、[P29](#p29-player-walk-remediation-retry-no-output) 均无输出 | 补帧原图 `C:\Users\24037\.codex\generated_images\019f5a0e-95c3-72b0-969d-7fc51a88a89f\exec-1edce71f-7d84-477f-94c5-36e33f44ebaa.png`；以绿幕距离/绿色优势生成 binary alpha；4×6 alpha bbox 提取；idle 使用新源列 0–3，move 使用原源 idle/move 与新源列 0–3 共 6 个真实姿势，hit 使用新源列 4–5；nearest 等比缩入 40×42、渲染后脚底对齐 y=44；映射到原 player sheet 的 32 色 palette；输出 576×192、8-bit RGBA、alpha 0/255。工作源见 `.superpowers/sdd/opening-task-6-fix-sources/` | 项目定制生成；唯一 reference 为原项目定制生成源板；无第三方图像输入；未声明独立许可证，商业发布前复核 OpenAI 服务条款与输出权利；当前无第三方署名要求 | 候选；商业发布前复核 | 开局动画候选（真实动作帧修复） | 576×192 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |
| infected-opening-sheet | PNG spritesheet | `assets/art/characters/infected-opening-sheet.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露）+ Node.js nearest/binary-alpha assembly | 2026-07-13 | 原概念源 [P24](#p24-infected-opening-sheet-successful-source)；补帧 [P27](#p27-infected-idle-hit-remediation-source)、[P28](#p28-infected-walk-remediation-source) | idle/hit 原图 `C:\Users\24037\.codex\generated_images\019f5a0e-95c3-72b0-969d-7fc51a88a89f\exec-b6192a8e-30e2-472e-9424-22cb24026894.png`；walk 原图 `C:\Users\24037\.codex\generated_images\019f5a0e-95c3-72b0-969d-7fc51a88a89f\exec-4bb36632-a0dd-46e3-99d3-9127e6ac047a.png`；binary alpha 与 4×6 alpha bbox 提取；idle 列 0–3 / walk 列 0–5 / hit 列 4–5；nearest 等比缩入 40×42、脚底 y=44；映射到原 infected sheet 的 32 色 palette；输出 576×192、8-bit RGBA、alpha 0/255。工作源见 `.superpowers/sdd/opening-task-6-fix-sources/` | 项目定制生成；唯一 reference 为原项目定制生成源板；无第三方图像输入；未声明独立许可证，商业发布前复核 OpenAI 服务条款与输出权利；当前无第三方署名要求 | 候选；商业发布前复核 | 开局动画候选（真实动作帧修复） | 576×192 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款，若新增要求则补充。 |

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

Reference：`C:\Users\24037\.codex\generated_images\019f59e7-6613-73d3-9ac1-a2f4baa76dcd\exec-3d058fc0-8885-4f0b-9121-627db2e44d05.png`。输出：`C:\Users\24037\.codex\generated_images\019f5a0e-95c3-72b0-969d-7fc51a88a89f\exec-1edce71f-7d84-477f-94c5-36e33f44ebaa.png`。

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

Reference：`C:\Users\24037\.codex\generated_images\019f59e7-6613-73d3-9ac1-a2f4baa76dcd\exec-d4c287ef-366b-4f0f-983a-7e1b93fa44fe.png`。输出：`C:\Users\24037\.codex\generated_images\019f5a0e-95c3-72b0-969d-7fc51a88a89f\exec-b6192a8e-30e2-472e-9424-22cb24026894.png`。

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

Reference 同 P27。输出：`C:\Users\24037\.codex\generated_images\019f5a0e-95c3-72b0-969d-7fc51a88a89f\exec-4bb36632-a0dd-46e3-99d3-9127e6ac047a.png`。

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

开局使用约束：`infected-opening-sheet` 在 `elapsedSurvivalMs < 60000` 时是唯一权重大于 0 的普通敌人。

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

这些素材为原创 R-17 异常殖民，不登记为现有 SCP 编号。项目整体的 SCP 衍生发布仍须在发布前按 `docs/licensing-and-commercialization.md` 复核 CC BY-SA 义务。基准 lineup 的原始输出是 `C:\Users\24037\.codex\generated_images\019f5e8c-8742-77f0-80d3-e643979ff61d\exec-e5f13954-551f-478d-a322-e667d2e3d7c1.png`，本地审计副本为 `.superpowers/sdd/r17-assets/reference/r17-lineup.png`。七张可接受 source board 全部按 SHA-256 与上表的 original 逐一匹配；`.superpowers/sdd/r17-assets/**` 仅为本地审计且不提交。

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

Original: `C:\Users\24037\.codex\generated_images\019f5c42-ddb0-73d2-889d-cf86d3ad2300\exec-84d68222-3c80-4816-9e39-3e3c8acb2bf6.png`。

```text
Replace the four frames in this exact 1x4 horizontal spritesheet with a materially readable small R-17 bud that survives nearest-neighbor reduction to a 22-pixel-tall sprite. Preserve four equal frame cells, flat background exactly #00FF00, no transparency, no text, no shadow, no scenery, no perspective, no 3D. The creature must be legless and floating, with a LARGE broad dark charcoal/black organic tissue body making up at least 70 percent of its visible area, a thick near-black outer contour, muted red tissue seams/tendrils, one obvious small steel containment tag/collar, and a TINY cyan-white core no more than roughly 12 percent of the body area. Do not let the cyan core dominate. Use chunky high-contrast pixel clusters and thick shapes that remain visibly separate at 22 pixels: dark body, red tissue, steel tag, and tiny cyan core must all survive. Keep the same exact creature, part count, 22-pixel envelope, center, bottom baseline and total opaque area across all frames within 5 percent. Animate only gentle bending of the same thick tendrils and subtle body pulse; every frame silhouette must differ from all other frames without adding/removing parts. Crisp limited-palette top-down pixel art, fixed-size loop.
```

## 设施环境纵切 Task 1 真实生成与筛选记录

以下六项均在 2026-07-15 以 OpenAI built-in `image_gen` 完成，仅文本输入；工具未公开具体模型名，故不推断模型名称。没有使用用户截图、SCP Wiki 图片、素材包或其他第三方图像作为输入；没有使用 CLI/API fallback。原始和中间文件均留在 `.superpowers/sdd/facility-assets/sources/`，该目录与 1×/4× contact sheet 均为本地审计物，不暂存。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits / processing | License/right basis | Commercial-use status | Admission | Final dimensions | Attribution requirement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| facility-combat-floor | PNG | `assets/art/facility/combat-floor.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P40](#p40-facility-combat-floor)；original `C:\Users\24037\.codex\generated_images\019f6452-0dbb-7d13-9d19-326bd0d5a388\exec-f27b942d-cda0-4988-a559-fec6f3a06d56.png`；audit raw `sources/combat-floor-raw.png`；raw SHA-256 `D1453C62677DD7E3AD9524AF47390F17AA9DA18E78C02E2F2FFCF1D44A88E002` | 无手绘；`normalize_pixel_asset.py --fit cover --alpha opaque --colors 32 --seam-wrap`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `D17F66213177DE86516EF56D3B29AC6664F7F94697EA4C63588FFED169B64140`；2×2 seam 图已审查 | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、色数、alpha、接缝与视觉审查通过；不等同于商业发布准入 | 128×128 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-entry-threshold | PNG | `assets/art/facility/entry-threshold.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P41](#p41-facility-entry-threshold)；original `C:\Users\24037\.codex\generated_images\019f6452-0dbb-7d13-9d19-326bd0d5a388\exec-eb6c4656-3275-45d4-8f3c-8c16936bb73f.png`；audit raw `sources/entry-threshold-raw.png`；raw SHA-256 `23A5ECB2D251C6272E903BAE7F843D02EA9E5A38B541685278B2C4622A866ED4` | 无手绘；`normalize_pixel_asset.py --fit cover --alpha opaque --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `B6BC68CD27504594644AC50CA3CE1678CF2C2E9BA5575E3800B122061D973F3D` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、色数、alpha 与视觉审查通过；不等同于商业发布准入 | 128×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-maintenance-deck | PNG | `assets/art/facility/maintenance-deck.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P42](#p42-facility-maintenance-deck)；original `C:\Users\24037\.codex\generated_images\019f6452-0dbb-7d13-9d19-326bd0d5a388\exec-1cfc47ec-0246-4625-b1b4-15f9110b5cb9.png`；audit raw `sources/maintenance-deck-raw.png`；raw SHA-256 `8FCB07505E27C6094F31D965F0605518A0B28C36E409FB3A88D737A2E68E7FE0` | 无手绘；`normalize_pixel_asset.py --fit cover --alpha opaque --colors 32 --seam-wrap`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `8CFA9F9399ADC3403A48C2D417836E84D0F2F51782CB52487D24118311A70BAB`；2×2 seam 图已审查 | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、色数、alpha、接缝与视觉审查通过；不等同于商业发布准入 | 128×128 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-wall-bank | PNG | `assets/art/facility/wall-bank.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P43](#p43-facility-wall-bank)；original `C:\Users\24037\.codex\generated_images\019f6452-0dbb-7d13-9d19-326bd0d5a388\exec-8e0b337e-a003-47fd-97d0-86d71a073ad9.png`；audit raw `sources/wall-bank-raw.png`；raw SHA-256 `8077C453C741A6B5BED4003A0B09769D84F4C23B7BE84920D3176155380C916A` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 输出 `sources/wall-bank-cutout.png` SHA-256 `2CB854F0C3C6612A21ADC65C694AE1FD8AADDE52868DDCF732D3BBA9173F6F96`；随后 `normalize_pixel_asset.py --fit contain --alpha binary --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `EA4272AF5CB5445709F7DE218E0FFA93F01AC9590C1538668200550807126FAE` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、二值 alpha、无绿边、色数与视觉审查通过；不等同于商业发布准入 | 128×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-power-junction | PNG | `assets/art/facility/power-junction.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P44](#p44-facility-power-junction)；original `C:\Users\24037\.codex\generated_images\019f6452-0dbb-7d13-9d19-326bd0d5a388\exec-f2f222b9-ecb2-4616-8ce2-b33a6d592eee.png`；audit raw `sources/power-junction-raw.png`；raw SHA-256 `671C847DA0CB1F39679F6462B7949DE6429B7CD21F939201E948056ED08B88B9` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 输出 `sources/power-junction-cutout.png` SHA-256 `F414CB00874A11D719F9920131C8C7D20A9E3210BB9E47CFDCC675D97196642A`；随后 `normalize_pixel_asset.py --fit contain --alpha binary --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `B8F5AB5591801EFAA437344E2161B4A2DA1B6FD926A9DA117D59E51F83687546` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、二值 alpha、无绿边、色数与视觉审查通过；不等同于商业发布准入 | 96×96 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |
| facility-contamination-trail | PNG | `assets/art/facility/contamination-trail.png` | OpenAI built-in `image_gen`（模型名未由工具暴露）+ bundled `remove_chroma_key.py` + `scripts/art/normalize_pixel_asset.py` | 2026-07-15 | [P45](#p45-facility-contamination-trail)；original `C:\Users\24037\.codex\generated_images\019f6452-0dbb-7d13-9d19-326bd0d5a388\exec-29364643-61fe-466a-999d-9f68b9ba7a1d.png`；audit raw `sources/contamination-trail-raw.png`；raw SHA-256 `7DB208754B835357147987DE16BE5C285C94CA761E92EE380DD538177E0C0BCB` | 无手绘；bundled helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` 输出 `sources/contamination-trail-cutout.png` SHA-256 `162694949248E6816CB77CBCF46B5319A19C36A3D91EA2CC61DED60619EA6C93`；随后 `normalize_pixel_asset.py --fit contain --alpha binary --colors 32`，Pillow nearest、无抖动量化、8-bit RGBA；final SHA-256 `F6DBE86BD5D6DFBF67F171E19E79CFEFD5E89610F17469D7D87B1B10A5F0272F` | 项目定制生成；无第三方图像输入；商业发布前复核 OpenAI 输出权利与项目许可 | 候选；商业发布前复核 | Task 1 正式生产素材准入：合同、二值 alpha、无绿边、色数与视觉审查通过；不等同于商业发布准入 | 64×64 | 当前无需第三方署名；商业发布前复核 OpenAI 服务条款。 |

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

- 初版升级图标 raw：Codex 默认源 `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-3d045c2e-6f10-4277-9bcf-f88e82a8067b.png`；审计副本 `.superpowers/sdd/terminal-task-2-assets/sources/upgrade-icons-source-board.png`；1254×1254 RGB；SHA-256 `C2EE6E37A9C7395E41A6FD58F8D3602B9A4C70FE9737A98EEC666EADB21A8909`。该源板继续作为其余 10 张图标的正式来源及 6 张 tone 修订的项目内参考。
- 初版升级图标去底：bundled `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；输出 `upgrade-icons-source-board-cutout.png`；SHA-256 `E262B8A8AD3D854AA36E56499B5860B690269A7FF81B3D676DF87AE611999864`。按 round 边界固定等分 4×4，以 alpha≥128 的 bbox 加最大边 10% padding 切出 16 个 cell，再由 `normalize_pixel_asset.py --width 32 --height 32 --fit contain --alpha binary --colors 32` 以 Pillow nearest、无抖动量化输出 8-bit RGBA；其中 6 张 weapon 初版已被下述修订替代。
- 6 张 weapon tone 修订均为 1254×1254 RGB built-in imagegen 输出；默认源、审计副本和 SHA-256 如下。模型名未暴露；本地输入仅为对应初版正式图和 P46 项目源板，无第三方图像输入。

| Asset | Codex default raw | Untracked audit raw | Raw SHA-256 |
|---|---|---|---|
| damage | `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-1013bb59-7b7f-44e8-a11e-672ab15b9dc8.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-damage-imagegen-source.png` | `EBC0A57F9319A2E808531AA9A7AB9B82A2C0C9ECB0A120E3E7FB10DD2D25468E` |
| attack-speed | `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-0c6cd93f-d1b8-49d7-bad6-c163404bd7f1.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-attack-speed-imagegen-source.png` | `0F826A8A1F3756DAE4B1176AE45D2D60A468CA8B132255D4BBC4833E3BFC6745` |
| projectile-count | `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-a677b7d5-7270-495f-a450-2cf63ec8593f.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-projectile-count-imagegen-source.png` | `2BC031A4B6AC972AF81334D7333945D26EB8245C4E8E919D87E87561DA5C81EA` |
| penetration | `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-fad567f8-881a-4aba-a980-8804fcf8fbdb.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-penetration-imagegen-source.png` | `BA4D60A79ABC485E8E9A674043A7E6EF2D1312876A98E02EA83B00437F8D6E02` |
| tesla-chains | `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-0a9b1059-37cc-4b14-9e69-f67189274881.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-tesla-chains-imagegen-source.png` | `EBFC911E11CC792E6CA72CB923772A2AEB6C2F26970B646DF121649958F1EBA3` |
| tesla-cooldown | `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-a9981b60-a537-4a54-8f21-efc1d98b72af.png` | `.superpowers/sdd/terminal-task-2-assets/sources/weapon-tone-tesla-cooldown-imagegen-source.png` | `47E17FDD7CB699B30B1AA3A228259669783CA0CF9A71FA3786AD8B45D19FA3EF` |

- 6 张修订均使用上述 bundled helper 精确参数去底，再按非零 alpha bbox 加横纵各 10% padding 裁切；crop 尺寸依次为 794×815、817×843、742×740、911×792、892×859、877×793。随后仅用 `normalize_pixel_asset.py --width 32 --height 32 --fit contain --alpha binary --colors 32` 输出；没有脚本改色、手绘修补或候选拼接。cutout SHA-256 依次为 `779AC0D63CCDD6EA7A7CBEA421778E08CBF0FC517022D6616E99D92197AF37CB`、`D76C5FD2D503E591F5848A35C14F1717EB1F0B3F25BEF3D2BFE5A6120E1DD4D4`、`6559E85952BC1715F58DB5AED7C021CC560AAD07887004B901DE6F9D630C7CB6`、`ECE41899222F7B602357940E8F4C61C40E12F1A8581ADFDCBCC8F1499232EBF3`、`513C4D121DC97217C0CB92FADCAF2CA3BAE453A0CDAE12A258F57D2A194AD410`、`96E6A8F63F84EF4397D6FDE4AE651E242C58716BF2472C7C0B63275B87AB9C5C`；crop SHA-256 依次为 `72376BA81A5C0AB89AB7B9F7D9415FFB45AD959F26D153ED50FD60DEF62F2CA0`、`23C06928B1287E4665D1FAA45F589773DBE3EED0AD23EF152BCB18EA06FCE4FA`、`AE41454F4D7A4BD9A58A666A118B4935044930825AB444973E71789C4E2885FD`、`4393FC73CE79F4D503312759D1ED4B21017C10CDB1F13B49C8004E7C0DDA01AE`、`3E1DF775C5032196AF083B63C8DC3564EF0DA06516D149CEED2A5BB54AC9E1BE`、`714D9B0254FFC213F9AEF3CF5D1FF4635385D71A657C798847D5963736DBE69F`。
- 终端素材 accepted raw：Codex 默认源 `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-8c92bd9e-5659-42eb-8916-938f50850e3d.png`；审计副本 `.superpowers/sdd/terminal-task-2-assets/sources/terminal-surfaces-source-board-accepted.png`；2172×724 RGB；SHA-256 `4BA7C5C07F3EC13BD3D2A6127D4EC9FDB1CCB0F251F125330CD6F75495D12E77`。
- 终端素材去底：同一 bundled helper 参数；输出 `terminal-surfaces-source-board-accepted-cutout.png`；SHA-256 `57B31367938C42E4D385954831CC551D5B70689016D0E39D3AB722C51E1E6D45`。随后固定等分 1×3，以 alpha≥128 的 bbox 加最大边 5% padding 切出三个 cell；没有手绘、重绘或颜色替换；再分别用 `normalize_pixel_asset.py --fit contain --alpha binary --colors 16` 输出 128×128、96×32、96×32 的 8-bit RGBA。
- contact sheet 均由 `scripts/art/build_contact_sheet.py` 以整数 nearest scale 生成：修订后 `upgrades-contact-sheet-1x.png` SHA-256 `7C7B52D4CEA827FB759EF7C768CFD04204B396EFB708579B01CD4A4CB96CA267`；`upgrades-contact-sheet-8x.png` SHA-256 `0EECDA7622130F14901034F4609107956DAF5EA9A08A3D979CCDBA0DC3437450`；`terminal-surfaces-contact-sheet-1x.png` SHA-256 `11B605E20DA7FE548C1F963966386B99DB30ECE26211D931F022D817D94FE6A0`；`terminal-surfaces-contact-sheet-8x.png` SHA-256 `13909B3BA4BF7A471598AFB1B74F5EC00C83C5849C55E50932082C8CD6FA98A6`。
- 逐张原始尺寸及 8× nearest 审查通过：16 个升级轮廓在 32×32 可辨，二值 alpha、透明边缘与 tone 语言明确；6 张修订的琥珀像素计数为 98、99、91、25、62、94，强青与紫色 accent 均为 0；tesla-cooldown 的线圈模块与右侧回转箭头清晰。grid 为开放线路；两个 stamp frame 无文字、同构且颜色语义分离。没有录用抗锯齿或只在缩小后才像像素画的候选。

### 被拒与中断尝试

- [P47](#p47-terminal-surfaces-first-attempt-rejected) 产生了可用输出，但因 grid 带实心深色底板，且绿色 recontainment frame 混入红/粉磨损像素而拒绝，未进入生产后处理。Codex 默认源 `C:\Users\24037\.codex\generated_images\019f65c4-670d-7053-a240-6b34370b3805\exec-5f6ff56c-05df-4622-bc57-c931b9e80987.png`；审计副本 `.superpowers/sdd/terminal-task-2-assets/sources/terminal-surfaces-source-board-rejected-filled-grid.png`；2172×724 RGB；SHA-256 `392326A64727E6F4B57B40AA8E66896A666A31682A65A74A4A754546993C3216`。
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
Use case stylized-concept; asset is a source artwork for a 2D top-down pixel-art contact-shadow sprite; exactly one isolated horizontal oval shadow centered on flat #00ff00 chroma-key; charcoal/black, darkest center, 3-4 discrete hard-edged pixel bands, 2:1 silhouette; no antialiasing, blur, object, text, glow, 3D, or extra marks.
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
