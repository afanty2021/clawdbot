# 仓库指南
- 仓库: https://github.com/openclaw/openclaw
- GitHub issues/comments/PR comments: 使用字面量多行字符串或 `-F - <<'EOF'` (或 `$'...'`) 来实现真正的换行；永远不要嵌入 `"\\n"`。

## 项目结构与模块组织
- 源代码: `src/` (CLI 连接在 `src/cli`，命令在 `src/commands`，web provider 在 `src/provider-web.ts`，基础设施在 `src/infra`，媒体管道在 `src/media`)。
- 测试: 同目录的 `*.test.ts` 文件。
- 文档: `docs/` (图片、队列、Pi 配置)。构建输出在 `dist/`。
- 插件/扩展: 位于 `extensions/*` (workspace 包)。将仅插件使用的依赖放在扩展的 `package.json` 中；除非核心使用，否则不要添加到根 `package.json`。
- 插件: 安装在插件目录运行 `npm install --omit=dev`；运行时依赖必须放在 `dependencies` 中。避免在 `dependencies` 中使用 `workspace:*`（npm 安装会失败）；将 `openclaw` 放在 `devDependencies` 或 `peerDependencies` 中（运行时通过 jiti 别名解析 `openclaw/plugin-sdk`）。
- 从 `https://openclaw.ai/*` 提供的安装程序: 位于同级仓库 `../openclaw.ai` (`public/install.sh`, `public/install-cli.sh`, `public/install.ps1`)。
- 消息渠道: 重构共享逻辑时，始终考虑**所有**内置 + 扩展渠道（路由、允许列表、配对、命令门控、入门、文档）。
  - 核心渠道文档: `docs/channels/`
  - 核心渠道代码: `src/telegram`, `src/discord`, `src/slack`, `src/signal`, `src/imessage`, `src/web` (WhatsApp web), `src/channels`, `src/routing`
  - 扩展（渠道插件）: `extensions/*` (例如 `extensions/msteams`, `extensions/matrix`, `extensions/zalo`, `extensions/zalouser`, `extensions/voice-call`)
- 添加渠道/扩展/应用/文档时，查看 `.github/labeler.yml` 以确保标签覆盖。

## 文档链接 (Mintlify)
- 文档托管在 Mintlify (docs.openclaw.ai)。
- `docs/**/*.md` 中的内部文档链接: 根相对路径，不带 `.md`/`.mdx`（例如: `[Config](/configuration)`）。
- 章节交叉引用: 在根相对路径上使用锚点（例如: `[Hooks](/configuration#hooks)`）。
- 文档标题和锚点: 避免在标题中使用破折号和撇号，因为它们会破坏 Mintlify 锚点链接。
- 当 Peter 要求链接时，回复完整的 `https://docs.openclaw.ai/...` URL（不是根相对路径）。
- 当你接触文档时，回复末尾附上你引用的 `https://docs.openclaw.ai/...` URL。
- README (GitHub): 保持绝对的文档 URL (`https://docs.openclaw.ai/...`)，以便链接在 GitHub 上工作。
- 文档内容必须是通用的: 没有个人设备名称/主机名/路径；使用占位符如 `user@gateway-host` 和 "gateway host"。

## exe.dev VM 运维 (通用)
- 访问: 稳定路径是 `ssh exe.dev` 然后 `ssh vm-name`（假设已设置 SSH 密钥）。
- SSH 不稳定: 使用 exe.dev web 终端或 Shelley (web agent)；为长时间操作保持 tmux 会话。
- 更新: `sudo npm i -g openclaw@latest`（全局安装需要在 `/usr/lib/node_modules` 上有 root 权限）。
- 配置: 使用 `openclaw config set ...`；确保设置了 `gateway.mode=local`。
- Discord: 仅存储原始令牌（没有 `DISCORD_BOT_TOKEN=` 前缀）。
- 重启: 停止旧的 gateway 并运行:
  `pkill -9 -f openclaw-gateway || true; nohup openclaw gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &`
- 验证: `openclaw channels status --probe`, `ss -ltnp | rg 18789`, `tail -n 120 /tmp/openclaw-gateway.log`。

