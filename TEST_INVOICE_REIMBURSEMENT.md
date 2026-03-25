# 发票报销申请流程测试计划

## 测试目标

验证 OpenClaw 网关与 ETM Plus 系统的完整发票报销审批流程集成。

## 更新内容

### 2026-03-23 - 添加创建报销申请功能

**文件更改**：

1. `src/agents/tools/etm-api-tool.ts` - 添加 `create_reimbursement_application` 操作
2. `skills/invoice-approval/skill.json` - 添加新能力声明
3. `skills/invoice-approval/SKILL.md` - 更新处理流程文档

**新增功能**：

- `etm_api` 工具支持 `create_reimbursement_application` 操作
- 上传发票后自动创建报销申请
- 传递参数：`invoice_id`、`applicant_id`、`applicant_name`、`amount`、`approver_id`

## 测试场景

### 场景 1：完整报销申请流程

**步骤**：

1. 通过企业微信发送发票 PDF 文件
2. 验证 `upload_invoice` 调用成功，返回 `invoice_id`、`amount` 等
3. 验证 `create_reimbursement_application` 调用成功
4. 验证创建报销申请时传递的参数：
   - `invoice_id`: 从 upload_invoice 响应获取
   - `applicant_id`: 发送者企业微信 UserID
   - `applicant_name`: 发送者姓名
   - `amount`: 发票金额
   - `approver_id`: 审批者 UserID (HuangZhengBo)
5. 验证审批者收到审批消息
6. 审批者回复数字 1/2/3
7. 验证 `approval_reply` 调用成功
8. 验证申请人收到审批结果通知

**预期结果**：

```
发票上传 → 创建报销申请 → 发送审批消息 → 接收审批回复 → 推送审批结果 → 通知申请人
```

### 场景 2：参数验证

**测试参数**：

```json
{
  "action": "create_reimbursement_application",
  "invoice_id": 123,
  "applicant_id": "HuangZhengBo",
  "applicant_name": "黄正波",
  "amount": 100.5,
  "approver_id": "HuangZhengBo",
  "description": "办公用品采购"
}
```

**验证点**：

- invoice_id 必须是数字
- amount 必须是数字
- applicant_id、applicant_name、approver_id 必须为字符串
- description 可选

### 场景 3：错误处理

**测试用例**：

1. invoice_id 缺失 - 应报错
2. amount 不是数字 - 应报错
3. approver_id 缺失 - 应报错
4. ETM Plus API 不可用 - 应返回错误消息

## 测试命令

### 1. 检查工具注册

```bash
# 查看网关日志，确认工具已加载
tail -f ~/.openclaw/logs/gateway.log | grep -E "etm|ETM"
```

### 2. 检查技能加载

```bash
# 查看技能是否加载
tail -f ~/.openclaw/logs/gateway.log | grep "invoice-approval"
```

### 3. 发送测试发票

通过企业微信发送发票 PDF 文件到配置的群组或个人

### 4. 查看日志

```bash
# 实时查看网关日志
tail -f ~/.openclaw/logs/gateway.log

# 筛选发票相关日志
tail -f ~/.openclaw/logs/gateway.log | grep -E "invoice|reimbursement|审批"

# 筛选 ETM API 日志
tail -f ~/.openclaw/logs/gateway.log | grep -E "\[ETM"
```

## 日志关键词

**成功流程**：

- `[ETM API] POST http://localhost:8001/api/v2/invoice/upload`
- `[ETM API] Response: {"success":true,"data":{"invoice_id":...}}`
- `[ETM API] POST http://localhost:8001/api/v2/reimbursement/create-application`
- `[ETM API] Response: {"success":true,"data":{"application_id":...}}`
- `[wecom] 发送审批消息给 HuangZhengBo`
- `[ETM API] POST http://localhost:8001/api/v2/wecom/approval-reply`

**错误情况**：

- `[ETM API] Request failed`
- `[ETM API] 失败：invoice_id 必须是数字`
- `[ETM API] 失败：amount 必须是数字`

## 验收标准

- [ ] 发票上传成功，返回 invoice_id 和发票详情
- [ ] 创建报销申请成功，返回 application_id
- [ ] 审批者收到包含三个选项的审批消息
- [ ] 审批者回复数字后，审批结果成功推送到 ETM Plus
- [ ] 申请人收到审批结果通知
- [ ] 所有错误情况都有适当的错误处理

## 已知问题

无（待测试发现问题）

## 测试记录

### 2026-03-23

**状态**：代码已更新，等待测试

**更改**：

- ✅ etm-api-tool.ts 添加 create_reimbursement_application 支持
- ✅ skill.json 添加能力声明
- ✅ SKILL.md 更新处理流程
- ✅ 构建成功，网关已重启

**下一步**：

1. 通过企业微信发送测试发票
2. 观察日志验证完整流程
3. 记录测试结果
