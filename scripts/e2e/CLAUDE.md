# E2E 测试模块 (scripts/e2e/)

[根目录](../../CLAUDE.md) > **scripts/e2e**

## 模块职责

OpenClaw 的端到端测试系统，使用 Docker 容器化环境验证关键功能流程，包括安装向导、网关通信、插件加载、服务切换和二维码导入。

## 目录结构

```
scripts/e2e/
├── Dockerfile                      # 测试镜像定义
├── Dockerfile.qr-import            # QR 导入测试镜像
├── onboard-docker.sh               # 安装向导 E2E 测试
├── plugins-docker.sh               # 插件系统 E2E 测试
├── gateway-network-docker.sh       # 网关网络 E2E 测试
├── doctor-install-switch-docker.sh # 服务切换 E2E 测试
└── qr-import-docker.sh             # 二维码导入 E2E 测试
```

## 测试概述

### 测试架构

- **测试框架**: Shell 脚本 + Node.js 验证
- **容器化**: Docker 隔离环境
- **测试镜像**: `openclaw:local` 基础镜像
- **网络隔离**: 独立 Docker 网络

### 测试分类

| 测试类型 | 脚本文件 | 测试内容 | 耗时 |
|---------|---------|---------|------|
| **Onboarding** | `onboard-docker.sh` | 安装向导流程 | ~2 分钟 |
| **Plugins** | `plugins-docker.sh` | 插件加载和注册 | ~30 秒 |
| **Gateway Network** | `gateway-network-docker.sh` | 网关 WebSocket 通信 | ~20 秒 |
| **Doctor Switch** | `doctor-install-switch-docker.sh` | 安装方式切换 | ~15 秒 |
| **QR Import** | `qr-import-docker.sh` | 二维码配置导入 | ~5 秒 |

## Docker 测试环境

### 镜像构建

**基础镜像**: `node:22-bookworm`

**构建脚本**:
```bash
docker build -t openclaw:local -f scripts/e2e/Dockerfile .
```

**镜像内容**:
- Node.js 22 运行时
- Corepack (包管理器管理)
- 完整项目依赖
- 编译后的构建产物
- UI 构建产物

### 环境变量配置

```bash
# 配置目录
OPENCLAW_CONFIG_DIR=$HOME/.openclaw
OPENCLAW_WORKSPACE_DIR=$HOME/.openclaw/workspace

# 网关配置
OPENCLAW_GATEWAY_TOKEN=<token>
OPENCLAW_GATEWAY_PORT=18789

# 跳过选项
OPENCLAW_SKIP_CHANNELS=1
OPENCLAW_SKIP_GMAIL_WATCHER=1
OPENCLAW_SKIP_CRON=1
OPENCLAW_SKIP_CANVAS_HOST=1
```

## 测试场景详解

### 1. Onboarding E2E 测试

**文件**: `onboard-docker.sh`

**测试用例**:

1. **本地基本安装**
   - 快速启动向导 (`--flow quickstart`)
   - 跳过认证 (`--auth-choice skip`)
   - 配置文件验证
   - 工作区结构验证

2. **远程非交互安装**
   - 远程网关连接
   - Token 认证验证

3. **配置重置**
   - 远程配置替换本地
   - 配置清理验证

4. **向导交互模拟**
   ```bash
   send() {
     printf "%b" "$payload" >&3 2>/dev/null || true
   }

   wait_for_log() {
     local needle="$1"
     local timeout_s="${2:-45}"
     # ANSI 清理 + 紧凑匹配
   }
   ```

**运行方式**:
```bash
pnpm test:docker:onboard
```

### 2. Gateway Network E2E 测试

**文件**: `gateway-network-docker.sh`

**测试流程**:

1. 构建测试镜像
2. 创建专用 Docker 网络
3. 启动网关容器
4. 等待网关就绪
5. 客户端连接测试
6. 健康检查验证

**验证点**:
- ✅ 端口监听 (18789)
- ✅ WebSocket 连接成功
- ✅ 协议版本协商
- ✅ 认证成功
- ✅ 健康检查通过

**运行方式**:
```bash
pnpm test:docker:gateway-network
```

### 3. Plugins E2E 测试

**文件**: `plugins-docker.sh`

**插件类型测试**:

1. **本地插件**
   - 工具注册验证 (`registerTool`)
   - Gateway 方法验证 (`registerGatewayMethod`)
   - CLI 命令验证 (`registerCli`)
   - 服务注册验证 (`registerService`)

2. **TGZ 包安装**
   - tar.gz 包构建
   - 本地路径解析
   - 插件加载验证

3. **目录安装**
   - `plugins.load.paths` 配置
   - 文件系统依赖验证

4. **NPM Spec 安装**
   - `file:` 协议支持
   - 包解析验证

**测试插件示例**:
```javascript
module.exports = {
  id: "demo-plugin",
  name: "Demo Plugin",
  register(api) {
    api.registerTool(() => null, { name: "demo_tool" });
    api.registerGatewayMethod("demo.ping", async () => ({ ok: true }));
    api.registerCli(() => {}, { commands: ["demo"] });
    api.registerService({ id: "demo-service", start: () => {} });
  },
};
```

**运行方式**:
```bash
pnpm test:docker:plugins
```

### 4. Doctor Install Switch E2E 测试

**文件**: `doctor-install-switch-docker.sh`

**切换场景**:

1. **npm → Git**
   - npm 全局安装
   - Doctor 修复命令
   - 服务单元文件检查