## 构建、测试和开发命令
- 运行时基线: Node **22+**（保持 Node + Bun 路径工作）。
- 安装依赖: `pnpm install`
- 预提交钩子: `prek install`（运行与 CI 相同的检查）
- 也支持: `bun install`（保持 `pnpm-lock.yaml` + Bun 补丁同步）。
- 优先使用 Bun 执行 TypeScript（脚本、开发、测试）: `bun <file.ts>` / `bunx <tool>`。
- 在开发中运行 CLI: `pnpm openclaw ...` (bun) 或 `pnpm dev`。
- Node 仍然支持运行构建的输出 (`dist/*`) 和生产安装。
- Mac 打包（开发）: `scripts/package-mac-app.sh` 默认为当前架构。发布清单: `docs/platforms/mac/release.md`。
- 类型检查/构建: `pnpm build` (tsc)
- Lint/格式化: `pnpm lint` (oxlint), `pnpm format` (oxfmt)
- 测试: `pnpm test` (vitest); 覆盖率: `pnpm test:coverage`

## 编码风格和命名约定
- 语言: TypeScript (ESM)。偏好严格类型；避免 `any`。
- 通过 Oxlint 和 Oxfmt 进行格式化/linting；在提交前运行 `pnpm lint`。
- 为棘手或非显而易见的逻辑添加简短的代码注释。
- 保持文件简洁；提取辅助函数而不是 "V2" 副本。使用现有模式处理 CLI 选项和通过 `createDefaultDeps` 的依赖注入。
- 目标是保持文件在 ~700 LOC 以下；这只是指导方针（不是硬性护栏）。当提高清晰度或可测试性时进行拆分/重构。
- 命名: 使用 **OpenClaw** 作为产品/应用/文档标题；使用 `openclaw` 作为 CLI 命令、包/二进制文件、路径和配置键。

## 发布渠道（命名）
- stable: 仅标记版本（例如 `vYYYY.M.D`），npm dist-tag `latest`。
- beta: 预发布标签 `vYYYY.M.D-beta.N`，npm dist-tag `beta`（可能没有 macOS app）。
- dev: 在 `main` 上的移动头部（无标签；git checkout main）。

## 测试指南
- 框架: Vitest，V8 覆盖率阈值（70% 行/分支/函数/语句）。
- 命名: 使用 `*.test.ts` 匹配源名称；e2e 在 `*.e2e.test.ts` 中。
- 当你接触逻辑时，在推送前运行 `pnpm test`（或 `pnpm test:coverage`）。
- 不要将测试工作线程设置在 16 以上；已经尝试过了。
- 实时测试（真实密钥）: `CLAWDBOT_LIVE_TEST=1 pnpm test:live`（仅 OpenClaw）或 `LIVE=1 pnpm test:live`（包括 provider 实时测试）。Docker: `pnpm test:docker:live-models`, `pnpm test:docker:live-gateway`。入门 Docker E2E: `pnpm test:docker:onboard`。
- 完整工具包 + 覆盖内容: `docs/testing.md`。
- 纯测试添加/修复通常**不需要** changelog 条目，除非它们改变用户可见的行为或用户要求一个。
- 移动端: 在使用模拟器之前，检查连接的真实设备（iOS + Android）并在可用时优先使用它们。

