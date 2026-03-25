#!/bin/bash

echo "🔍 企业微信连接诊断工具"
echo "========================"
echo ""

# 1. 检查网关状态
echo "1️⃣ 检查网关状态..."
GATEWAY_PID=$(ps aux | grep "openclaw-gateway" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$GATEWAY_PID" ]; then
    echo "✅ 网关正在运行 (PID: $GATEWAY_PID)"
else
    echo "❌ 网关未运行"
    exit 1
fi

# 2. 检查端口
echo ""
echo "2️⃣ 检查网关端口..."
if netstat -an | grep 18789 | grep LISTEN > /dev/null; then
    echo "✅ 网关端口 18789 正在监听"
else
    echo "❌ 网关端口未监听"
fi

# 3. 检查企业微信配置
echo ""
echo "3️⃣ 检查企业微信配置..."
WECOM_CONFIG=$(pnpm openclaw config get channels.wecom 2>&1 | grep -A 5 "wecom")
if echo "$WECOM_CONFIG" | grep "enabled.*true" > /dev/null; then
    echo "✅ 企业微信已启用"
else
    echo "❌ 企业微信未启用"
fi

if echo "$WECOM_CONFIG" | grep "botId" > /dev/null; then
    echo "✅ Bot ID 已配置"
else
    echo "❌ Bot ID 未配置"
fi

# 4. 检查企业微信插件
echo ""
echo "4️⃣ 检查企业微信插件..."
if [ -d "~/.openclaw/extensions/wecom-openclaw-plugin" ]; then
    echo "✅ 企业微信插件已安装"
    WECOM_VERSION=$(cat ~/.openclaw/extensions/wecom-openclaw-plugin/package.json | grep version | head -1)
    echo "   版本: $WECOM_VERSION"
else
    echo "❌ 企业微信插件未安装"
fi

# 5. 测试网关 API
echo ""
echo "5️⃣ 测试网关 API..."
if curl -s http://localhost:18789/ | grep OpenClaw > /dev/null; then
    echo "✅ 网关 API 响应正常"
else
    echo "❌ 网关 API 无响应"
fi

# 6. 测试 ETM API
echo ""
echo "6️⃣ 测试 ETM Plus API..."
if curl -s http://localhost:8001/health | grep success > /dev/null; then
    echo "✅ ETM Plus API 正常运行"
else
    echo "❌ ETM Plus API 无响应"
fi

echo ""
echo "========================"
echo "📋 诊断完成"
echo ""
echo "💡 如果企业微信消息没有反应，请尝试："
echo "   1. 确认企业微信机器人配置正确"
echo "   2. 检查企业微信应用回调 URL"
echo "   3. 重启网关: kill $GATEWAY_PID && pnpm gateway:dev"
echo "   4. 重新配置企业微信: pnpm openclaw channels add"
