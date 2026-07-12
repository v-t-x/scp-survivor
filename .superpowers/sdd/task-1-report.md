# Task 1 报告：锁定正式素材合同与准入记录

## 目标

按已批准的静态正式素材门禁，锁定首批 9 项 PNG 的 manifest 合同，并建立逐项资产登记表。

## 结果

- `src/assets/manifest.js` 已新增 6 个设施纹理 key，并声明 9 项 `IMAGE_ASSETS`。
- `test/art-assets.test.js` 已新增合同测试，并通过。
- `docs/art/asset-register.md` 已建立正式素材准入登记表。

## RED / GREEN 证据

### RED

命令：

```bash
node --test test/art-assets.test.js
```

关键输出：

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

+ Map(0) {}
- Map(4) {
  ...
}
```

说明：初始 manifest 仍是空 `IMAGE_ASSETS`，合同测试按预期失败。

### GREEN

命令 1：

```bash
node --test test/art-assets.test.js
```

关键输出：

```text
✔ production manifest declares the approved static vertical slice
ℹ tests 1
ℹ fail 0
```

命令 2：

```bash
node --test
```

关键输出：

```text
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

## 修改文件

- `src/assets/manifest.js`
- `test/art-assets.test.js`
- `docs/art/asset-register.md`

## 自审

- 保留了既有稳定 key 字符串，没有重命名现有 texture key。
- `SPRITESHEET_ASSETS`、`ATLAS_ASSETS`、`AUDIO_ASSETS` 保持原状。
- 仅新增正式素材合同与文档记录，没有触碰玩法、胜负、时间线、存档或 fallback 行为。
- 资产登记表使用了任务 brief 中要求的固定字段和统一准入措辞，没有伪造作者或第三方许可证。

## 风险与后续

- 当前仅完成合同与登记记录；真实 PNG 文件与后续像素清理属于后续任务。
- `manifest.js` 已接入正式路径，后续若文件缺失仍会回落到程序化 fallback，这符合现有启动合同。

## 审查修复补充

### 修复内容

- `docs/art/asset-register.md` 已从“已批准”改为“计划中 / 未准入”，并把 `Tool/model`、`Date`、`Original prompt/source`、`Human edits`、`License/right basis`、`Commercial-use status` 统一留空为 Task 2 真实生成后回填。
- `facility-floor` 的说明已改为“不透明、完整覆盖 32×32、四边无缝铺贴”，不再要求透明背景。
- `test/art-assets.test.js` 已增加 `IMAGE_ASSETS.length === 9` 与 texture key 唯一性断言，并补了重复 key 反例测试。

### 证据

重复 key 的最小可控 RED 证明命令：

```bash
node --input-type=module -e "import assert from 'node:assert/strict'; const assets=[{key:'a'},{key:'b'},{key:'a'}]; const keys=assets.map(({key})=>key); assert.equal(keys.length, new Set(keys).size, 'duplicate texture keys detected');"
```

关键输出：

```text
AssertionError [ERR_ASSERTION]: duplicate texture keys detected
3 !== 2
```

修复后的验证命令：

```bash
node --test test/art-assets.test.js
node --test
```

关键输出：

```text
✔ production manifest declares the approved static vertical slice
✔ production manifest contract rejects duplicate texture keys
ℹ tests 2
ℹ fail 0
...
ℹ tests 12
ℹ pass 12
ℹ fail 0
```
