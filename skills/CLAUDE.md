# AI 技能模块 (skills/)

[根目录](../CLAUDE.md) > **skills**

## 模块职责

AI 技能集，为 OpenClaw 助手提供专业领域能力和工具集成。

## 目录结构

```
skills/
├── 1password/         # 1Password 集成
├── apple-notes/       # Apple Notes
├── apple-reminders/   # Apple Reminders
├── bear-notes/        # Bear Notes
├── blogwatcher/       # 博文监控
├── blucli/            # Blucli
├── bluebubbles/       # BlueBubbles 控制
├── camsnap/           # 相机快照
├── canvas/            # Canvas 工具
├── clawhub/           # Clawhub
├── coding-agent/      # 编码代理
├── discord/           # Discord 动作
├── eightctl/          # Eightctl
├── food-order/        # 食物订购
├── gemini/            # Gemini 集成
├── gifgrep/           # GIF 搜索
├── github/            # GitHub 集成
├── gog/               # GOG 游戏
├── goplaces/          # Google Places
├── healthcheck/       # 健康检查
├── himalaya/          # Himalaya 邮件
├── imsg/              # iMessage 控制
├── local-places/      # 本地地点
├── mcporter/          # MC Porter
├── model-usage/       # 模型使用统计
├── nano-banana-pro/   # Nano Banana Pro
├── nano-pdf/          # Nano PDF
├── notion/            # Notion 集成
├── obsidian/          # Obsidian 集成
├── openai-image-gen/  # OpenAI 图像生成
├── openai-whisper/    # OpenAI Whisper
├── openai-whisper-api/# OpenAI Whisper API
├── openhue/           # OpenHue
├── oracle/            # Oracle
├── ordercli/          # Order CLI
├── peekaboo/          # Peekaboo
├── sag/               # SAG
├── session-logs/      # 会话日志
├── sherpa-onnx-tts/   # Sherpa ONNX TTS
├── skill-creator/     # 技能创建器
├── slack/             # Slack 集成
├── songsee/           # Songsee
├── sonoscli/          # Sonos CLI
├── spotify-player/    # Spotify 播放器
├── summarize/         # 摘要
├── things-mac/        # Things Mac
├── tmux/              # Tmux 控制
├── trello/            # Trello 集成
├── video-frames/      # 视频帧提取
├── voice-call/        # 语音通话
├── wacli/             # WhatsApp CLI
└── weather/           # 天气
```

## 技能分类

### 生产力工具

#### 1password/
- **描述**: 1Password 密码管理集成
- **功能**: 查询密码、安全笔记
- **类型**: Python 脚本

#### apple-notes/
- **描述**: Apple Notes 笔记管理
- **功能**: 创建、搜索、编辑笔记
- **类型**: TypeScript

#### apple-reminders/
- **描述**: Apple Reminders 提醒事项
- **功能**: 创建、管理提醒
- **类型**: TypeScript

#### bear-notes/
- **描述**: Bear Notes 集成
- **功能**: 笔记管理、标签
- **类型**: TypeScript

#### notion/
- **描述**: Notion 笔记和数据库
- **功能**: 页面操作、数据库查询
- **类型**: TypeScript

#### obsidian/
- **描述**: Obsidian 笔记集成
- **功能**: 笔记搜索、链接
- **类型**: TypeScript

#### things-mac/
- **描述**: Things 任务管理
- **功能**: 任务创建、查询
- **类型**: TypeScript

### 开发工具

#### coding-agent/
- **描述**: 编码助手技能
- **功能**: 代码生成、调试
- **类型**: TypeScript

#### github/
- **描述**: GitHub 集成
- **功能**: 仓库操作、Issue 管理
- **类型**: TypeScript

#### tmux/
- **描述**: Tmux 终端复用器
- **功能**: 会话管理、窗口控制
- **类型**: Shell 脚本

### 通讯集成

#### discord/
- **描述**: Discord 动作和操作
- **功能**: 消息发送、频道管理
- **类型**: TypeScript

#### slack/
- **描述**: Slack 集成
- **功能**: 消息发送、频道操作
- **类型**: TypeScript

#### imsg/
- **描述**: iMessage 控制
- **功能**: 消息发送、查询
- **类型**: TypeScript

#### wacli/
- **描述**: WhatsApp CLI
- **功能**: 消息发送、媒体上传
- **类型**: TypeScript

### 媒体与内容

#### openai-image-gen/
- **描述**: OpenAI 图像生成
- **功能**: DALL-E 图像创建
- **类型**: Python 脚本

