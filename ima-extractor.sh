#!/bin/bash

# 🤖 IMA 文章链接提取 - 稳定可靠启动脚本
# 版本: 2.0.0
# 更新: 2026-04-13

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 显示欢迎信息
show_welcome() {
    print_header "🤖 IMA 文章链接提取工具 v2.0"

    cat << "EOF"
    📊 稳定可靠的核心引擎
    ✅ 多种提取策略自动切换
    ✅ 智能重试和错误恢复
    ✅ 进度保存和断点续传
    ✅ 详细的状态监控和日志

EOF
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi

    # 检查 tsx
    if ! command -v tsx &> /dev/null; then
        print_warning "tsx 未安装，正在安装..."
        npm install -g tsx
    fi

    print_success "依赖检查完成"
}

# 检查 ima.copilot 是否运行
check_app_running() {
    print_info "检查 ima.copilot 运行状态..."

    if pgrep -x "ima.copilot" > /dev/null; then
        print_success "ima.copilot 正在运行"
        return 0
    else
        print_warning "ima.copilot 未运行"
        read -p "是否启动 ima.copilot? (y/n): " start_app

        if [[ $start_app == "y" || $start_app == "Y" ]]; then
            open -a "ima.copilot"
            print_info "等待应用启动..."
            sleep 3
            return 0
        else
            print_error "请先启动 ima.copilot"
            exit 1
        fi
    fi
}

# 显示状态
show_status() {
    print_info "当前提取状态..."

    if [ -f "ima-extractor-state.json" ]; then
        echo ""
        jq '.' ima-extractor-state.json 2>/dev/null || cat ima-extractor-state.json
        echo ""
    else
        print_warning "未找到状态文件，这是首次运行"
    fi

    if [ -f "ima-extracted-articles.json" ]; then
        local total=$(jq '.totalArticles' ima-extracted-articles.json 2>/dev/null || echo "0")
        print_success "已提取 $total 篇文章"
    fi
}

# 运行提取器
run_extractor() {
    local target_count=${1:-1800}
    local batch_size=${2:-10}

    print_header "🚀 开始自动提取"

    cat << EOF
    📊 目标数量: $target_count 篇
    📦 批次大小: $batch_size 篇
    ⏱️  预计时间: 约 $(( target_count * 5 / 60 )) 分钟

EOF

    read -p "按 Enter 开始，或 Ctrl+C 取消..."

    echo ""
    print_info "启动提取引擎..."
    echo ""

    # 运行提取脚本
    npx tsx ima-extractor-core.ts "$target_count" "$batch_size"

    echo ""
    print_success "提取完成！"
}

# 显示菜单
show_menu() {
    echo ""
    echo "请选择操作："
    echo ""
    echo "  1) 查看状态"
    echo "  2) 开始提取"
    echo "  3) 恢复上次提取"
    echo "  4) 清除状态重新开始"
    echo "  5) 查看日志"
    echo "  6) 导出结果"
    echo "  0) 退出"
    echo ""
    read -p "请输入选项 (0-6): " choice

    case $choice in
        1)
            show_status
            ;;
        2)
            echo ""
            read -p "输入目标文章数量 (默认1800): " target_count
            read -p "输入批次大小 (默认10): " batch_size
            run_extractor ${target_count:-1800} ${batch_size:-10}
            ;;
        3)
            print_info "恢复上次提取..."
            if [ -f "ima-extractor-state.json" ]; then
                npx tsx ima-extractor-core.ts
            else
                print_error "未找到状态文件"
            fi
            ;;
        4)
            print_warning "这将清除所有状态和进度"
            read -p "确认清除? (y/n): " confirm
            if [[ $confirm == "y" || $confirm == "Y" ]]; then
                rm -f ima-extractor-state.json
                rm -f ima-extracted-articles.json
                print_success "状态已清除"
            fi
            ;;
        5)
            if [ -f "ima-extractor.log" ]; then
                less ima-extractor.log
            else
                print_warning "未找到日志文件"
            fi
            ;;
        6)
            print_info "导出结果..."
            if [ -f "ima-extracted-articles.json" ]; then
                echo ""
                echo "选择导出格式："
                echo "  1) CSV"
                echo "  2) 纯链接列表"
                echo "  3) Markdown"
                echo ""
                read -p "请选择 (1-3): " format

                case $format in
                    1)
                        jq '.articles[] | [.index, .title, .url] | @csv' ima-extracted-articles.json > articles.csv
                        print_success "已导出到 articles.csv"
                        ;;
                    2)
                        jq -r '.articles[].url' ima-extracted-articles.json > urls.txt
                        print_success "已导出到 urls.txt"
                        ;;
                    3)
                        jq -r '.articles[] | "- \(.title): \(.url)"' ima-extracted-articles.json > articles.md
                        print_success "已导出到 articles.md"
                        ;;
                esac
            else
                print_error "未找到结果文件"
            fi
            ;;
        0)
            print_info "退出"
            exit 0
            ;;
        *)
            print_error "无效选项"
            ;;
    esac
}

# 主函数
main() {
    show_welcome
    check_dependencies
    check_app_running

    # 如果提供了命令行参数，直接运行
    if [ $# -gt 0 ]; then
        run_extractor "$@"
    else
        # 否则显示交互式菜单
        while true; do
            show_menu
            echo ""
            read -p "按 Enter 返回菜单，或输入 0 退出: " back
            [[ $back == "0" ]] && exit 0
        done
    fi
}

# 运行主函数
main "$@"
