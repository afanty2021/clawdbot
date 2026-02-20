# OpenClaw 中文界面扩展 (extensions/openclaw-zh-cn-ui/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **openclaw-zh-cn-ui**

## 模块职责

提供 OpenClaw 用户界面的中文（简体中文）本地化翻译，使中文用户能够以母语使用 OpenClaw 的各项功能。

> **注意**：此扩展为占位符实现，当前仅有文档结构。实际功能开发需要实现翻译文件管理和 UI 集成逻辑。

## 目录结构

```
extensions/openclaw-zh-cn-ui/
├── CLAUDE.md           # 本文档
└── src/
    └── CLAUDE.md       # 源代码文档
```

### 标准扩展结构（参考）

```
extensions/openclaw-zh-cn-ui/
├── index.ts           # 插件入口
├── package.json       # 插件清单
├── openclaw.plugin.json # 插件配置
├── README.md         # 使用说明
└── src/
    ├── runtime.ts    # 运行时实现
    ├── i18n.ts       # 国际化核心
    └── locales/
        └── zh-CN.json # 中文翻译文件
```

## 本地化概述

### 支持的语言

| 语言代码 | 语言名称 | 状态 |
|---------|---------|------|
| `en` | English | 默认 |
| `zh-CN` | 简体中文 | 开发中 |
| `zh-TW` | 繁体中文 | 计划中 |
| `ja` | 日本語 | 计划中 |

### 本地化范围

- **CLI 界面**：命令行输出、帮助文本、错误信息
- **Web UI**：WebChat 控制界面
- **桌面应用**：macOS/iOS/Android 原生界面
- **通知消息**：系统通知、邮件模板
- **文档**：用户指南、错误消息

## 翻译文件结构

### JSON 格式

```json
{
  "app": {
    "name": "OpenClaw",
    "tagline": "您的个人 AI 助手"
  },
  "nav": {
    "home": "首页",
    "chat": "对话",
    "settings": "设置",
    "plugins": "插件"
  },
  "chat": {
    "placeholder": "输入消息...",
    "send": "发送",
    "thinking": "思考中...",
    "error": "发送失败"
  },
  "settings": {
    "title": "设置",
    "general": "通用",
    "appearance": "外观",
    "notifications": "通知",
    "language": "语言",
    "model": "模型"
  },
  "errors": {
    "network": "网络错误，请检查连接",
    "auth": "认证失败，请重新登录",
    "unknown": "发生未知错误"
  }
}
```

### 嵌套结构

```
zh-CN.json
├── common/           # 通用词汇
│   ├── ok: "确定"
│   ├── cancel: "取消"
│   ├── save: "保存"
│   └── delete: "删除"
├── cli/              # CLI 相关
│   ├── commands: ...
│   ├── options: ...
│   └── examples: ...
├── ui/               # UI 相关
│   ├── nav: ...
│   ├── chat: ...
│   └── settings: ...
└── messages/         # 消息相关
    ├── errors: ...
    ├── warnings: ...
    └── success: ...
```

## 运行时设计

### I18nRuntime 接口

```typescript
interface I18nRuntime {
  // 语言管理
  locale: {
    getCurrent(): string;
    setLocale(locale: string): Promise<void>;
    getAvailable(): LocaleInfo[];
  };

  // 翻译
  t: {
    translate(key: string, params?: Record<string, string>): string;
    plural(key: string, count: number): string;
    choice(key: string, choice: number): string;
  };

  // 格式化
  format: {
    date(date: Date, format?: string): string;
    time(time: Date, format?: string): string;
    number(num: number, format?: string): string;
    currency(amount: number, currency: string): string;
  };
}
```

### 翻译函数

```typescript
// 基本翻译
t("nav.home") // => "首页"

// 带参数
t("welcome.name", { name: "张三" }) // => "欢迎，张三！"

// 复数形式
t("messages.count", 5) // => "5 条消息"

// 选择形式
t("rating.stars", 3) // => "★★★☆☆
```

## 启用与配置

### 启用插件
```bash
openclaw plugins enable openclaw-zh-cn-ui
```

