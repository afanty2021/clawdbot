#!/bin/bash

# 🎯 一键式 IMA 链接提取和验证方案
# 使用方法：在 ima.copilot 中复制链接后，运行此脚本

echo "🚀 IMA 链接一键提取和验证工具"
echo "================================"
echo ""
echo "📋 请按以下步骤操作："
echo ""
echo "步骤 1: 在 ima.copilot 中"
echo "   - 确保一篇微信公众号文章已打开"
echo "   - 在地址栏中复制链接 (Cmd+C 或右键复制)"
echo ""
echo "步骤 2: 回到终端，按 Enter 继续"
echo ""

read -p "按 Enter 继续..."

# 从剪贴板读取
CLIPBOARD=$(pbpaste)

echo ""
echo "📝 剪贴板内容:"
echo "$CLIPBOARD" | head -c 300
echo ""
echo "..."

# 提取 URL
if echo "$CLIPBOARD" | grep -q "mp.weixin.qq.com"; then
    URL=$(echo "$CLIPBOARD" | grep -oE "https?://mp\.weixin\.qq\.com/[^[:space:]\"<>]+" | head -1)

    if [ -n "$URL" ]; then
        echo ""
        echo "✅ 成功提取链接!"
        echo ""
        echo "📎 URL: $URL"
        echo ""

        # 在 Chrome 中打开
        echo "🌐 在 Chrome 中打开..."
        open -a "Google Chrome" "$URL"

        # 等待加载
        echo "⏳ 等待页面加载..."
        sleep 3

        # 截图
        TIMESTAMP=$(date +%s)
        SCREENSHOT="ima-verify-$TIMESTAMP.png"
        echo ""
        echo "📸 截取验证截图..."
        screencapture -x "$SCREENSHOT"

        echo "✅ 截图已保存: $SCREENSHOT"
        echo ""

        # 保存结果
        echo "{\"url\":\"$URL\",\"timestamp\":\"$(date -Iseconds)\",\"screenshot\":\"$SCREENSHOT\"}" > ima-link-result.json
        echo "💾 结果已保存: ima-link-result.json"
        echo ""

        echo "================================"
        echo "🎉 验证完成！"
        echo "================================"
        echo "📋 文章链接: $URL"
        echo "📸 验证截图: $SCREENSHOT"
        echo "💾 结果文件: ima-link-result.json"
        echo ""

        exit 0
    fi
fi

echo "❌ 未找到有效的微信公众号链接"
echo ""
echo "💡 请确保:"
echo "   1. 复制的是完整的 mp.weixin.qq.com 链接"
echo "   2. 链接没有被截断"
echo "   3. 重新运行脚本"
