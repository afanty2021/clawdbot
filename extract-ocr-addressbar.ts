#!/usr/bin/env tsx

/**
 * 使用 OCR 识别地址栏链接的方案
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class OCRAddressBarExtractor {
  /**
   * 截取屏幕
   */
  captureScreen(): string {
    const timestamp = Date.now();
    const filename = `ima-screen-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    console.log('📸 截取屏幕...');
    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    console.log(`✅ 截图已保存: ${filename}\n`);

    return filepath;
  }

  /**
   * 使用图像识别提取链接
   */
  async extractLinkFromImage(imagePath: string): Promise<string> {
    console.log('🔍 从图像中提取链接...');

    // 方法 1: 使用 macOS 的内置 OCR
    try {
      console.log('尝试使用 macOS Live Text...');

      // 使用 Swift 和 Vision 框架进行 OCR
      const swiftScript = `
        import Vision
        import AppKit

        let imageUrl = URL(fileURLWithPath: "${imagePath}")
        guard let image = NSImage(contentsOf: imageUrl) else {
            print("Error loading image")
            exit(1)
        }

        guard let cgImage = image.cgImage(forProposedRect: nil, contextHeight: nil, hints: nil) else {
            print("Error getting CGImage")
            exit(1)
        }

        let request = VNRecognizeTextRequest.init(completionHandler: { request, error in
            if let error = error {
                print("Error: \\(error)")
                return
            }

            guard let observations = request.results, !observations.isEmpty else {
                print("No text found")
                return
            }

            var foundURL = ""
            for observation in observations {
                if let topCandidate = observation.topCandidates(1).first {
                    let text = topCandidate.string
                    if text.contains("mp.weixin.qq.com") {
                        // 提取 URL
                        let urlPattern = "https?:\\\\/\\\\/mp\\\\.weixin\\\\.qq\\\\.com\\\\/[a-zA-Z0-9_-]+"
                        if let regex = try? NSRegularExpression(pattern: urlPattern) {
                            let range = text.range(of: regex, options: .regularExpression)
                            if let range = range {
                                foundURL = String(text[range])
                                print(foundURL)
                                exit(0)
                            }
                        }
                    }
                }
            }

            if foundURL.isEmpty {
                print("No URL found in image")
            }
        })

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try? handler.perform([request])
      `;

      const tempScript = '/tmp/extract_url.swift';
      fs.writeFileSync(tempScript, swiftScript, 'utf-8');

      try {
        const result = execSync(`swift "${tempScript}"`, {
          encoding: 'utf-8',
          timeout: 30000
        });

        // 清理临时文件
        execSync(`rm "${tempScript}"`, { encoding: 'utf-8' });

        const url = result.trim();
        if (url && url.includes('mp.weixin.qq.com')) {
          console.log(`✅ OCR 提取成功: ${url}\n`);
          return url;
        }
      } catch (error) {
        console.log('⚠️  Swift OCR 方法失败');
      }

    } catch (error) {
      console.log('⚠️  macOS OCR 不可用');
    }

    // 方法 2: 使用 tesseract (如果安装)
    try {
      console.log('尝试使用 tesseract...');
      const ocrResult = execSync(`tesseract "${imagePath}" stdout -l eng+chi_sim 2>/dev/null | grep "mp.weixin.qq.com"`, {
        encoding: 'utf-8'
      });

      if (ocrResult) {
        const urlMatch = ocrResult.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          console.log(`✅ Tesseract 提取成功: ${urlMatch[1]}\n`);
          return urlMatch[1];
        }
      }
    } catch (error) {
      console.log('⚠️  Tesseract 不可用');
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
   * 运行流程
   */
  async run(): Promise<void> {
    console.log('🚀 OCR 地址栏链接提取器\n');
    console.log('='.repeat(60));

    // 1. 截图
    const screenshot = this.captureScreen();

    // 2. OCR 提取
    const url = await this.extractLinkFromImage(screenshot);

    if (url) {
      // 3. 验证
      await this.verifyInChrome(url);

      // 4. 保存结果
      const result = {
        timestamp: new Date().toISOString(),
        url,
        screenshot,
        method: 'ocr'
      };

      const resultPath = path.join(process.cwd(), 'ima-ocr-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log('='.repeat(60));
      console.log('🎉 成功！');
      console.log('='.repeat(60));
      console.log(`📋 链接: ${url}`);
      console.log(`💾 结果: ${resultPath}\n`);

    } else {
      console.log('❌ OCR 提取失败');
      console.log('\n💡 建议:');
      console.log('   1. 确保地址栏可见且包含完整链接');
      console.log('   2. 安装 tesseract: brew install tesseract');
      console.log('   3. 或使用手动方案: ./verify-ima-link.sh');
    }
  }
}

// 主函数
async function main() {
  const extractor = new OCRAddressBarExtractor();
  await extractor.run();
}

main().catch(console.error);