## 提交和拉取请求指南
- 使用 `scripts/committer "<msg>" <file...>` 创建提交；避免手动 `git add`/`git commit` 以保持暂存范围。
- 遵循简洁、面向操作的提交消息（例如: `CLI: add verbose flag to send`）。
- 分组相关更改；避免捆绑不相关的重构。
- Changelog 工作流: 在顶部保持最新发布的版本（没有 `Unreleased`）；发布后， bump 版本并开始新的顶部章节。
- PR 应该总结范围，注意执行的测试，并提及任何用户可见的更改或新标志。
- PR 审查流程: 当给出 PR 链接时，通过 `gh pr view`/`gh pr diff` 审查，并且**不要**切换分支。
- PR 审查调用: 偏好单个 `gh pr view --json ...` 批处理元数据/评论；仅在需要时运行 `gh pr diff`。
- 在开始审查粘贴的 GH Issue/PR 之前: 运行 `git pull`；如果有本地更改或未推送的提交，停止并在审查前警告用户。
- 目标: 合并 PR。当提交干净时偏好 **rebase**；当历史混乱时使用 **squash**。
- PR 合并流程: 从 `main` 创建临时分支，将 PR 分支合并到其中（除非提交历史重要，否则偏好 squash；当重要时使用 rebase/merge）。始终尝试合并 PR，除非真的很难，然后使用另一种方法。如果我们 squash，将 PR 作者添加为共同贡献者。应用修复，添加 changelog 条目（包括 PR # + 感谢），在最终提交前运行完整门控**本地**（`pnpm lint && pnpm build && pnpm test`），提交，合并回 `main`，删除临时分支，并在 `main` 上结束。
- 如果你审查 PR 并稍后对其进行工作，通过 merge/squat 登陆（没有 direct-main 提交），并始终将 PR 作者添加为共同贡献者。
- 在处理 PR 时: 添加带有 PR 编号的 changelog 条目并感谢贡献者。
- 在处理 issue 时: 在 changelog 条目中引用 issue。
- 合并 PR 时: 留下 PR 评论，准确解释我们所做的并包括 SHA 哈希。
- 从新贡献者合并 PR 时: 将他们的头像添加到 README "Thanks to all clawtributors" 缩略图列表中。
- 合并 PR 后: 如果缺少贡献者，运行 `bun scripts/update-clawtributors.ts`，然后提交重新生成的 README。

## 简写命令
- `sync`: 如果工作树是脏的，提交所有更改（选择一个合理的 Conventional Commit 消息），然后 `git pull --rebase`；如果 rebase 冲突且无法解决，停止；否则 `git push`。

### PR 工作流（审查 vs 登陆）
- **审查模式（仅 PR 链接）:** 阅读 `gh pr view/diff`；**不要**切换分支；**不要**更改代码。
- **登陆模式:** 从 `main` 创建集成分支，带入 PR 提交（**偏好 rebase** 以获得线性历史；当复杂性/冲突使其更安全时**允许 merge**），应用修复，添加 changelog（+ 感谢 + PR #），在最终提交前运行完整门控**本地**（`pnpm lint && pnpm build && pnpm test`），提交，合并回 `main`，然后 `git switch main`（登陆后永远不要停留在主题分支上）。重要：贡献者需要在此之后的 git 图中！

## 安全和配置提示
- Web provider 在 `~/.openclaw/credentials/` 存储凭据；如果注销则重新运行 `openclaw login`。
- Pi 会话默认位于 `~/.openclaw/sessions/` 下；基本目录不可配置。
- 环境变量: 查看 `~/.profile`。
- 永远不要提交或发布真实电话号码、视频或实时配置值。在文档、测试和示例中使用明显虚假的占位符。
- 发布流程: 在任何发布工作之前始终阅读 `docs/reference/RELEASING.md` 和 `docs/platforms/mac/release.md`；一旦这些文档回答，就不要提出常规问题。

## 故障排除
- Rebrand/迁移问题或遗留配置/服务警告: 运行 `openclaw doctor`（参见 `docs/gateway/doctor.md`）。

