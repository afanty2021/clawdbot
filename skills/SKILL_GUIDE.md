# 技能开发指南

[根目录](../CLAUDE.md) > **skills**

## 概述

OpenClaw 技能系统为 AI 代理提供专业领域能力。技能可以是 Python 脚本、Shell 脚本、TypeScript 代码或其他可执行程序。本指南将帮助您从零开始创建和发布技能。

## 技能类型

### 1. Python 技能

使用 Python 编写，支持丰富的库和框架。

### 2. Shell 技能

使用 Bash/Zsh 脚本，适合系统操作。

### 3. TypeScript 技能

使用 TypeScript 编写，与 OpenClaw 核心集成。

### 4. 混合技能

结合多种语言和工具。

## 技能结构

### 最小化技能结构

```
my-skill/
├── SKILL.md           # 技能文档（必需）
├── scripts/           # 执行脚本（必需）
│   └── main.py        # 主脚本
├── references/        # 参考文档（可选）
│   └── api.md
└── pyproject.toml     # Python 依赖（可选）
```

### 技能清单文件

**SKILL.md**:

````yaml
---
name: my-skill
description: My awesome skill
homepage: https://github.com/user/my-skill
metadata:
  openclaw:
    emoji: "✨"
    requires:
      bins: ["python3"]
      env: ["API_KEY"]
    primaryEnv: "API_KEY"
---

# ✨ My Skill

Brief description of what this skill does.

## Setup

```bash
cd {baseDir}
pip install -r requirements.txt
export API_KEY="your-key"
````

## Usage

Basic usage instructions...

````

## 创建 Python 技能

### 1. 初始化技能

```bash
cd skills
mkdir my-skill
cd my-skill
````

### 2. 创建技能文档

**SKILL.md**:

````yaml
---
name: my-skill
description: A Python skill example
metadata:
  openclaw:
    emoji: "🐍"
    requires:
      bins: ["python3"]
---

# 🐍 My Python Skill

A simple Python skill that demonstrates the basics.

## Setup

```bash
cd {baseDir}
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
````

## Usage

```bash
./scripts/main.py "Hello, World!"
```

## Parameters

- `message` (string): The message to process
- `--count` (int): Number of repetitions (default: 1)

## Example

```bash
./scripts/main.py "Test" --count 3
# Output: Test Test Test
```

````

### 3. 创建主脚本

**scripts/main.py**:
```python
#!/usr/bin/env python3
import argparse
import sys
import json

def main():
    parser = argparse.ArgumentParser(description="My Python Skill")
    parser.add_argument("message", help="Message to process")
    parser.add_argument("--count", type=int, default=1, help="Repetition count")
    args = parser.parse_args()

    # 处理输入
    result = " ".join([args.message] * args.count)

    # 输出结果（JSON 格式便于 AI 解析）
    output = {
        "success": True,
        "result": result,
        "count": args.count
    }

    print(json.dumps(output))

if __name__ == "__main__":
    main()
````

### 4. 设置可执行权限

```bash
chmod +x scripts/main.py
```

## 创建 Shell 技能

### 1. 创建脚本

**scripts/main.sh**:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 参数解析
MESSAGE="${1:-}"
COUNT="${2:-1}"

# 验证输入
if [[ -z "$MESSAGE" ]]; then
  echo '{"error": "message is required"}' >&2
  exit 1
fi

# 处理
RESULT=""
for ((i=0; i<COUNT; i++)); do
  RESULT+="$MESSAGE "
done

# 输出 JSON
cat <<EOF
{
  "success": true,
  "result": "$RESULT",
  "count": $COUNT
}
EOF
```

### 2. 设置可执行权限

```bash
chmod +x scripts/main.sh
```

## 创建 TypeScript 技能

### 1. 创建脚本

**scripts/main.ts**:

```typescript
#!/usr/bin/env -S tsx
import { parseArgs } from "node:util";

interface Result {
  success: boolean;
  result: string;
  count: number;
}

function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      count: {
        type: "string",
        default: "1",
      },
    },
  });

  const message = positionals[0];
  const count = parseInt(values.count as string, 10);

  if (!message) {
    console.error(JSON.stringify({ error: "message is required" }));
    process.exit(1);
  }

  const result = Array(count).fill(message).join(" ");

  const output: Result = {
    success: true,
    result,
    count,
  };

  console.log(JSON.stringify(output));
}

main();
```

## 技能最佳实践

### 1. 错误处理

```python
import sys
import json

try:
    # 尝试操作
    result = risky_operation()
except Exception as e:
    # 输出错误到 stderr
    print(json.dumps({
        "success": False,
        "error": str(e)
    }), file=sys.stderr)
    sys.exit(1)
```

### 2. 输出格式

统一使用 JSON 格式输出：

```python
def output(success, data=None, error=None):
    result = {
        "success": success
    }
    if data is not None:
        result["data"] = data
    if error is not None:
        result["error"] = error
    print(json.dumps(result))
```

### 3. 参数验证

```python
import argparse

def validate_args(args):
    if not args.message:
        raise ValueError("message is required")
    if args.count < 1:
        raise ValueError("count must be >= 1")
    if args.count > 100:
        raise ValueError("count must be <= 100")
