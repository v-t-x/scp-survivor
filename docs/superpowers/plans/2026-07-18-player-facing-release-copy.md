# 玩家向发布文案实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 v1.4.0 与 v1.5.0 的仓库文案和 GitHub Release 改为玩家优先的游戏更新公告，同时保持标签、版本边界和审计事实不变。

**Architecture:** `docs/releases/` 中的两份 Markdown 是完整文案源，README、CHANGELOG、项目状态与文档索引只保留适合各自入口的摘要。GitHub Release 名称直接使用中文公开标题，正文由对应源文件移除首个一级标题后生成；所有外部写入都在本地验证、提交和远端 ancestry 检查之后执行。

**Tech Stack:** Markdown、PowerShell、Git、GitHub CLI (`gh`)、Node.js test runner、Vite。

## Global Constraints

- `v1.4.0` 中文公开标题固定为 `v1.4.0 — 收容行动整备`，英文对应名称固定为 `v1.4.0 — Containment Readiness`。
- `v1.5.0` 中文公开标题固定为 `v1.5.0 — SCP-049：疫医狂潮`，英文对应名称固定为 `v1.5.0 — SCP-049: Surgical Frenzy`。
- v1.4.0 必须明确是稳定性回溯更新，不得宣传为画面重制、新美术或新玩法。
- v1.5.0 必须以狂热阶段、弱点窗口、混合增援和敌群复制为玩家重点。
- 精确提交、倍率、上限、测试与历史元数据放在末尾的“开发与版本说明”中。
- 在线 Demo 继续标记为尚未核对；UI/Art、角色动画、橘色角色路线和客户端平台继续标记为未随 v1.5.0 发布。
- 不修改或重建 `v1.4.0`、`v1.5.0` 标签，不改变其目标提交，不上传或删除 Release 附件。
- 不修改游戏代码、玩法配置、版本号、在线 Demo 或任何开发分支。
- 只允许普通快进 push；禁止 force push、历史重写、标签改写、Release 删除或重建。

---

### Task 1: 重写两份 Release 文案源

**Files:**
- Modify: `docs/releases/v1.4.0.md`
- Modify: `docs/releases/v1.5.0.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-18-player-facing-release-copy-design.md` 的批准标题、摘要、边界和同步规则。
- Produces: 两份完整 Markdown 文案；Task 4 会移除首个一级标题后把正文同步到 GitHub。

- [ ] **Step 1: 记录旧文案确实仍以技术术语开场**

Run:

~~~powershell
rg -n "^# v1\.4\.0 — UI Foundation|^# v1\.5\.0 — SCP-049 压力模型|release-prep|package\.json" docs/releases/v1.4.0.md docs/releases/v1.5.0.md
~~~

Expected: 两个旧标题都能定位，v1.4.0 开场包含包版本信息，v1.5.0 开场包含 release-prep 说明。

- [ ] **Step 2: 用批准的玩家向正文替换 v1.4.0 文案**

Set `docs/releases/v1.4.0.md` to:

~~~markdown
# v1.4.0 — 收容行动整备

这是一次面向稳定性的回溯更新，不是画面重制。游戏的启动、资源加载和重新开始流程得到整理，让连续多局游玩更加可靠，也为以后逐步加入正式美术和音频素材做好准备。

## 本次改善

- 修复连续重新开始后可能累积的后台监听，降低多局游玩后出现异常的风险。
- 统一游戏启动和资源加载流程；素材缺失时仍会使用程序化画面和合成音效。
- 现有武器、敌人、HUD、音效和六分钟流程保持不变。

<details>
<summary>开发与版本说明</summary>

