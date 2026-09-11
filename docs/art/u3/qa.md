# U3 QA 运行说明

游戏构建与单元测试只需仓库现有依赖：

```powershell
npm ci
npm test
npm run build
git diff --check
```

浏览器 QA 是单独的本地工具，不由 `npm test` 自动运行。需要可解析的 `playwright` 包和 Microsoft Edge（`msedge` channel）；`u3-weapon-fit-check.mjs` 另需 `sharp`。没有为 QA 修改游戏的 package.json 或锁文件。可通过外部 Node 工具目录及 `NODE_PATH` 提供这两项依赖。本轮使用 Codex 配置的本地 Node 运行库；复现者需要提供自己实际存在的工具路径，不能仅靠 `npm ci` 假定浏览器 QA 可用。

先在两个本地终端运行游戏（不访问用户已有浏览器 profile）：

```powershell
npm run dev -- --host 127.0.0.1 --port 49183 --strictPort
```

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 49185 --strictPort
```

另开 QA 终端，从仓库根运行，明确设置**新的**输出目录以免覆盖历史证据：

```powershell
# 按本机工具安装位置设置 NODE_PATH；其中应包含 playwright，轮廓检查另需 sharp。
$env:NODE_PATH = 'C:\your-qa-runtime\node_modules'
$env:U3_TEST_ORIGIN = 'http://127.0.0.1:49183'
$env:U3_EVIDENCE_DIR = Join-Path $env:TEMP ('scp-u3-qa-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $env:U3_EVIDENCE_DIR | Out-Null
node scripts/qa/u3-tab-toggle-check.mjs
node scripts/qa/u3-interaction-checks.mjs
node scripts/qa/u3-keyboard-check.mjs
node scripts/qa/u3-pause-sequence-check.mjs
node scripts/qa/u3-regression-check.mjs
node scripts/qa/u3-production-smoke.mjs
```

开发脚本严格限制为 `127.0.0.1:49183`，生产 smoke 固定 `127.0.0.1:49185`。它们创建新的临时浏览器上下文，不连接用户 profile，不清除用户 localStorage。开发脚本只在测试响应中注入场景引用以构造状态；生产 smoke 没有这种改写，读取的 `dist/assets` 必须与 49185 服务同属这一候选构建。先确保本机端口确实对应预期候选，端口被其他服务占用时停止，不自动替换或操作其他服务。

其他已入库专项脚本：

| 文件（`scripts/qa/`） | 覆盖范围 |
| --- | --- |
| `u3-display-matrix.mjs` | 3 视口 × 3 DPR × 五页，实机 PNG 与几何/裁切检查；`U3_QUICK_MATRIX=1` 可限定原尺寸首格 |
| `u3-cadence-check.mjs` | 步枪/Tesla 节奏描述、间隔与封顶、DPR 1/1.5/2、武器图回退 |
| `u3-extra-states.mjs` | 两武器升级、激活状态、多条强化、异常突变和 HUD 互斥 |
| `u3-weapon-fit-check.mjs` | 读取正式武器 PNG alpha 与实机变换，核对轮廓净空；另需 sharp |
| `u3-natural-play.mjs` | 真实输入短程游玩，场景坐标只读，未构造升级/击杀；结果受自然局面影响 |
| `u3-browser-support.mjs` | 共用临时上下文、构造状态、截图和隔离 origin 支持，不是单独测试 |

矩阵截图及构造胜败不等于用户视觉验收或自然通关。完整历史素材只留本地，以上脚本不依赖旧报告、旧 gallery 或本机 worktree 清单。当前构筑交互是单次 Tab 暂停切换，禁止用历史 `u3-clock-diagnostic`、`u3-first-display-check` 的“不暂停”结论验收当前行为。