2. **Git → npm**
   - Git 本地安装
   - npm 全局修复
   - 服务单元文件更新

**Mock 实现**:
```bash
# systemctl stub
case "$cmd" in
  status) exit 0 ;;
  is-enabled) ... ;;
  show) echo "ActiveState=inactive" ;;
esac

# loginctl stub
if [[ "$*" == *"show-user"* ]]; then
  echo "Linger=yes"
fi
```

**运行方式**:
```bash
pnpm test:docker:doctor-switch
```

### 5. QR Import E2E 测试

**文件**: `qr-import-docker.sh`

**测试内容**:
- 二维码解析
- 配置导入
- 配置验证

**运行方式**:
```bash
pnpm test:docker:qr
```

## 运行和调试指南

### 运行所有 Docker 测试

```bash
# 运行所有 Docker 测试
pnpm test:docker:all

# 单独运行
pnpm test:docker:onboard
pnpm test:docker:plugins
pnpm test:docker:gateway-network
pnpm test:docker:doctor-switch
pnpm test:docker:qr
```

### 调试技巧

#### 查看容器日志
```bash
# 查看运行中的容器
docker ps -a

# 查看特定容器日志
docker logs openclaw-gateway-e2e-<PID>

# 实时跟踪日志
docker logs -f openclaw-gateway-e2e-<PID>
```

#### 进入容器调试
```bash
# 进入容器 shell
docker run -it openclaw:local bash

# 手动运行测试
docker run --rm openclaw:local bash -lc '
  export OPENCLAW_ENTRY=dist/index.mjs
  node "$OPENCLAW_ENTRY" --version
'
```

#### 清理测试资源
```bash
# 清理所有测试容器
docker rm -f $(docker ps -aq --filter "name=openclaw-*")

# 清理测试网络
docker network prune

# 完全清理
pnpm test:docker:cleanup
```

### 超时配置

各测试的超时设置：

| 测试类型 | 默认超时 | 环境变量 |
|---------|---------|---------|
| 网关启动 | 40s | 硬编码 |
| 向导流程 | 45s | `timeout_s` 参数 |
| WebSocket 连接 | 5s | 硬编码 |

## 常见问题 (FAQ)

### Q1: Docker 测试失败怎么办？

**解决方案**:
1. 检查 Docker 状态
```bash
docker ps -a
docker network ls
```

2. 清理旧的测试资源
```bash
docker rm -f $(docker ps -aq --filter "name=openclaw-*")
docker network prune
```

3. 重新构建镜像
```bash
docker build -t openclaw:local -f scripts/e2e/Dockerfile .
```

### Q2: 网关启动超时？

**可能原因**:
- 构建产物缺失
- 端口被占用
- 资源不足

**解决方法**:
```bash
# 检查构建产物
ls -la dist/

# 检查端口占用
lsof -i :18789

# 增加超时时间（修改脚本）
for _ in $(seq 1 80); do  # 从 40 增加到 80
```

### Q3: 插件加载失败？

**检查项**:
1. 插件结构是否正确
2. `openclaw.plugin.json` 是否存在
3. `register()` 函数是否导出

**调试方法**:
```bash
# 查看插件列表
node "$OPENCLAW_ENTRY" plugins list --json

# 查看插件诊断
node "$OPENCLAW_ENTRY" plugins diagnose
```

### Q4: 如何添加新的 E2E 测试？

**步骤**:
1. 创建新的测试脚本 `scripts/e2e/my-test-docker.sh`
2. 添加执行权限 `chmod +x scripts/e2e/my-test-docker.sh`
3. 在 `package.json` 中添加测试命令
4. 运行验证

**模板**:
```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE_NAME="openclaw-my-test-e2e"

cleanup() {
  # 清理逻辑
}
trap cleanup EXIT

echo "Building Docker image..."
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/scripts/e2e/Dockerfile" "$ROOT_DIR"

echo "Running test..."
docker run --rm -t "$IMAGE_NAME" bash -lc '
  # 测试逻辑
'
```

## 测试维护和最佳实践

### 测试隔离

- 每个测试使用独立的临时目录
- 独立的 Docker 网络
- 互不干扰的容器名称
- 自动清理资源

### 错误处理

```bash
set -euo pipefail
# -e: 遇到错误立即退出
# -u: 使用未定义变量时报错
# -o pipefail: 管道命令中任一失败则整个失败
```

### 清理机制

```bash
cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker network rm "$NET_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT
```

### 日志验证

```bash
wait_for_log() {
  local needle="$1"
  local timeout_s="${2:-45}"
  # 等待日志中出现指定内容
}
```

## 相关文件清单

### 测试脚本
- `scripts/e2e/Dockerfile`
- `scripts/e2e/onboard-docker.sh`
- `scripts/e2e/plugins-docker.sh`
- `scripts/e2e/gateway-network-docker.sh`
- `scripts/e2e/doctor-install-switch-docker.sh`
- `scripts/e2e/qr-import-docker.sh`

### TypeScript E2E 测试
- `test/gateway.multi.e2e.test.ts`
- `test/media-understanding.auto.e2e.test.ts`
- `test/provider-timeout.e2e.test.ts`

### 配置文件
- `vitest.e2e.config.ts`

## 变更记录

### 2026-02-08 - 初始化 E2E 测试文档
- ✅ 创建 `scripts/e2e/CLAUDE.md` 文档
- 📋 记录所有 Docker E2E 测试场景
- 🔧 添加运行和调试指南
- ❓ 补充常见问题解答


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>