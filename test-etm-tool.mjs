#!/usr/bin/env node

/**
 * ETM API 工具测试脚本
 * 用于验证发票上传和审批回复功能
 */

import { createEtmApiTool } from "./dist/agents/tools/etm-api-tool.js";

// 模拟配置
const mockConfig = {
  etm: {
    api_base: "http://localhost:8001",
    timeout_ms: 30000,
  },
};

async function testHealthCheck() {
  console.log("测试 1: 健康检查");
  const tool = createEtmApiTool(mockConfig);
  const result = await tool.execute(
    "test-1",
    {
      action: "health_check",
    },
    null,
  );

  console.log("健康检查结果:", result);
  return result;
}

async function testInvoiceUpload() {
  console.log("\n测试 2: 发票上传");
  const tool = createEtmApiTool(mockConfig);

  // 注意：这里需要一个真实的发票文件路径
  const testFilePath = "/tmp/test-invoice.pdf";

  // 创建一个简单的测试 PDF 文件
  const fs = await import("node:fs/promises");
  await fs.writeFile(
    testFilePath,
    "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n",
  );

  const result = await tool.execute(
    "test-2",
    {
      action: "upload_invoice",
      file_path: testFilePath,
      applicant_id: "TestUser",
      applicant_name: "测试用户",
      payment_method: "个人",
      description: "测试发票上传",
    },
    null,
  );

  console.log("发票上传结果:", result);

  // 清理测试文件
  await fs.unlink(testFilePath).catch(() => {});

  return result;
}

async function main() {
  try {
    console.log("开始测试 ETM API 工具...\n");

    // 测试 1: 健康检查
    const healthResult = await testHealthCheck();
    if (!healthResult.output?.success) {
      throw new Error("健康检查失败");
    }

    // 测试 2: 发票上传
    const uploadResult = await testInvoiceUpload();
    console.log("\n上传响应:", JSON.stringify(uploadResult, null, 2));

    console.log("\n✅ 所有测试完成！");
  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    process.exit(1);
  }
}

void main();