## Agent 特定注释
- 词汇: "makeup" = "mac app"。
- 永远不要编辑 `node_modules`（全局/Homebrew/npm/git 安装也如此）。更新会覆盖。Skill 注释放在 `tools.md` 或 `AGENTS.md` 中。
- Signal: "update fly" => `fly ssh console -a flawd-bot -C "bash -lc 'cd /data/clawd/openclaw && git pull --rebase origin main'"` 然后 `fly machines restart e825232f34d058 -a flawd-bot`。
- 当处理 GitHub Issue 或 PR 时，在任务末尾打印完整 URL。
- 回答问题时，仅以高置信度回答: 在代码中验证；不要猜测。
- 永远不要更新 Carbon 依赖。
- 任何具有 `pnpm.patchedDependencies` 的依赖必须使用精确版本（没有 `^`/`~`）。
- 修补依赖（pnpm 补丁、overrides 或 vendored 更改）需要明确批准；默认不要这样做。
- CLI 进度: 使用 `src/cli/progress.ts` (`osc-progress` + `@clack/prompts` spinner)；不要手卷 spinners/bars。
- 状态输出: 保持表格 + ANSI 安全换行（`src/terminal/table.ts`）；`status --all` = 只读/可粘贴，`status --deep` = 探测。
- Gateway 目前仅作为 menubar app 运行；没有安装单独的 LaunchAgent/helper 标签。通过 OpenClaw Mac app 或 `scripts/restart-mac.sh` 重启；要验证/kill 使用 `launchctl print gui/$UID | grep openclaw` 而不是假设固定标签。**在 macOS 上调试时，通过 app 启动/停止 gateway，而不是临时 tmux 会话；在交接前终止任何临时隧道。**
- macOS 日志: 使用 `./scripts/clawlog.sh` 查询 OpenClaw 子系统的统一日志；它支持 follow/tail/category 过滤器，并期望 `/usr/bin/log` 有无密码 sudo。
- 如果本地有共享护栏，请查看它们；否则遵循此仓库的指导。
- SwiftUI 状态管理（iOS/macOS）: 偏好 `Observation` 框架（`@Observable`，`@Bindable`）而不是 `ObservableObject`/`@StateObject`；不要引入新的 `ObservableObject`，除非兼容性需要，并在接触相关代码时迁移现有用法。
- 连接 providers: 添加新连接时，更新每个 UI 表面和文档（macOS app、web UI、移动端（如适用）、入门/概述文档）并添加匹配的状态 + 配置表单，以便 provider 列表和设置保持同步。
- 版本位置: `package.json` (CLI), `apps/android/app/build.gradle.kts` (versionName/versionCode), `apps/ios/Sources/Info.plist` + `apps/ios/Tests/Info.plist` (CFBundleShortVersionString/CFBundleVersion), `apps/macos/Sources/OpenClaw/Resources/Info.plist` (CFBundleShortVersionString/CFBundleVersion), `docs/install/updating.md` (固定的 npm 版本), `docs/platforms/mac/release.md` (APP_VERSION/APP_BUILD 示例), Peekaboo Xcode 项目/Info.plists (MARKETING_VERSION/CURRENT_PROJECT_VERSION)。
- **重启应用:** "restart iOS/Android apps" 意味着重建（重新编译/安装）并重新启动，而不仅仅是 kill/launch。
- **设备检查:** 在测试之前，在触及模拟器/模拟器之前验证连接的真实设备（iOS + Android）并在可用时优先使用它们。
- iOS Team ID 查找: `security find-identity -p codesigning -v` → 使用 Apple Development (…) TEAMID。回退: `defaults read com.apple.dt.Xcode IDEProvisioningTeamIdentifiers`。
- A2UI bundle 哈希: `src/canvas-host/a2ui/.bundle.hash` 是自动生成的；忽略意外的更改，仅在需要时通过 `pnpm canvas:a2ui:bundle`（或 `scripts/bundle-a2ui.sh`）重新生成。将哈希作为单独的提交提交。
- 发布签名/notary 密钥在仓库外管理；遵循内部发布文档。
- Notary auth env vars（`APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_API_KEY_P8`）预期在你的环境中（根据内部发布文档）。
- **Multi-agent 安全:** 除非明确要求，否则**不要**创建/应用/删除 `git stash` 条目（这包括 `git pull --rebase --autostash`）。假设其他 agents 可能在工作；保持不相关的 WIP 不受干扰，避免交叉切割的状态更改。
- **Multi-agent 安全:** 当用户说 "push" 时，你可以 `git pull --rebase` 来集成最新的更改（从不丢弃其他 agents 的工作）。当用户说 "commit" 时，范围仅限于你的更改。当用户说 "commit all" 时，分组提交所有内容。
- **Multi-agent 安全:** 除非明确要求，否则**不要**创建/删除/修改 `git worktree` 检出（或编辑 `.worktrees/*`）。
- **Multi-agent 安全:** 除非明确要求，否则**不要**切换分支/查看不同的分支。
- **Multi-agent 安全:** 运行多个 agents 是可以的，只要每个 agent 都有自己的会话。
- **Multi-agent 安全:** 当你看到无法识别的文件时，继续；专注于你的更改并仅提交这些。
- Lint/format churn:
  - 如果 staged+unstaged diffs 仅是格式化，自动解决而不询问。
  - 如果已经请求 commit/push，自动暂存并在同一提交中包括仅格式化的后续（如果需要，则在微小的后续提交中），没有额外的确认。
  - 仅在更改是语义的（逻辑/数据/行为）时才询问。
