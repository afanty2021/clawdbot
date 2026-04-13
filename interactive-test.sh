#!/bin/bash

echo "🧪 IMA URL提取 - 交互式测试"
echo "================================"
echo ""
echo "此测试将帮助我们确定URL提取方法是否有效"
echo ""
echo "步骤："
echo "1. 手动在 ima.copilot 中打开一篇微信公众号文章"
echo "2. 确保文章完全加载，地址栏显示URL"
echo "3. 运行此脚本并按 Enter"
echo ""
echo "准备就绪后按 Enter 继续..."
read

echo ""
echo "正在提取URL..."
echo ""

# 尝试提取URL
osascript << 'EOF'
tell application "System Events"
  tell process "ima.copilot"
    set frontmost to true
    delay 0.5

    -- 点击地址栏
    click at {960, 100}
    delay 0.5

    -- 全选并复制
    keystroke "a" using command down
    delay 0.3
    keystroke "c" using command down
    delay 0.5
  end tell
end tell
EOF

# 等待复制完成
sleep 1

# 获取剪贴板内容
CLIPBOARD=$(pbpaste)

echo "📋 剪贴板内容:"
echo "$CLIPBOARD" | head -c 200
echo "..."
echo ""

if echo "$CLIPBOARD" | grep -q "^http"; then
  echo "✅ 成功提取URL！"
  echo ""
  echo "完整URL:"
  echo "$CLIPBOARD"
  echo ""
  echo "🎉 方法有效！可以继续自动化开发"
else
  echo "❌ 未提取到URL"
  echo ""
  echo "💡 可能原因："
  echo "   1. 文章没有完全打开"
  echo "   2. 地址栏位置不对"
  echo "   3. 需要其他方法提取URL"
  echo ""
  echo "📸 请截图当前界面，以便分析问题"
fi

echo ""
echo "按 Enter 退出..."
read
