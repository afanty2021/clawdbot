# 发票处理技能（简化版）

## 使用方法

当用户通过企业微信发送发票文件时，AI 会：

1. **识别发票文件**：自动识别 PDF、JPG、PNG 格式的发票
2. **调用 ETM API**：使用 `etm_api` 工具上传发票
3. **发送审批消息**：向审批者发送审批请求

## 发票上传命令格式

当收到发票文件时，AI 应执行：

```json
{
  "action": "upload_invoice",
  "file_buffer": "<文件内容的base64编码>",
  "applicant_id": "<发送者用户ID>",
  "applicant_name": "<发送者姓名>",
  "payment_method": "个人",
  "description": "发票备注（可选）"
}
```

## 审批回复格式

当审批者回复数字时，AI 应执行：

```json
{
  "action": "approval_reply",
  "user_id": "<审批者用户ID>",
  "user_name": "<审批者姓名>",
  "application_id": <申请ID>,
  "choice": "<1|2|3>"
}
```

## 审批选项

- `1` = 立即报销
- `2` = 次月生成报销单
- `3` = 对公支付，无需报销

## 测试步骤

1. 发送普通消息（如 "hello"）测试基本响应
2. 发送发票文件测试发票处理
3. 作为审批者回复数字测试审批流程
