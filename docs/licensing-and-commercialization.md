# 许可与商业化准备

> **发布状态与免责声明**：v1.6.0 源码发布采用“独立软件 MIT + 项目生成素材、创意表达和 SCP 衍生内容 CC BY-SA 3.0”的双许可证结构。本文记录范围、署名和未来商业风险，不构成法律意见，也不代表商业发行审查已经完成。

## 当前阶段

项目仍处于原型完善和作品集开发阶段，尚未宣布商业发行。商业化是未来可能性，不是当前已批准的发行计划。本次公开 GitHub 源码 Release 不等同于商业发行批准；若未来分发方式或权利范围仍有疑问，应联系 SCP Licensing Team 或合格法律顾问。

## v1.6.0 双许可证结构

根目录 [许可总览](../LICENSE) 与 [路径级许可映射](../LICENSE-MAP.md) 界定本次源码发布的范围：

- 除非路径内另有更具体声明，独立创作的源代码、测试、脚本、配置和构建工具按 [MIT License 全文](../LICENSES/MIT.txt) 提供；
- 项目生成的视觉与视听素材、游戏文案、叙事/设计表达和 SCP 衍生内容按 [CC BY-SA 3.0](../LICENSES/CC-BY-SA-3.0.txt) 提供；
- 第三方依赖与单独标明的材料继续适用其各自许可证；
- 公开署名见 [ATTRIBUTION.md](../ATTRIBUTION.md)，逐项素材来源和处理记录见 [正式素材准入登记表](art/asset-register.md)。

该结构不撤回既有 MIT 许可副本已经获得的权利。本次选择不构成对唯一性、不侵权或未来商业发行权利完备的保证；本文不自行判断其最终法律效果。

## SCP 衍生内容与署名

SCP Foundation 的 [官方许可指南](https://scp-wiki.wikidot.com/licensing-guide) 将署名与相同方式共享列为核心要求；只有署名并不足够。当前公开署名将项目关联到 SCP Wiki，并按官方 citation 将 “SCP-049” 署名为 Gabriel Jade 创作、djkaktus 与 Gabriel Jade 重写。

项目的 SCP-049 游戏图像是项目自行生成和编辑的衍生视觉，没有使用或再分发条目原图；因此不得把条目图片作者误写为项目图片作者。SCP Foundation 的 [Image Use Policy](https://scp-wiki.wikidot.com/image-use-policy) 仍提示未来引用 Wiki 图片时必须另行核对图片来源与许可。

## 素材类别与当前边界

### 项目生成素材

[素材登记表](art/asset-register.md) 共记录 53 个生产 PNG。其中 51 个由运行时 manifest 加载；以下两个文件仅作历史/溯源保留，不由运行时 preload：

- `infected-staff.png`
- `infected-opening-sheet.png`

登记记录表明这些项目生成素材未使用第三方图片输入，并保留了提示、处理、尺寸、准入和来源标识。本次源码发布中，具有或不具有 SCP 衍生性质的项目生成视觉素材均按 CC BY-SA 3.0 提供。OpenAI 输出可能不唯一；当前记录不能证明素材唯一、不侵权或已取得商业发行许可，商业发行前仍须人工复核服务条款、来源和成品。

### SCP 衍生内容

SCP 世界观、SCP-049 及其他可识别的 SCP 衍生表达与独立软件代码分开处理；SCP 衍生内容按 CC BY-SA 3.0 提供，并必须满足具体条目作者署名和相同方式共享要求。新增 SCP 条目、文字、图像、名称或表达时仍须逐项复核。

### 第三方素材

当前登记未记录第三方图片输入；这不等于未来第三方字体、音频、图片、图标或依赖可以免审。任何第三方素材进入生产资源前必须记录作者/来源、原始 URL、许可证、修改状态、商业使用条件和署名要求。来源不明、许可不清、仅限个人使用，或附加条件与预期分发冲突的素材不得准入。

### 未来商业复核

素材通过生产或视觉门禁不等于通过商业发布门禁。未来商业复核至少包括：OpenAI 当时有效的服务条款与输出责任、第三方权利和相似性检查、SCP 衍生范围、依赖和构建工具许可证、目标平台条款，以及必要的专业法律意见。

## 未来商业发布门禁

- 核对 53 项登记、51 项运行时加载和 2 项历史保留边界；
- 复核每个 SCP 条目、作者、衍生内容及相同方式共享义务；
- 确认分发包包含适用的完整许可文本与公开署名；
- 复核图片、字体、音频、图标、动画、依赖和构建工具来源；
- 检查商店、DRM、附加条款与 CC BY-SA 3.0 条件是否冲突；
- 确认隐私、遥测、自动更新、账号和云服务规则；
- 若范围或许可兼容性仍有疑问，联系 SCP Licensing Team 或合格法律顾问。

## 官方参考

- [SCP Foundation Licensing Guide](https://scp-wiki.wikidot.com/licensing-guide)
- [SCP-049](https://scp-wiki.wikidot.com/scp-049)
- [SCP Foundation Image Use Policy](https://scp-wiki.wikidot.com/image-use-policy)
- [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
- [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/)
- [根许可总览](../LICENSE)
- [路径级许可映射](../LICENSE-MAP.md)
- [公开署名](../ATTRIBUTION.md)
- [MIT License 全文](../LICENSES/MIT.txt)
- [CC BY-SA 3.0 全文](../LICENSES/CC-BY-SA-3.0.txt)
- [正式素材准入登记表](art/asset-register.md)
