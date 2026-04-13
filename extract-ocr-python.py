#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
OCR 地址栏链接提取器 - Python 版本
使用 PaddleOCR 进行高精度文本识别
"""

import subprocess
import sys
import os
import re
from datetime import datetime

def check_dependencies():
    """检查依赖是否安装"""
    print("🔍 检查依赖...")

    # 检查 Python 版本
    if sys.version_info < (3, 8):
        print("❌ 需要 Python 3.8+")
        return False

    # 检查 PIL/Pillow
    try:
        import PIL
        print("✅ Pillow 已安装")
    except ImportError:
        print("⚠️  Pillow 未安装")
        print("💡 安装: pip3 install Pillow")
        return False

    return True

def capture_screen():
    """截取屏幕"""
    timestamp = int(datetime.now().timestamp())
    filename = f"screen_{timestamp}.png"

    print(f"📸 截取屏幕...")
    subprocess.run(['screencapture', '-x', filename], check=True)
    print(f"✅ 截图已保存: {filename}\n")
    return filename

def extract_with_paddleocr(image_path):
    """使用 PaddleOCR 提取链接"""
    print("🔍 使用 PaddleOCR 识别链接...\n")

    try:
        from paddleocr import PaddleOCR

        # 初始化 PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='ch')

        # 执行 OCR
        result = ocr.ocr(image_path)

        print(f"📝 识别到 {len(result)} 个文本块\n")

        # 搜索微信公众号链接
        for line in result:
            text = line[1][0]  # 获取识别的文本
            print(f"  文本: {text}")

            # 提取链接
            url_match = re.search(r'https?://mp\.weixin\.qq\.com/[^\s]+', text)
            if url_match:
                url = url_match.group(0)
                print(f"\n✅ 找到链接: {url}\n")
                return url

        print("❌ 未找到微信公众号链接\n")
        return ""

    except ImportError:
        print("⚠️  PaddleOCR 未安装")
        print("💡 安装: pip3 install paddleocr")
        print("   或: pip3 install paddlepaddle paddleocr")
        return ""
    except Exception as e:
        print(f"❌ PaddleOCR 识别失败: {e}")
        return ""

def extract_with_tesseract(image_path):
    """使用 Tesseract 提取链接"""
    print("🔍 使用 Tesseract 识别链接...\n")

    try:
        # 检查 tesseract 是否安装
        subprocess.run(['which', 'tesseract'], check=True,
                      capture_output=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        print("⚠️  Tesseract 未安装")
        print("💡 安装: brew install tesseract")
        return ""

    try:
        # 使用 tesseract 识别
        lang = 'eng+chi_sim'  # 中英文混合
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', lang],
            capture_output=True,
            text=True,
            timeout=30
        )

        ocr_text = result.stdout
        print(f"📝 识别到的文本:\n{ocr_text[:500]}...\n")

        # 搜索链接
        url_match = re.search(r'mp\.weixin\.qq\.com\/[a-zA-Z0-9_-]+', ocr_text)
        if url_match:
            url = f"https://{url_match.group(0)}"
            print(f"✅ 找到链接: {url}\n")
            return url

        print("❌ 未找到链接\n")
        return ""

    except Exception as e:
        print(f"❌ Tesseract 失败: {e}")
        return ""

def open_in_chrome(url):
    """在 Chrome 中打开链接"""
    print("🌐 在 Chrome 中打开...")
    print(f"📎 URL: {url}\n")

    subprocess.run(['open', '-a', 'Google Chrome', url], check=True)

    print("⏳ 等待页面加载...")
    import time
    time.sleep(3)

    # 截取验证截图
    timestamp = int(datetime.now().timestamp())
    filename = f"verify_{timestamp}.png"

    print("📸 截取验证截图...")
    subprocess.run(['screencapture', '-x', filename], check=True)
    print(f"✅ 截图已保存: {filename}\n")

    return filename

def save_result(url, screenshot):
    """保存结果"""
    result = {
        "timestamp": datetime.now().isoformat(),
        "url": url,
        "screenshot": screenshot,
        "method": "ocr_python"
    }

    import json
    result_path = "ima_ocr_result.json"
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"💾 结果已保存: {result_path}\n")

def main():
    print("🚀 OCR 地址栏链接提取器 (Python)\n")
    print("=" * 60)

    # 检查依赖
    if not check_dependencies():
        print("\n💡 请先安装依赖:")
        print("   pip3 install paddleocr pillow")
        return

    # 截图
    screenshot = capture_screen()

    # 尝试 PaddleOCR
    url = extract_with_paddleocr(screenshot)

    # 备用 Tesseract
    if not url:
        url = extract_with_tesseract(screenshot)

    # 验证
    if url:
        verify_screenshot = open_in_chrome(url)
        save_result(url, verify_screenshot)

        print("=" * 60)
        print("🎉 成功完成！")
        print("=" * 60)
        print(f"📋 文章链接: {url}")
        print(f"📸 验证截图: {verify_screenshot}")

    else:
        print("❌ OCR 识别失败")
        print("\n💡 建议:")
        print("   1. 确保 ima.copilot 窗口在前台")
        print("   2. 地址栏完全可见")
        print("   3. 安装 OCR 工具: pip3 install paddleocr")

if __name__ == '__main__':
    main()
