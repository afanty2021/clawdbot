#!/bin/bash

# 🤖 IMA 完全自动化提取启动器
# 一键启动，无需任何手动操作

echo "🚀 IMA 完全自动化提取器"
echo "================================"
echo ""
echo "📋 使用说明："
echo "   此脚本将完全自动地："
echo "   1. 激活 ima.copilot 应用"
echo "   2. 点击知识库图标"
echo "   3. 选择'AI'知识库"
echo "   4. 遍历所有1800+篇文章"
echo "   5. 提取并保存所有URL"
echo ""
echo "⏱️  预计时间: 约2-3小时（1800篇文章）"
echo ""
echo "================================"
echo ""

# 检查参数
TARGET_COUNT=${1:-1800}

echo "🎯 目标: 提取 $TARGET_COUNT 篇文章"
echo ""
echo "按 Enter 开始，或 Ctrl+C 取消..."
read

echo ""
echo "🤖 启动完全自动化提取..."
echo ""

# 运行提取脚本
npx tsx auto-extract-ima-listbox.ts "$TARGET_COUNT"

echo ""
echo "================================"
echo "✅ 提取完成！"
echo "================================"
echo ""
echo "📁 结果文件: ima-listbox-results.json"
echo ""
echo "💡 导出为CSV:"
echo "   jq '.articles[] | [.index, .title, .url] | @csv' ima-listbox-results.json > articles.csv"
echo ""
echo "💡 导出为纯链接:"
echo "   jq '.articles[].url' ima-listbox-results.json > urls.txt"
echo ""
