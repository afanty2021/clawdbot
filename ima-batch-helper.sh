#!/bin/bash

# 🎯 IMA 知识库批量提取辅助脚本
# 适用于大型知识库（1800+篇文章）

echo "🚀 IMA 知识库批量提取工具"
echo "================================"
echo ""
echo "📋 工作流程："
echo ""
echo "每次提取循环："
echo "  1️⃣  在 ima.copilot 中手动向下滚动文章列表"
echo "  2️⃣  在终端按 Enter 继续自动提取"
echo "  3️⃣  重复上述步骤"
echo ""
echo "================================"
echo ""

# 创建结果文件
RESULT_FILE="ima-batch-results.json"

if [ ! -f "$RESULT_FILE" ]; then
    echo '{"timestamp": "'$(date -Iseconds)'","articles":[]}' > "$RESULT_FILE"
    echo "✅ 创建结果文件: $RESULT_FILE"
    echo ""
fi

# 提取计数
EXTRACTED_COUNT=0
BATCH_NUM=1

while true; do
    echo "📦 批次 #$BATCH_NUM"
    echo "----------------------------------------"
    echo ""
    echo "📝 请按以下步骤操作："
    echo ""
    echo "步骤 1: 在 ima.copilot 中"
    echo "   ✅ 向下滚动文章列表（鼠标滚轮或触控板）"
    echo "   ✅ 滚动到新的文章位置"
    echo ""
    echo "步骤 2: 回到终端，按 Enter 继续自动提取"
    echo ""

    read -p "按 Enter 开始自动提取当前可见区域的文章（或输入 q 退出）: "

    if [ "$REPLY" = "q" ]; then
        echo ""
        echo "🛑 用户退出"
        break
    fi

    echo ""
    echo "🤖 开始自动提取..."
    echo ""

    # 运行提取脚本（提取5篇）
    npx tsx batch-extract-ima-visible.ts 5

    # 等待用户准备下一批次
    echo ""
    echo "----------------------------------------"
    echo ""
    echo "✅ 批次 $BATCH_NUM 完成"
    echo ""

    # 显示当前统计
    if [ -f "$RESULT_FILE" ]; then
        TOTAL=$(jq '.articles | length' "$RESULT_FILE" 2>/dev/null || echo "0")
        echo "📊 当前总计: $TOTAL 篇文章"
        echo ""
    fi

    BATCH_NUM=$((BATCH_NUM + 1))

    echo "💡 继续下一批次："
    echo "   1. 在 ima.copilot 中继续向下滚动"
    echo "   2. 返回终端按 Enter"
    echo ""
    echo "或输入 q 退出"
    echo ""
done

echo ""
echo "================================"
echo "🎉 批量提取完成！"
echo "================================"
echo ""
echo "📁 结果文件: $RESULT_FILE"
echo ""

# 显示最终统计
if [ -f "$RESULT_FILE" ]; then
    TOTAL=$(jq '.articles | length' "$RESULT_FILE" 2>/dev/null || echo "0")
    echo "✅ 总共提取: $TOTAL 篇文章"
    echo ""
    echo "📝 最近提取的5篇文章："
    jq '.articles[-5:][] | {index, title, url}' "$RESULT_FILE" 2>/dev/null || echo "无法显示文章列表"
    echo ""
fi

echo "💾 所有文章链接已保存到: $RESULT_FILE"
echo ""