- 本 Release 于 2026-07-18 回溯整理，记录 2026-07-10 已完成的资源加载、UI、音频接口与 restart 生命周期工作。
- `v1.4.0` 标签固定指向 `2f9c28534d6b99f0f0996f44bb236ecb235e8d4f`，没有重写历史。
- 原提交中的 `package.json` 仍显示 `1.3.0`，`package-lock.json` 的根项目版本仍显示 `0.1.0`；这些是原始提交的历史元数据。
- 本版本不包含正式 UI/美术素材、SCP-049 新终局战或 Windows 客户端，也不附加声称来自独立 v1.4.0 构建流程的二进制产物。
- 程序化纹理与 Web Audio 继续作为当前原型表现和资源缺失时的 fallback。

</details>
~~~

- [ ] **Step 3: 用批准的玩家向正文替换 v1.5.0 文案**

Set `docs/releases/v1.5.0.md` to:

~~~markdown
# v1.5.0 — SCP-049：疫医狂潮

六分钟生存战的终点现在更加危险。SCP-049 会在战斗中进入“外科狂热”：它停止追击、召来混合增援，同时暴露短暂的弱点。玩家必须在清理不断复制的敌潮和集中攻击 Boss 之间迅速选择。

## 主要更新

- SCP-049 终局战现在会在普通追击、外科狂热和濒死结算之间切换，不再只是单纯追击和召唤。
- 狂热阶段会出现短暂的弱点窗口，此时 SCP-049 承受更多伤害。
- 防暴镇压单位、闪现潜行者、复制生物体和安保无人机可能同时加入围攻。
- 非 Boss 敌人会尝试自我复制，拖延清场会让局势迅速失控。
- 敌人总量设有安全上限，避免复制与召唤无限增长。

<details>
<summary>开发与版本说明</summary>

- Boss 使用 `normal → frenzy → normal → dying` 状态机。首次狂热约在登场 12 秒后触发，持续 2.5 秒；基础冷却为 14 秒，生命不高于 50% 后的后续冷却乘以 0.65。
- 狂热阶段在固定环上请求 20 个混合增援，并开放 1.35 倍承伤窗口；收容突破器的 Boss 增伤与该窗口合并后统一限制为 2.0 倍。
- 所有非 Boss 敌人每 6–9 秒尝试复制；所有活动敌人共享 230 个硬上限，达到上限时复制或召唤安全截断。
- 新增并维护 11 个 Node 回归测试；GitHub Actions 在构建前运行 `node --test`。
- 功能边界为 `daeb3ed605f29a2d97a30458ee12109561dbaf6d`；`v1.5.0` 标签固定指向经核验的发布提交 `c92da05d8c8c066c462b08c3b6db21bee877d31b`。
- UI/Art、角色动画、橘色角色路线和客户端平台均未随本版本发布。
- 在线 Demo 尚未核对为本标签，不能声称已经部署 `v1.5.0`。

</details>
~~~

- [ ] **Step 4: 验证玩家摘要、审计事实和格式**

Run:

~~~powershell
rg -n "^# v1\.4\.0 — 收容行动整备$|^# v1\.5\.0 — SCP-049：疫医狂潮$|不是画面重制|外科狂热|在线 Demo 尚未核对|2f9c28534d6b99f0f0996f44bb236ecb235e8d4f|c92da05d8c8c066c462b08c3b6db21bee877d31b" docs/releases/v1.4.0.md docs/releases/v1.5.0.md
git diff --check -- docs/releases/v1.4.0.md docs/releases/v1.5.0.md
~~~

Expected: 两个新标题和所有边界事实均可定位；diff check 无输出。

- [ ] **Step 5: 提交 Release 文案源**

Run:

~~~powershell
git add -- docs/releases/v1.4.0.md docs/releases/v1.5.0.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: rewrite release notes for players"
~~~

Expected: staged list 只有两份 Release 文案，commit 成功。

---

### Task 2: 同步所有当前公开版本入口

**Files:**
- Modify: `README.md:13`
- Modify: `README.en.md:13`
- Modify: `CHANGELOG.md:14-33`
- Modify: `docs/project-status.md:7-8`
- Modify: `docs/README.md:17-18`

