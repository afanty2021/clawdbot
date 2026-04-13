#!/bin/bash

# IMA 文章链接快速提取和验证脚本

echo "🚀 IMA 文章链接提取和验证工具"
echo "=========================================="
echo ""
echo "📖 使用说明："
echo "1. 在 ima.copilot 中复制微信公众号文章链接"
echo "2. 运行此脚本"
echo "3. 脚本会自动提取链接并在 Chrome 中验证"
echo ""

# 从剪贴板读取
CLIPBOARD=$(pbpaste)

echo "📋 剪贴板内容:"
echo "$CLIPBOARD" | head -c 200
echo ""
echo "..."

# 提取微信公众号链接
if echo "$CLIPBOARD" | grep -q "mp.weixin.qq.com"; then
  URL=$(echo "$CLIPBOARD" | grep -oE "https?://mp\.weixin\.qq\.com/[^[:space:]\"<>]+" | head -1)

  if [ -n "$URL" ]; then
    echo ""
    echo "✅ 提取到链接:"
    echo "$URL"
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
    echo "🎉 验证完成！"
    echo ""
    echo "📋 链接: $URL"
    echo "📸 截图: $SCREENSHOT"

    # 保存到文件
    echo "{\"url\":\"$URL\",\"timestamp\":\"$(date -Iseconds)\",\"screenshot\":\"$SCREENSHOT\"}" > ima-link-result.json
    echo "💾 结果: ima-link-result.json"
  else
    echo "❌ 无法提取链接"
    echo "💡 请确保复制完整的 mp.weixin.qq.com 链接"
  fi
else
  echo "❌ 剪贴板中没有微信公众号链接"
  echo "💡 请确保复制的是 mp.weixin.qq.com 链接"
fi

echo ""
echo "=========================================="
echo "💡 提示：重新运行脚本可提取更多链接"
