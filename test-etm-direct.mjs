#!/usr/bin/env node

/**
 * 直接测试 ETM Plus API 连接
 */

// 测试 ETM Plus API 健康检查
async function testEtmApi() {
  console.log("测试 ETM Plus API 连接...\n");

  try {
    // 健康检查
    const healthResponse = await fetch("http://localhost:8001/health");
    const healthData = await healthResponse.json();

    console.log("✅ 健康检查成功:");
    console.log(JSON.stringify(healthData, null, 2));

    // 测试发票上传（使用一个简单的测试文件）
    console.log("\n测试发票上传...");

    // 创建一个简单的测试 PDF 内容
    const testPdfContent = Buffer.from(
      "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n",
    );

    const formData = new FormData();
    formData.append("file", new Blob([testPdfContent]), "test-invoice.pdf");
    formData.append("applicant_id", "TestUser");
    formData.append("applicant_name", "测试用户");
    formData.append("payment_method", "个人");
    formData.append("description", "测试发票上传");

    const uploadResponse = await fetch("http://localhost:8001/api/v2/invoice/upload", {
      method: "POST",
      body: formData,
    });

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log("✅ 发票上传成功:");
      console.log(JSON.stringify(uploadData, null, 2));
    } else {
      const errorText = await uploadResponse.text();
      console.log(`❌ 发票上传失败 (${uploadResponse.status}):`);
      console.log(errorText);
    }

    // 测试审批回复
    console.log("\n测试审批回复推送...");

    const approvalPayload = {
      user_id: "TestUser",
      user_name: "测试用户",
      application_id: 1,
      choice: "1",
    };

    const approvalResponse = await fetch("http://localhost:8001/api/v2/wecom/approval-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(approvalPayload),
    });

    if (approvalResponse.ok) {
      const approvalData = await approvalResponse.json();
      console.log("✅ 审批回复推送成功:");
      console.log(JSON.stringify(approvalData, null, 2));
    } else {
      const errorText = await approvalResponse.text();
      console.log(`❌ 审批回复推送失败 (${approvalResponse.status}):`);
      console.log(errorText);
    }
  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    process.exit(1);
  }
}

void testEtmApi();