**Interfaces:**
- Consumes: Task 1 的公开标题、玩家摘要和发布边界。
- Produces: 中英文仓库入口、更新日志、项目状态和文档导航的一致版本名称。

- [ ] **Step 1: 确认旧公开名称仍存在于目标入口**

Run:

~~~powershell
$publicFiles = @('README.md','README.en.md','CHANGELOG.md','docs/project-status.md','docs/README.md')
rg -n "UI Foundation（回溯里程碑）|SCP-049 压力模型|the SCP-049 pressure model|retrospective UI Foundation milestone" $publicFiles
~~~

Expected: README、README.en、CHANGELOG、项目状态和文档索引都能定位旧名称。

- [ ] **Step 2: 更新中英文 README 顶部版本状态**

Replace `README.md:13` with:

~~~markdown
> **版本状态：** 最近正式版本为 `v1.5.0`（SCP-049：疫医狂潮），终局战加入外科狂热、弱点窗口、混合增援和会自我复制的敌潮；`v1.4.0`（收容行动整备）是面向启动、资源兜底和重复开局稳定性的回溯更新。在线 Demo 尚未核对是否与当前标签一致；UI/美术升级和 Windows Electron 客户端仍位于独立开发分支，未作为本版本发布内容。详见 [当前项目状态](./docs/project-status.md)。
~~~

Replace `README.en.md:13` with:

~~~markdown
> **Version status:** `v1.5.0` (SCP-049: Surgical Frenzy) is the latest formal release, adding a frenzy phase, a brief weakness window, mixed reinforcements, and self-replicating enemy pressure to the final encounter. `v1.4.0` (Containment Readiness) is a retrospective stability update for startup, resource fallback, and repeated restarts. The online demo has not been verified against the current tag; the UI/art overhaul and Windows Electron client remain unreleased on separate development branches. See [current project status](./docs/project-status.md).
~~~

- [ ] **Step 3: 更新 CHANGELOG 的 v1.4.0 与 v1.5.0 区块**

Replace `CHANGELOG.md:14-33` with:

~~~markdown
## [1.5.0] — SCP-049：疫医狂潮

六分钟终局战加入外科狂热、弱点窗口、混合增援和会自我复制的敌潮，玩家需要在清场与集中攻击 SCP-049 之间快速取舍。

### 玩法与规则
- SCP-049 使用 `normal → frenzy → normal → dying` 状态机；狂热阶段停止移动、混合召唤并开放 1.35 倍弱点承伤窗口，统一限制为 2.0 倍承伤上限。
- 所有非 Boss 敌人获得 6–9 秒递归复制规则，并共享 230 个活动敌人硬上限。

### 测试与工程
- 新增 11 个终局战与敌人复制规则的 Node 回归测试。
- GitHub Actions 在构建前运行 `node --test`。

### 发布边界
- 多平台与 Windows PoC 仍是独立计划和分支；UI/Art、角色动画与橘色角色路线未发布。
- 在线 Demo 未验证与 `v1.5.0` 标签相同，不得视为已部署本版本。

---

## [1.4.0] — 收容行动整备

这是面向启动、资源兜底和重复开局稳定性的回溯更新，不是画面重制或新玩法版本。

- 统一资源加载入口，在素材缺失时继续提供程序化画面与合成音效。
- 修复 restart 后监听器累积，并保持现有玩法、HUD 和音效表现不变。
- `v1.4.0` 标签固定指向 `2f9c28534d6b99f0f0996f44bb236ecb235e8d4f`；本版本不包含正式 UI/美术素材、SCP-049 新终局战或 Windows 客户端。
~~~

- [ ] **Step 4: 更新项目状态和文档索引**

Replace `docs/project-status.md:7-8` with:

~~~markdown
- 最近正式版本：`v1.5.0`（SCP-049：疫医狂潮），终局战已加入狂热阶段、暴露承伤窗口、混合增援和敌人递归复制。
- 回溯里程碑：`v1.4.0`（收容行动整备），记录启动、资源 fallback、`AudioManager`、`UIManager` 与重复开局生命周期的稳定性基础。
~~~

