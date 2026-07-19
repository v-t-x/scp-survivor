# License Map / 许可范围映射

This file defines the repository's license scope for the v1.6.0 source release. 本文件界定 v1.6.0 源码发布中各类文件的许可范围。

## MIT License

Unless a file contains a more specific notice, the following are licensed under the [MIT License](LICENSES/MIT.txt):

- `src/**/*.js`
- `test/**/*.js`
- `scripts/**/*`
- `.github/**/*`
- `package.json`, `package-lock.json`, `vite.config.js`, and other build/configuration files

除文件内另有更具体声明外，上述源代码、测试、脚本、CI 与构建配置按 MIT License 提供。

## CC BY-SA 3.0

The following are licensed under [Creative Commons Attribution-ShareAlike 3.0](LICENSES/CC-BY-SA-3.0.txt):

- `public/assets/**/*`, including project-generated visual and audiovisual assets
- player-facing game copy, narrative text, setting, characters, and other creative/design expression
- SCP-derived content, including SCP-049-derived material
- repository documentation and release copy, except code snippets that are independently usable as software

上述项目生成的视觉与视听素材、面向玩家的文案、叙事设定、角色与设计表达、SCP 衍生内容、项目文档和发布文案按 CC BY-SA 3.0 提供；其中可作为独立软件使用的代码片段仍按 MIT License 处理。

Required SCP and SCP-049 attribution is recorded in [ATTRIBUTION.md](ATTRIBUTION.md). 素材来源与修改记录见 [`docs/art/asset-register.md`](docs/art/asset-register.md)。

## Third-party material / 第三方材料

Third-party packages and separately identified material remain under their own licenses. When a path-specific notice conflicts with this map, that more specific notice controls.

第三方依赖和单独标明的材料继续适用其各自许可证；路径内更具体的许可声明与本映射冲突时，以该具体声明为准。