#### openai-whisper/
- **描述**: OpenAI Whisper 本地
- **功能**: 音频转录
- **类型**: TypeScript

#### openai-whisper-api/
- **描述**: OpenAI Whisper API
- **功能**: 云端音频转录
- **类型**: Shell 脚本

#### sherpa-onnx-tts/
- **描述**: Sherpa ONNX TTS
- **功能**: 文本转语音
- **类型**: 二进制 + 脚本

#### video-frames/
- **描述**: 视频帧提取
- **功能**: 从视频提取帧
- **类型**: Shell 脚本

### 设备与家居

#### openhue/
- **描述**: Philips Hue 控制
- **功能**: 灯光控制、场景
- **类型**: TypeScript

#### sonoscli/
- **描述**: Sonos 音响控制
- **功能**: 播放控制、音量
- **类型**: TypeScript

#### spotify-player/
- **描述**: Spotify 播放器
- **功能**: 播放控制、播放列表
- **类型**: TypeScript

#### voice-call/
- **描述**: 语音通话
- **功能**: 发起通话、Twilio/Plivo
- **类型**: TypeScript

### 实用工具

#### weather/
- **描述**: 天气信息
- **功能**: 天气查询、预报
- **类型**: TypeScript

#### summarize/
- **描述**: 文本摘要
- **功能**: 内容摘要生成
- **类型**: TypeScript

#### food-order/
- **描述**: 食物订购
- **功能**: 订餐助手
- **类型**: TypeScript

#### healthcheck/
- **描述**: 健康检查
- **功能**: 系统健康监控
- **类型**: TypeScript

#### local-places/
- **描述**: 本地地点搜索
- **功能**: 地点查询、导航
- **类型**: Python 脚本

### 特殊工具

#### skill-creator/
- **描述**: 技能创建器
- **功能**: 创建新技能模板
- **类型**: Python 脚本

#### canvas/
- **描述**: Canvas 工具
- **功能**: Canvas 渲染控制
- **类型**: TypeScript

#### session-logs/
- **描述**: 会话日志
- **功能**: 查看和管理日志
- **类型**: TypeScript

## 技能结构

### 标准技能结构
```
skills/{skill-name}/
├── SKILL.md           # 技能文档
├── scripts/           # 执行脚本
│   └── *.py, *.sh, *.ts
├── references/        # 参考文档
│   └── *.md
└── pyproject.toml     # Python 依赖（如适用）
```

### 技能清单文件
- **`SKILL.md`** - 技能描述、用法、参数
- **`scripts/`** - 可执行脚本
- **`references/`** - API 文档和参考

## 技能开发

### 创建新技能
使用技能创建器：
```bash
cd skills/skill-creator
python scripts/init_skill.py <skill-name>
```

### 技能要求
- 必须有 `SKILL.md` 文档
- 脚本必须可执行
- 提供清晰的用法说明
- 处理错误和边界情况

### 技能测试
```bash
# 测试技能脚本
cd skills/{skill-name}
./scripts/script.sh --help

# 验证文档
cat SKILL.md
```

## 技能管理

### 内置技能
位于 `src/hooks/bundled/`，自动加载。

### 工作区技能
位于 `skills/`，用户自定义。

### 托管技能
从目录下载，集中管理。

### 技能加载
- 通过配置文件启用/禁用
- 支持依赖检查
- 版本管理

## 常见问题 (FAQ)

### Q: 如何创建新技能？
A: 使用 `skills/skill-creator/` 或手动创建技能目录结构。

### Q: 技能脚本用什么语言？
A: 支持 TypeScript、Python、Shell 脚本等。

### Q: 如何调试技能？
A: 直接运行技能脚本或通过会话日志查看输出。

### Q: 技能如何与 AI 代理交互？
A: 技能通过工具系统注册，代理可以调用技能脚本。

## 相关文件清单

### 核心技能
- `skills/1password/SKILL.md`
- `skills/github/SKILL.md`
- `skills/notion/SKILL.md`
- `skills/obsidian/SKILL.md`

### 开发工具
- `skills/skill-creator/SKILL.md`
- `skills/coding-agent/SKILL.md`

### 工具脚本
- `skills/tmux/scripts/find-sessions.sh`
- `skills/video-frames/scripts/frame.sh`

### Python 技能
- `skills/local-places/pyproject.toml`
- `skills/local-places/src/local_places/`

## 变更记录

### 2026-02-08 - 初始化技能模块文档
- ✅ 创建 `skills/CLAUDE.md` 文档
- 📋 记录 60+ 技能
- 🏷️ 按功能分类
- 🔗 建立技能导航