Replace `docs/README.md:17-18` with:

~~~markdown
- [v1.4.0 — 收容行动整备](./releases/v1.4.0.md)
- [v1.5.0 — SCP-049：疫医狂潮](./releases/v1.5.0.md)
~~~

- [ ] **Step 5: 验证公开入口已消除旧标题且保持发布边界**

Run:

~~~powershell
$publicFiles = @('README.md','README.en.md','CHANGELOG.md','docs/project-status.md','docs/README.md','docs/releases/v1.4.0.md','docs/releases/v1.5.0.md')
rg -n "收容行动整备|Containment Readiness|SCP-049：疫医狂潮|SCP-049: Surgical Frenzy" $publicFiles
rg -n "在线 Demo.*未|online demo has not been verified|UI/Art|Windows" $publicFiles
$oldNames = rg -n "UI Foundation（回溯里程碑）|SCP-049 压力模型|the SCP-049 pressure model|retrospective UI Foundation milestone" $publicFiles
if ($LASTEXITCODE -eq 0) { $oldNames; throw 'old public release names remain' }
if ($LASTEXITCODE -gt 1) { throw 'old-name scan failed' }
git diff --check
~~~

Expected: 新名称和未发布边界可定位；旧公开名称扫描无输出；diff check 无输出。

- [ ] **Step 6: 提交公开入口同步**

Run:

~~~powershell
git add -- README.md README.en.md CHANGELOG.md docs/project-status.md docs/README.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: align public release names"
~~~

Expected: staged list 只有上述 5 个文档，commit 成功。

---

### Task 3: 完成本地发布门禁与范围审计

**Files:**
- Inspect: all tracked files and current Git history

**Interfaces:**
- Consumes: Tasks 1–2 的两个文档提交。
- Produces: 允许 push 和 GitHub Release 编辑的本地验证证据。

- [ ] **Step 1: 验证目标 Markdown 文件中的本地链接**

Run:

~~~powershell
$files = @('README.md','README.en.md','CHANGELOG.md','docs/README.md','docs/project-status.md','docs/releases/v1.4.0.md','docs/releases/v1.5.0.md','docs/superpowers/specs/2026-07-18-player-facing-release-copy-design.md')
$broken = foreach ($path in $files) {
  $file = Get-Item -LiteralPath $path
  $text = Get-Content -LiteralPath $path -Raw -Encoding utf8
  foreach ($match in [regex]::Matches($text, '\[[^\]]+\]\(([^)]+)\)')) {
    $target = $match.Groups[1].Value
    if ($target -match '^(https?://|mailto:|#)') { continue }
    $relative = ($target -split '#', 2)[0]
    if (-not $relative) { continue }
    $resolved = Join-Path $file.DirectoryName $relative
    if (-not (Test-Path -LiteralPath $resolved)) { "$path -> $target" }
  }
}
if ($broken) { $broken; throw 'broken local Markdown links' }
~~~

Expected: 无输出、退出码 0。

- [ ] **Step 2: 运行完整测试、构建和 whitespace 门禁**

Run:

~~~powershell
node --test
npm.cmd run build
git diff --check
git status --short --branch
~~~

Expected: 11/11 Node 测试通过；Vite 构建成功；允许现有的大 chunk warning；diff check 无输出；工作树没有未知修改。

- [ ] **Step 3: 审计实现范围与版本事实**

Run:

~~~powershell
git diff --stat c92da05..HEAD
git diff --name-only c92da05..HEAD
git log --reverse --oneline c92da05..HEAD
git rev-parse 'v1.4.0^{}'
git rev-parse 'v1.5.0^{}'
git status --short --branch
~~~

Expected: 相对已发布基线只包含设计、计划和 7 个批准文档；两个标签仍分别解析到 `2f9c28534d6b99f0f0996f44bb236ecb235e8d4f` 与 `c92da05d8c8c066c462b08c3b6db21bee877d31b`。

