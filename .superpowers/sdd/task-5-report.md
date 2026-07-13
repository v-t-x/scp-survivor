# Task 5 WebGL smoke 修复报告

## 状态

- 分支：`feature/ui-art-overhaul`
- 修复前 HEAD：`1f7f7c8`
- GPT 审查等级：Level 0，无需外部 GPT

## 根因

标题页入场逻辑把 `action.objects` 中的透明 `hitArea` 一并设置为 `alpha = 0`，并纳入 240ms 延迟的第三段 alpha tween。Phaser 3.90 在 GameObject alpha 为 0 时清除 render flags，InputManager 随后会因 `willRender(camera)` 为 false 而拒绝该对象的命中测试。因此标题页入场完成前，按钮虽保持 interactive，仍无法响应点击。

## TDD 证据

- RED：先更新 `test/title-screen-view.test.js`，要求 `hitArea.alpha === 1`、第三段 tween targets 不含 hitArea、其余 action 视觉对象仍以 alpha 0 入场。运行 `node --test test/title-screen-view.test.js`，按预期失败：第三段 tween 仍包含 hitArea。
- GREEN：在 `src/art/titleScreenView.js` 中显式保持透明 hitArea 的 GameObject alpha 为 1，并仅将 action 视觉对象用于 alpha 初始化和第三段 tween。目标回归及 tactical UI 测试通过。

## 验证

- `node --test test/title-screen-view.test.js test/tactical-ui.test.js`：8/8 通过
- `node --test`：80/80 通过
- `npm run build`：成功
- `git diff --check`：通过

构建仍输出 Vite 的 chunk 大小提示；该提示与本修复无关。

## 修改范围

- `src/art/titleScreenView.js`
- `test/title-screen-view.test.js`
- 本报告：`.superpowers/sdd/task-5-report.md`

未 merge、未 push，未整理 `.superpowers/`。
