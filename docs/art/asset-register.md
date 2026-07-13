# 正式素材准入登记表

本表记录首批静态正式素材的真实生产信息。18 项文件已完成尺寸与原图检查，目前结论均为“静态门禁候选”；只有实机静态门禁通过后才能改为正式准入。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission |
|---|---|---|---|---|---|---|---|---|---|
| facility-floor | PNG | `assets/art/facility/floor.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P1](#p1-facility-floor)；无图像输入 | 从生成的重复面板中裁取单元；nearest 缩至 32×32；强制首末行列一致；转 RGBA；无抖动量化到共享 32 色板；保持全不透明 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-wall | PNG | `assets/art/facility/wall.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P2](#p2-facility-wall)；无图像输入 | 官方 `remove_chroma_key.py` 去底/去绿边；裁切；nearest 缩放；alpha 二值化；置入 64×64 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-door | PNG | `assets/art/facility/door.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P3](#p3-facility-door)；无图像输入 | 首版因正面立面被拒；重生成高俯视浅带门；去色键、裁切、nearest 缩放、alpha 二值化；纵向 nearest 拉伸到 20px 保持小尺寸可读；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-console | PNG | `assets/art/facility/console.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P4](#p4-facility-console)；无图像输入 | 首版因正面机柜被拒；重生成顶部平面主导设备；去色键、裁切、nearest 缩放、alpha 二值化；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-vent | PNG | `assets/art/facility/vent.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P5](#p5-facility-vent)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；置入 32×32 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-decal | PNG | `assets/art/facility/decal.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P6](#p6-facility-decal)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；置入 32×32 画布；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| player | PNG | `assets/art/characters/player.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P7](#p7-player)；无图像输入 | 首版因正视长比例被拒；第二版去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=46；共享色板量化；用色板内钢灰/棕色像素重绘 3×7 滑套、枪口和短握把 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| infected-staff | PNG | `assets/art/characters/infected-staff.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P8](#p8-infected-staff)；无图像输入 | 去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=46；共享色板量化 | 项目定制生成；未使用第三方图像输入；服务条款与输出权利须在商业发布前复核 | 候选；商业发布前复核 | 静态门禁候选 |
| scp-049 | PNG | `assets/art/characters/scp-049.png` | OpenAI built-in `image_gen`（模型名未由工具暴露） | 2026-07-12 | [P9](#p9-scp-049)；无图像输入 | 前两版因正面立绘/错误冠饰被拒；第三版重生成高俯视素布兜帽；去色键、裁切、nearest 缩放、alpha 二值化；最后不透明行 y=78；共享色板量化 | SCP-049 衍生视觉；合并/发布须满足项目文档所述 CC BY-SA 3.0 署名与相同方式共享要求并再次复核；未使用第三方图像输入 | 条件候选；商业发布与分发方式须先完成许可复核 | 静态门禁候选 |

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

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission |
|---|---|---|---|---|---|---|---|---|---|
| weapon-pistol-icon | PNG | `assets/art/weapons/pistol.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P15](#p15-weapon-pistol-icon-96)；仅文本输入 | 原图 1254×1254；官方 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；alpha 二值裁切；nearest 等比缩入 86×86 内容区并居中至 96×96；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(5,12,91,84)`，31 个不透明颜色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 |
| weapon-breacher-icon | PNG | `assets/art/weapons/breacher.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P16](#p16-weapon-breacher-icon-96)；仅文本输入 | 原图 1254×1254；同上官方去色键流程；alpha 二值裁切；nearest 等比缩入 86×86 内容区并居中至 96×96；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(5,29,91,66)`，32 个不透明颜色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 |
| weapon-tesla-icon | PNG | `assets/art/weapons/tesla.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P17](#p17-weapon-tesla-icon-96)；仅文本输入 | 原图 1254×1254；同上官方去色键流程；alpha 二值裁切；nearest 等比缩入 86×86 内容区并居中至 96×96；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(5,13,91,83)`，32 个不透明颜色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 |

## Opening Task 1 计划素材

以下条目仅锁定开局视觉合同所需的素材槽位；精确素材生成前，工具、日期、提示/来源、人工修改、权利基础与商业使用状态均保持空白。

| Asset | Type | Path | Tool/model | Date | Original prompt/source | Human edits | License/right basis | Commercial-use status | Admission |
|---|---|---|---|---|---|---|---|---|---|
| title-facility-backdrop | PNG | `assets/art/menus/title-facility-backdrop.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P13](#p13-title-facility-backdrop)；仅文本输入 | 原图 1672×941 RGB；Pillow 12.2.0 LANCZOS 精确缩放至 960×540；MEDIANCUT 无抖动量化为 32 色；转 8-bit RGBA 并将 alpha 固定为 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 |
| armory-rack-backdrop | PNG | `assets/art/menus/armory-rack-backdrop.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P14](#p14-armory-rack-backdrop)；仅文本输入 | 原图 1672×941 RGB；Pillow 12.2.0 LANCZOS 精确缩放至 960×540；MEDIANCUT 无抖动量化为 32 色；转 8-bit RGBA 并将 alpha 固定为 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-service-floor | PNG | `assets/art/facility/service-floor.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P18](#p18-facility-service-floor)；仅文本输入 | 原图 1254×1254 RGB；中心正方形裁切；nearest 精确缩至 32×32；MEDIANCUT 无抖动量化为 32 色；复制首行/列到末行/列形成逐像素闭合边界；转 8-bit RGBA，alpha 固定 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-hazard-stripe | PNG | `assets/art/facility/hazard-stripe.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P19](#p19-facility-hazard-stripe)；仅文本输入 | 原图 1254×1254 RGB；中心正方形裁切；nearest 精确缩至 32×32；MEDIANCUT 无抖动量化为 32 色；复制首行/列到末行/列形成逐像素闭合边界；转 8-bit RGBA，alpha 固定 255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-observation-window | PNG | `assets/art/facility/observation-window.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P20](#p20-facility-observation-window)；仅文本输入 | 原图 1536×1024 RGB；官方 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；alpha 以 128 阈值二值化并按 bbox 裁切；nearest 等比缩入 92×60 内容区并居中至 96×64；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(2,13,94,51)`，32 个不透明色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 |
| facility-pipe-bank | PNG | `assets/art/facility/pipe-bank.png` | OpenAI built-in `image_gen`（具体模型名未由工具暴露） | 2026-07-13 | [P21](#p21-facility-pipe-bank)；仅文本输入 | 原图 1536×1024 RGB；官方 `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`；alpha 以 128 阈值二值化并按 bbox 裁切；nearest 等比缩入 92×60 内容区并居中至 96×64；MEDIANCUT 无抖动量化；8-bit RGBA；bbox `(2,16,94,48)`，32 个不透明色，alpha 仅 0/255 | 项目定制生成；无第三方图像输入；未声明独立许可证，商业发布前复核服务条款与输出权利；当前无第三方署名要求，若服务条款复核产生要求则补充 | 候选；商业发布前复核 | 静态门禁候选 |
| player-opening-sheet | PNG | `assets/art/characters/player-opening-sheet.png` |  |  |  |  |  |  | 计划中 / 未准入 |
| infected-opening-sheet | PNG | `assets/art/characters/infected-opening-sheet.png` |  |  |  |  |  |  | 计划中 / 未准入 |

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

- 18 项文件统一保存为 8-bit RGBA；自动测试要求不透明颜色不超过共享 32 色板、alpha 只能为 0/255。
- `facility-floor`、`facility-service-floor`、`facility-hazard-stripe`、标题背景与军械库背景保持全不透明；三张地面 tile 另由自动测试逐像素验证上下与左右边缘相等。
- 其余 13 项透明区域已经二值化为 alpha 0，避免缩放后出现绿色或半透明毛边。
- 本批次没有使用用户截图、SCP Wiki 图片、现成素材包或其他第三方图像作为生成输入。
- AI 输出不是自动准入。Task 3 的真实 Phaser 接入和 Task 4 的 960×540 静态成品感门禁通过前，所有条目仍是候选。