---

### Task 4: 推送 main 并更新两个现有 GitHub Release

**Files:**
- Read: `docs/releases/v1.4.0.md`
- Read: `docs/releases/v1.5.0.md`
- External update: GitHub `v-t-x/scp-survivor` branch `main`
- External update: existing Releases `v1.4.0` and `v1.5.0`

**Interfaces:**
- Consumes: Task 3 的干净、已验证 HEAD 和两份 Release 文案源。
- Produces: 与仓库一致的公开 GitHub 页面；标签对象和 Release 发布状态保持不变。

- [ ] **Step 1: 在任何外部写入前刷新并核对远端**

Run:

~~~powershell
git fetch origin --prune --tags
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git merge-base --is-ancestor origin/main HEAD
git ls-remote origin refs/heads/main
git ls-remote --tags origin 'refs/tags/v1.4.0' 'refs/tags/v1.4.0^{}' 'refs/tags/v1.5.0' 'refs/tags/v1.5.0^{}'
gh auth status
gh release list --repo v-t-x/scp-survivor --limit 20
~~~

Expected: `origin/main` 和远端 `main` 仍为 `c92da05d8c8c066c462b08c3b6db21bee877d31b`；它是当前 HEAD 的祖先；worktree 干净；两个远端 peeled tag 目标未变化；两个 Release 已存在；认证账户为 `v-t-x`。

- [ ] **Step 2: 普通快进推送 main 并反查远端 HEAD**

Run:

~~~powershell
$publishHead = git rev-parse HEAD
git push origin main:main
if ($LASTEXITCODE -ne 0) { throw 'pushing main failed' }
git fetch origin --prune
$originHead = git rev-parse origin/main
$remoteLine = git ls-remote origin refs/heads/main
$remoteHead = $remoteLine.Split([char]9)[0]
if ($originHead -ne $publishHead -or $remoteHead -ne $publishHead) { throw 'remote main verification failed' }
~~~

Expected: 非强制 push 成功；`origin/main` 和 GitHub 广告的 `main` 都等于 `$publishHead`。

- [ ] **Step 3: 从源文件生成无重复标题的 GitHub 正文**

Run:

~~~powershell
function Get-ReleaseBody([string]$path) {
  $raw = Get-Content -Raw -Encoding utf8 -LiteralPath $path
  $heading = [regex]::new('\A# [^\r\n]+\r?\n\r?\n')
  $body = $heading.Replace($raw, '', 1).TrimEnd()
  if ($body -eq $raw.TrimEnd()) { throw "missing leading H1 in $path" }
  return $body
}
$v14Body = Get-ReleaseBody 'docs/releases/v1.4.0.md'
$v15Body = Get-ReleaseBody 'docs/releases/v1.5.0.md'
if (-not $v14Body.StartsWith('这是一次面向稳定性的回溯更新')) { throw 'unexpected v1.4.0 body start' }
if (-not $v15Body.StartsWith('六分钟生存战的终点现在更加危险')) { throw 'unexpected v1.5.0 body start' }
~~~

Expected: 两个变量都以玩家摘要开头，正文不再重复一级标题。

- [ ] **Step 4: 顺序更新两个现有 GitHub Release**

Run:

~~~powershell
function Get-ReleaseBody([string]$path) {
  $raw = Get-Content -Raw -Encoding utf8 -LiteralPath $path
  $heading = [regex]::new('\A# [^\r\n]+\r?\n\r?\n')
  $body = $heading.Replace($raw, '', 1).TrimEnd()
  if ($body -eq $raw.TrimEnd()) { throw "missing leading H1 in $path" }
  return $body
}
$v14Body = Get-ReleaseBody 'docs/releases/v1.4.0.md'
$v15Body = Get-ReleaseBody 'docs/releases/v1.5.0.md'
gh release edit v1.4.0 --repo v-t-x/scp-survivor --title 'v1.4.0 — 收容行动整备' --notes $v14Body
if ($LASTEXITCODE -ne 0) { throw 'updating v1.4.0 Release failed' }
gh release edit v1.5.0 --repo v-t-x/scp-survivor --title 'v1.5.0 — SCP-049：疫医狂潮' --notes $v15Body
if ($LASTEXITCODE -ne 0) { throw 'updating v1.5.0 Release failed' }
~~~