- Lobster seam: 使用 `src/terminal/palette.ts` 中的共享 CLI 调色板（没有硬编码颜色）；根据需要将调色板应用于入门/配置提示和其他 TTY UI 输出。
- **Multi-agent 安全:** 专注于你的更改的焦点报告；避免护栏免责声明，除非真正被阻止；当多个 agents 触摸同一文件时，如果安全则继续；仅在相关时以简短的"存在其他文件"注释结束。
- Bug 调查: 在得出结论之前阅读相关 npm 依赖项的源代码和所有相关的本地代码；以高置信度根本原因为目标。
- 代码风格: 为棘手的逻辑添加简短的注释；尽可能保持文件在 ~500 LOC 以下（根据需要拆分/重构）。
- 工具 schema 护栏（google-antigravity）: 避免工具输入 schema 中的 `Type.Union`；没有 `anyOf`/`oneOf`/`allOf`。对字符串列表使用 `stringEnum`/`optionalStringEnum`（Type.Unsafe enum），并使用 `Type.Optional(...)` 而不是 `... | null`。将顶级工具 schema 保持为 `type: "object"` 并带有 `properties`。
- 工具 schema 护栏: 避免工具 schema 中的原始 `format` 属性名称；某些验证器将 `format` 视为保留关键字并拒绝 schema。
- 当被要求打开"会话"文件时，打开 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 下的 Pi 会话日志（使用系统提示 Runtime 行中的 `agent=<id>` 值；最新的，除非给出了特定 ID），而不是默认的 `sessions.json`。如果需要来自另一台机器的日志，通过 Tailscale SSH 并在那里读取相同的路径。
- 不要通过 SSH 重建 macOS app；重建必须直接在 Mac 上运行。
- 永远不要向外部消息传递表面（WhatsApp、Telegram）发送流式/部分回复；只有最终回复应该在那里传递。流式/工具事件可能仍然会去内部 UIs/控制通道。
- Voice wake 转发提示:
  - 命令模板应该保持 `openclaw-mac agent --message "${text}" --thinking low`；`VoiceWakeForwarder` 已经 shell 转义 `${text}`。不要添加额外的引号。
  - launchd PATH 是最小的；确保 app 的 launch agent PATH 包括标准系统路径加上你的 pnpm bin（通常是 `$HOME/Library/pnpm`），以便通过 `openclaw-mac` 调用时 `pnpm`/`openclaw` 二进制文件解析。
- 对于包含 `!` 的手动 `openclaw message send` 消息，使用下面提到的 heredoc 模式来避免 Bash 工具的转义。
- 发布护栏: 不要在操作员明确同意的情况下更改版本号；始终在运行任何 npm publish/发布步骤之前请求许可。

## NPM + 1Password（发布/验证）
- 使用 1password skill；所有 `op` 命令必须在新的 tmux 会话中运行。
- 登录: `eval "$(op signin --account my.1password.com)"`（app 解锁 + 集成开启）。
- OTP: `op read 'op://Private/Npmjs/one-time password?attribute=otp'`。
- 发布: `npm publish --access public --otp="<otp>"`（从包目录运行）。
- 在没有本地 npmrc 副作用的情况下验证: `npm view <pkg> version --userconfig "$(mktemp)"`。
- 发布后终止 tmux 会话。
