#!/bin/bash
# OpenClaw 启动脚本 - 使用 node@22 以避免 simdutf 版本冲突
# 问题：node@25 需要 simdutf v32，但系统安装了 v33
# 解决方案：使用 node@22 LTS 版本运行 OpenClaw

set -e

# 加载 nvm 并切换到 node@22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null 2>&1

# 执行 OpenClaw 命令
exec openclaw "$@"