Expected: 两个命令分别返回对应 Release URL。若第二个更新失败，不删除或重建第一个 Release；修复失败原因后只重试未完成项。

- [ ] **Step 5: 从 GitHub API 反查标题、正文和发布状态**

Run:

~~~powershell
function Get-ReleaseBody([string]$path) {
  $raw = Get-Content -Raw -Encoding utf8 -LiteralPath $path
  $heading = [regex]::new('\A# [^\r\n]+\r?\n\r?\n')
  $body = $heading.Replace($raw, '', 1).TrimEnd()
  if ($body -eq $raw.TrimEnd()) { throw "missing leading H1 in $path" }
  return $body
}
$v14Body = Get-ReleaseBody 'docs/releases/v1.4.0.md'
$v15Body = Get-ReleaseBody 'docs/releases/v1.5.0.md'
$v14 = (gh api repos/v-t-x/scp-survivor/releases/tags/v1.4.0 | Out-String) | ConvertFrom-Json
$v15 = (gh api repos/v-t-x/scp-survivor/releases/tags/v1.5.0 | Out-String) | ConvertFrom-Json
$releaseList = (gh release list --repo v-t-x/scp-survivor --limit 20 --json tagName,isDraft,isPrerelease,isLatest,name | Out-String) | ConvertFrom-Json
$v15List = $releaseList | Where-Object { $_.tagName -eq 'v1.5.0' }
if ($v14.name -ne 'v1.4.0 — 收容行动整备') { throw 'v1.4.0 title mismatch' }
if ($v15.name -ne 'v1.5.0 — SCP-049：疫医狂潮') { throw 'v1.5.0 title mismatch' }
if ($v14.draft -or $v14.prerelease -or $v15.draft -or $v15.prerelease) { throw 'release publication state changed' }
if (-not $v15List.isLatest) { throw 'v1.5.0 is no longer Latest' }
$crlf = [string]([char]13) + [string]([char]10)
$lf = [string]([char]10)
$cr = [string]([char]13)
$v14Remote = ([string]$v14.body).Replace($crlf,$lf).Replace($cr,$lf).TrimEnd()
$v15Remote = ([string]$v15.body).Replace($crlf,$lf).Replace($cr,$lf).TrimEnd()
$v14Expected = $v14Body.Replace($crlf,$lf).Replace($cr,$lf).TrimEnd()
$v15Expected = $v15Body.Replace($crlf,$lf).Replace($cr,$lf).TrimEnd()
if ($v14Remote -cne $v14Expected) { throw 'v1.4.0 body mismatch' }
if ($v15Remote -cne $v15Expected) { throw 'v1.5.0 body mismatch' }
~~~

Expected: 标题和正文完全匹配；两份 Release 均非草稿、非预发布；`v1.5.0` 继续是 Latest。

- [ ] **Step 6: 最终核对标签、分支和工作树**

Run:

~~~powershell
git fetch origin --prune --tags
git rev-parse origin/main
git rev-parse 'v1.4.0^{}'
git rev-parse 'v1.5.0^{}'
git status --short --branch
gh release view v1.4.0 --repo v-t-x/scp-survivor --json name,url,isDraft,isPrerelease
gh release view v1.5.0 --repo v-t-x/scp-survivor --json name,url,isDraft,isPrerelease
~~~

Expected: `main` 与 `origin/main` 同步；标签目标仍为 `2f9c285…` 和 `c92da05…`；工作树干净；两个 URL 可访问且发布状态不变。