### 设置语言
```bash
# 设置为中文
openclaw config set locale zh-CN

# 查看当前语言
openclaw config get locale
```

### 配置示例
```json
{
  "i18n": {
    "enabled": true,
    "defaultLocale": "zh-CN",
    "fallbackLocale": "en",
    "autoDetect": true
  }
}
```

## 前端集成

### Web UI 集成

```typescript
// 在 React/Vue 组件中使用
import { useTranslation } from '@openclaw/i18n';

function ChatInput() {
  const { t } = useTranslation();

  return (
    <input placeholder={t("chat.placeholder")} />
  );
}
```

### CLI 集成

```typescript
// 在 CLI 中使用
import { t, setLocale } from '@openclaw/i18n-cli';

async function main() {
  await setLocale('zh-CN');

  console.log(t("cli.starting"));
  // 输出: "正在启动..."
}
```

## 翻译贡献指南

### 添加新翻译

1. 编辑 `src/locales/zh-CN.json`
2. 添加新的键值对
3. 运行测试验证

### 翻译流程

```bash
# 1. 提取需要翻译的键
pnpm i18n:extract

# 2. 翻译缺失的键
pnpm i18n:translate

# 3. 验证翻译
pnpm i18n:validate

# 4. 测试
pnpm test i18n
```

### 命名规范

- **键名**：使用点分隔的小写字母
  - ✅ `nav.home`
  - ❌ `navHome`
  - ❌ `nav-home`

- **值**：首字母大写（针对句子）
  - ✅ `"发送消息"`
  - ❌ `"发送消息"`

## 测试

### 测试命令
```bash
# 运行翻译测试
pnpm test extensions/openclaw-zh-cn-ui

# 验证翻译完整性
pnpm i18n:check

# 检查未翻译的键
pnpm i18n:missing
```

### 测试用例

```typescript
import { t, setLocale } from '../i18n';

describe('zh-CN translations', () => {
  beforeAll(() => setLocale('zh-CN'));

  it('translates navigation', () => {
    expect(t('nav.home')).toBe('首页');
    expect(t('nav.chat')).toBe('对话');
  });

  it('handles pluralization', () => {
    expect(t('messages.count', 0)).toBe('没有消息');
    expect(t('messages.count', 1)).toBe('1 条消息');
    expect(t('messages.count', 5)).toBe('5 条消息');
  });

  it('handles interpolation', () => {
    expect(t('welcome.name', { name: '张三' })).toBe('欢迎，张三！');
  });
});
```

## 常见问题 (FAQ)

### Q: 如何添加新的语言？
A: 在 `src/locales/` 目录创建新的翻译文件（如 `ja.json`），然后在插件配置中注册。

### Q: 如何处理缺失的翻译？
A: 系统会自动回退到 `fallbackLocale`（默认英语）。可以运行 `pnpm i18n:missing` 查看缺失的翻译。

### Q: 是否支持 RTL（从右到左）语言？
A: 当前版本尚未支持 RTL 语言，如阿拉伯语、希伯来语。

### Q: 如何动态切换语言？
A: 使用 `setLocale()` 函数动态切换，UI 会立即更新。

### Q: 翻译文件有多大？
A: 完整的 zh-CN 翻译文件约包含 1000+ 个键值对。

## 相关文件

- `extensions/openclaw-zh-cn-ui/src/i18n.ts`（待实现）
- `extensions/openclaw-zh-cn-ui/src/locales/zh-CN.json`（待实现）

## 变更记录

### 2026-02-20 - 创建中文界面扩展文档
- ✅ 创建 `extensions/openclaw-zh-cn-ui/CLAUDE.md` 文档
- 📋 记录本地化架构和翻译文件结构
- 🔗 建立中文界面翻译导航

---

*提示：如需实现此扩展，请参考标准的 i18n 实践（如 i18next）和 OpenClaw UI 组件结构。*


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 17, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #4282 | 8:02 AM | 🔵 | OpenClaw Chinese UI localization extension project structure | ~346 |
</claude-mem-context>