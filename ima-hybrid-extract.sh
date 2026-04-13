#!/bin/bash

# 🎯 IMA Copilot 混合自动化方案
# 结合手动确认和自动提取

echo "🚀 IMA Copilot 混合自动化方案"
echo "================================"
echo ""
echo "📋 请按以下步骤操作："
echo ""
echo "步骤 1: 在 ima.copilot 中"
echo "   ✅ 点击左侧导航栏的「知识库」图标"
echo "   ✅ 选择一个知识库（如「AI」）"
echo "   ✅ 点击一篇微信公众号文章的**标题**"
echo "   ✅ 等待文章全文完全显示（地址栏出现）"
echo ""
echo "步骤 2: 回到终端，按 Enter 继续"
echo ""

read -p "按 Enter 开始自动提取..."

# 运行已验证的固定坐标提取脚本
echo ""
echo "🔧 开始自动提取..."
echo ""

npx tsx extract-fixed-coordinates.ts

echo ""
echo "================================"
echo "✅ 完成！"
echo "================================"
