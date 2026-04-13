#!/bin/bash

# IMA 完全自动化提取启动器
# 运行独立 .app 应用程序，不会有终端焦点问题

echo "🚀 IMA 完全自动化文章提取器"
echo "============================================================"
echo ""
echo "📋 使用说明："
echo "   脚本将自动遍历 AI 知识库中的所有文章"
echo "   自动点击文章标题 → 提取地址栏URL → 保存结果"
echo ""
echo "⏱️  预计时间: 1800篇约3小时"
echo ""
echo "📁 结果文件: ima-extracted-articles.json"
echo ""
echo "============================================================"
echo ""
echo "按 Enter 开始提取..."
read

echo ""
echo "🤖 启动提取..."
echo ""

osascript /Users/berton/Github/OpenClaw/IMA-Extractor.app/Contents/MacOS/extractor

echo ""
echo "============================================================"
echo "✅ 完成！查看结果："
echo "   cat ima-extracted-articles.json | python3 -m json.tool | head -20"
echo ""
echo "导出为纯链接列表："
echo "   python3 -c \"import json; d=json.load(open('ima-extracted-articles.json')); [print(a['url']) for a in d['articles']]\" > urls.txt"
echo ""