```

### 4. 环境变量

```python
import os
import sys

def get_env_var(name, required=False):
    value = os.getenv(name)
    if required and not value:
        print(json.dumps({
            "error": f"{name} environment variable is required"
        }), file=sys.stderr)
        sys.exit(1)
    return value

api_key = get_env_var("API_KEY", required=True)
```

### 5. 依赖管理

**requirements.txt**:

```
requests>=2.31.0
python-dotenv>=1.0.0
```

**pyproject.toml**:

```toml
[project]
name = "my-skill"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.31.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0.0"]
```

## 技能测试

### 1. 单元测试

**tests/test_main.py**:

```python
import pytest
from scripts.main import process_message

def test_process_message():
    result = process_message("Hello", 3)
    assert result == "Hello Hello Hello"

def test_empty_message():
    with pytest.raises(ValueError):
        process_message("", 1)
```

### 2. 集成测试

```bash
# 测试脚本
./scripts/main.py "Test" --count 2

# 验证输出
./scripts/main.py "Test" --count 2 | jq '.success'
```

### 3. 运行测试

```bash
# Python 测试
pytest

# Shell 测试
bats tests/test_main.bats
```

## 技能发布

### 1. 本地测试

```bash
# 在技能目录中
cd skills/my-skill

# 测试脚本
./scripts/main.py "Test"

# 验证文档
cat SKILL.md
```

### 2. 添加到 OpenClaw

将技能复制到工作区：

```bash
cp -r my-skill ~/.config/openclaw/skills/
```

或在配置中启用：

```json
{
  "skills": {
    "my-skill": {
      "enabled": true
    }
  }
}
```

### 3. 分发技能

**选项 1: Git 仓库**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/user/my-skill
git push -u origin main
```

**选项 2: 压缩包**

```bash
tar czf my-skill.tar.gz my-skill/
```

**选项 3: npm 包**

```bash
npm init
npm publish
```

## 技能与 AI 交互

### 1. 工具集成

在扩展中注册技能为工具：

```typescript
api.registerTool(
  async (input) => {
    const { spawn } = await import("child_process");
    const result = await spawn("./scripts/main.py", [input.message]);
    return JSON.parse(result);
  },
  {
    name: "my_skill",
    description: "My custom skill",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
);
```

### 2. 对话流

设计技能时考虑对话流程：

1. **输入验证**: 检查必需参数
2. **处理**: 执行主要逻辑
3. **输出**: 返回结构化结果
4. **错误**: 提供清晰的错误消息

## 技能模板

### Python 模板

```python
#!/usr/bin/env python3
"""
My Skill Description
"""

import argparse
import json
import sys
from typing import Optional

def process(input: str, options: dict) -> dict:
    """主要处理逻辑"""
    return {
        "success": True,
        "result": f"Processed: {input}"
    }

def main():
    parser = argparse.ArgumentParser(description="My Skill")
    parser.add_argument("input", help="Input to process")
    parser.add_argument("--option", help="Optional parameter")
    args = parser.parse_args()

    try:
        result = process(args.input, {"option": args.option})
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Shell 模板

```bash
#!/usr/bin/env bash
set -euo pipefail

# 配置
INPUT="${1:-}"
OPTION="${2:-}"

# 验证
if [[ -z "$INPUT" ]]; then
  echo '{"error": "input is required"}' >&2
  exit 1
fi

# 处理
RESULT="Processed: $INPUT"

# 输出
cat <<EOF
{
  "success": true,
  "result": "$RESULT"
}
EOF
```

## 常见问题

### Q: 技能脚本无法执行？

A: 检查：

1. 脚本是否有可执行权限 (`chmod +x`)
2. Shebang 是否正确 (`#!/usr/bin/env python3`)
3. 依赖是否已安装

### Q: 如何调试技能？

A:

```bash
# 直接运行脚本
./scripts/main.py "debug" --verbose

# 查看 Python 错误
python3 scripts/main.py "debug" 2>&1

# 使用 JSON 验证输出
./scripts/main.py "debug" | jq .
```

### Q: 技能需要外部 API？

A: 在 SKILL.md 中声明环境变量：

```yaml
metadata:
  openclaw:
    requires:
      env: ["API_KEY", "API_URL"]
    primaryEnv: "API_KEY"
```

### Q: 如何处理大型输出？

A: 使用流式输出或分页：

```python
import json

def stream_output(data):
    for item in data:
        print(json.dumps(item))
        sys.stdout.flush()
```

## 相关资源

### 参考技能

- `skills/local-places/` - Python 技能示例
- `skills/tmux/` - Shell 技能示例
- `skills/github/` - TypeScript 技能示例

### 工具

- `skills/skill-creator/` - 技能创建器

### 文档

- [Python 文档](https://docs.python.org/)
- [Bash 参考手册](https://www.gnu.org/software/bash/manual/)

## 变更记录

### 2026-02-08 - 创建技能开发指南

- ✅ 创建 `skills/SKILL_GUIDE.md`
- 📋 添加各类技能开发教程
- 🔧 补充最佳实践和测试方法
- ❓ 添加常见问题解答
