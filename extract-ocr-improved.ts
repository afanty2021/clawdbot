#!/usr/bin/env tsx

/**
 * 改进的 OCR 地址栏链接提取器
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ImprovedOCRExtractor {
  /**
   * 截取屏幕
   */
  captureScreen(): string {
    const timestamp = Date.now();
    const filename = `screen-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    console.log('📸 截取屏幕...');
    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    console.log(`✅ 截图: ${filename}\n`);

    return filepath;
  }

  /**
   * 使用 macOS Vision 框架识别链接
   */
  async extractWithVision(imagePath: string): Promise<string> {
    console.log('🔍 使用 macOS Vision 框架识别...\n');

    // 使用正确的 Vision API
    const swiftCode = `
import Foundation
import Vision
import AppKit

func extractURL(from imagePath: String) -> String? {
    guard let imageUrl = URL(fileURLWithPath: imagePath) else {
        print("❌ 无法创建图片URL")
        return nil
    }

    guard let image = NSImage(contentsOf: imageUrl) else {
        print("❌ 无法加载图片")
        return nil
    }

    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("❌ 无法获取CGImage")
        return nil
    }

    let request = VNRecognizeTextRequest.init(request: VNRecognizeTextRequest.RecognitionLevelLevelaccurate)

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

    do {
        try handler.perform([request])

        guard let observations = request.results, !observations.isEmpty else {
            print("❌ 未识别到文本")
            return nil
        }

        var foundURL: String?

        for observation in observations {
            guard let topCandidate = observation.topCandidates(1).first else {
                continue
            }

            let text = topCandidate.string

            // 查找微信公众号链接
            if text.contains("mp.weixin.qq.com") {
                // 使用正则表达式提取完整URL
                let pattern = "https?:\\\\/\\\\/mp\\\\.weixin\\\\.qq\\\\.com\\\\/[a-zA-Z0-9_\\-]+"
                if let regex = try? NSRegularExpression(pattern: pattern) {
                    let range = text.range(of: regex, options: .regularExpression)
                    if let range = range {
                        foundURL = String(text[range])
                        break
                    }
                }
            }
        }

        return foundURL
    } catch {
        print("❌ 识别失败: \\(error)")
        return nil
    }
}

let url = extractURL(from: "${imagePath}")

if let url = url {
    print(url)
}
`;

    const tempScript = '/tmp/extract_ocr_url.swift';
    fs.writeFileSync(tempScript, swiftCode, 'utf-8');

    try {
      const result = execSync(`swift "${tempScript}"`, {
        encoding: 'utf-8',
        timeout: 30000
      });

      // 清理临时文件
      execSync(`rm "${tempScript}"`, { encoding: 'utf-8' });

      const url = result.trim();
      if (url && url.includes('mp.weixin.qq.com')) {
        console.log(`✅ 识别成功: ${url}\n`);
        return url;
      }
    } catch (error) {
      console.log('⚠️  Vision OCR 失败，尝试备用方案...\n');
    }

    return '';
  }

  /**
   * 备用方案：使用 tesseract
   */
  async extractWithTesseract(imagePath: string): Promise<string> {
    console.log('🔍 尝试使用 Tesseract OCR...\n');

    try {
      // 检查 tesseract 是否安装
      execSync('which tesseract', { encoding: 'utf-8' });
    } catch {
      console.log('⚠️  Tesseract 未安装');
      console.log('💡 安装: brew install tesseract');
      return '';
    }

    try {
      // 使用 tesseract 识别中英文
      const ocrResult = execSync(
        `tesseract "${imagePath}" stdout -l eng+chi_sim 2>&1 | grep -oE "mp\\.weixin\\.qq\\.com[^[:space:]]*"`,
        { encoding: 'utf-8' }
      );

      if (ocrResult) {
        const urls = ocrResult.trim().split('\n');
        for (const url of urls) {
          if (url.includes('mp.weixin.qq.com')) {
            console.log(`✅ Tesseract 识别成功: ${url}\n`);
            return url;
          }
        }
      }

      console.log('⚠️  Tesseract 未找到链接\n');
    } catch (error) {
      console.log('⚠️  Tesseract 识别失败\n');
    }

    return '';
  }

  /**
   * 在 Chrome 中验证
   */
  async verifyInChrome(url: string): Promise<void> {
    console.log('🌐 在 Chrome 中打开验证...');
    console.log(`📎 URL: ${url}\n`);

    execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });

    console.log('⏳ 等待页面加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const screenshot = this.captureScreen();
    console.log(`📸 验证截图: ${screenshot}\n`);
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 OCR 地址栏链接提取器\n');
    console.log('='.repeat(60));

    // 1. 截图
    const screenshot = this.captureScreen();

    // 2. 尝试 Vision OCR
    let url = await this.extractWithVision(screenshot);

    // 3. 备用 Tesseract
    if (!url) {
      url = await this.extractWithTesseract(screenshot);
    }

    // 4. 如果成功，验证
    if (url) {
      await this.verifyInChrome(url);

      // 保存结果
      const result = {
        timestamp: new Date().toISOString(),
        url,
        screenshot,
        method: 'ocr_vision'
      };

      const resultPath = path.join(process.cwd(), 'ima-ocr-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log('='.repeat(60));
      console.log('🎉 OCR 提取成功！');
      console.log('='.repeat(60));
      console.log(`📋 文章链接: ${url}`);
      console.log(`📸 验证截图: ${screenshot}`);
      console.log(`💾 结果文件: ${resultPath}\n`);

    } else {
      console.log('❌ OCR 方法都失败了');
      console.log('\n💡 可能的原因:');
      console.log('   1. 地址栏未完全显示在截图中');
      console.log('   2. 链接被部分遮挡');
      console.log('   3. 图像分辨率不足');
      console.log('\n🔧 建议:');
      console.log('   • 确保 ima.copilot 窗口最大化');
      console.log('   • 地址栏完全可见');
      console.log('   • 或使用 DevTools 方案 (见 ima-final-guide.md)');
    }
  }
}

// 主函数
async function main() {
  const extractor = new ImprovedOCRExtractor();
  await extractor.run();
}

main().catch(console.error);
