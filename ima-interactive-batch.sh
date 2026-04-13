#!/bin/bash

# 🎯 IMA 知识库交互式批量提取工具
# 专为大型知识库（1800+篇文章）设计

echo "🚀 IMA 知识库交互式批量提取工具"
echo "================================"
echo ""
echo "📚 工作原理："
echo "   每次提取循环："
echo "   1. 您手动滚动到新位置"
echo "   2. 脚本自动提取可见区域的文章"
echo "   3. 重复直到提取完所有文章"
echo ""
echo "================================"
echo ""

# 检查依赖
if ! command -v jq &> /dev/null; then
    echo "⚠️  需要安装 jq 工具"
    echo "安装命令: brew install jq"
    exit 1
fi

# 初始化结果文件
RESULT_FILE="ima-all-articles.json"
if [ ! -f "$RESULT_FILE" ]; then
    echo '{"timestamp": "'$(date -Iseconds)'","total": 0,"articles":[]}' > "$RESULT_FILE"
    echo "✅ 创建结果文件"
fi

# 提取计数
BATCH_NUM=1

while true; do
    echo "📦 批次 #$BATCH_NUM"
    echo "================================"
    echo ""
    echo "📍 当前状态："

    # 显示已提取数量
    if [ -f "$RESULT_FILE" ]; then
        TOTAL=$(jq '.total' "$RESULT_FILE" 2>/dev/null || echo "0")
        echo "   ✅ 已提取: $TOTAL 篇文章"
    fi

    echo ""
    echo "📝 请按以下步骤操作："
    echo ""
    echo "步骤 1️⃣: 在 ima.copilot 中"
    echo "   • 确保已打开「AI」知识库（或其他目标知识库）"
    echo "   • 使用鼠标滚轮或触控板向下滚动文章列表"
    echo "   • 滚动到新的、未提取过的文章位置"
    echo "   • 建议每次滚动3-5篇文章的距离"
    echo ""
    echo "步骤 2️⃣: 回到终端"
    echo "   • 确认 ima.copilot 窗口可见（可以看到文章列表）"
    echo ""
    echo "步骤 3️⃣: 按 Enter 开始自动提取"
    echo "   • 脚本将自动提取当前可见区域的5篇文章"
    echo "   • 自动跳过已提取过的文章"
    echo "   • 实时保存结果"
    echo ""
    echo "----------------------------------------"
    echo ""

    read -p "按 Enter 开始提取（或输入 q 退出，s 跳过）: " choice

    case "$choice" in
        q|Q|quit|exit)
            echo ""
            echo "🛑 用户退出"
            break
            ;;
        s|S|skip)
            echo ""
            echo "⏭️  跳过此批次，继续下一批"
            echo ""
            BATCH_NUM=$((BATCH_NUM + 1))
            continue
            ;;
    esac

    echo ""
    echo "🤖 开始自动提取..."
    echo ""

    # 运行提取脚本
    npx tsx batch-extract-ima-visible.ts 5

    # 等待用户准备下一批次
    echo ""
    echo "----------------------------------------"
    echo ""
    echo "✅ 批次 $BATCH_NUM 完成！"
    echo ""

    # 更新批次号
    BATCH_NUM=$((BATCH_NUM + 1))

    # 显示当前统计
    if [ -f "$RESULT_FILE" ]; then
        TOTAL=$(jq '.total' "$RESULT_FILE" 2>/dev/null || echo "0")
        echo "📊 累计提取: $TOTAL 篇文章"
        echo ""
    fi

    echo "💡 提示："
    echo "   • 在 ima.copilot 中继续向下滚动"
    echo "   • 避开重复的文章（脚本会自动检测）"
    echo "   • 滚动到新位置后按 Enter 继续"
    echo ""
    echo "🎯 进度参考（1800篇）："
    echo "   • 已提取 $TOTAL 篇，还需 $((1800 - TOTAL)) 篇"
    echo "   • 完成度: $((TOTAL * 100 / 1800))%"
    echo ""
    echo "输入 q 退出，或按 Enter 继续下一批"
    echo ""

    read -p "继续？ (Enter=继续, q=退出): " continue_choice

    case "$continue_choice" in
        q|Q|quit|exit)
            echo ""
            echo "🛑 用户退出"
            break
            ;;
    esac
done

# 最终报告
echo ""
echo "================================"
echo "🎉 批量提取完成！"
echo "================================"
echo ""

if [ -f "$RESULT_FILE" ]; then
    TOTAL=$(jq '.total' "$RESULT_FILE" 2>/dev/null || echo "0")
    echo "✅ 总共提取: $TOTAL 篇文章"
    echo ""

    if [ "$TOTAL" -gt 0 ]; then
        echo "📝 提取的文章列表（前10篇）："
        jq '.articles[:10] | .[] | "\(.index | tostring)\) \(.title[0:60]\)...\n   \(.url)"' "$RESULT_FILE" 2>/dev/null || echo "无法显示文章列表"
        echo ""

        if [ "$TOTAL" -gt 10 ]; then
            echo "   ... 还有 $((TOTAL - 10)) 篇"
        fi
    fi

    echo ""
    echo "📁 完整结果文件: $RESULT_FILE"
    echo ""
    echo "💡 导出为CSV格式："
    echo "   jq '.articles[] | [.index, .title, .url] | @csv' $RESULT_FILE > articles.csv"
    echo ""
    echo "💡 导出为纯链接列表："
    echo "   jq '.articles[].url' $RESULT_FILE > urls.txt"
    echo ""
else
    echo "⚠️  未找到结果文件"
fi
