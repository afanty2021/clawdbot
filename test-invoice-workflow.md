# 发票审批流程测试指南

## 当前状态

✅ **已完成**:

- ETM Plus API 工具已实现（`src/agents/tools/etm-api-tool.ts`）
- 审批状态管理器已实现（`src/agents/sessions/approval-state.ts`）
- 发票审批技能已创建（`skills/invoice-approval/instructions.md`）
- 配置系统已更新（支持 ETM 配置）
- 网关正在运行（PID 71031）
- ETM Plus API 正常运行（localhost:8001）
- 企业微信插件已安装并启用（@wecom/wecom-openclaw-plugin v2026.3.20）

⚠️ **待验证**:

- 企业微信消息接收功能
- 发票文件提取功能
- 完整的审批流程端到端测试

## 测试步骤

### 1. 验证 ETM Plus API 连接

```bash
# 运行直接 API 测试
node test-etm-direct.mjs
```

**预期结果**:

- ✅ 健康检查成功
- ✅ 发票上传端点响应
- ✅ 审批回复端点响应

### 2. 测试企业微信消息接收

1. 通过企业微信发送一条文本消息到已配置的账号
2. 观察网关是否收到消息
3. 检查是否有响应

**发送测试消息**:

```
测试消息：你好 OpenClaw
```

### 3. 测试发票上传流程

1. 通过企业微信发送一张发票图片或 PDF 文件
2. 观察以下步骤是否自动执行：
   - 文件接收和保存
   - ETM Plus API 上传
   - 审批消息发送给审批者

**测试发票文件**:

- 发送一张真实的发票图片（JPG/PNG）
- 或发送一个发票 PDF 文件

### 4. 测试审批回复流程

1. 审批者收到审批消息
2. 审批者回复数字选项（1、2 或 3）
3. 观察以下步骤是否自动执行：
   - 回复接收和验证
   - ETM Plus API 推送审批结果
   - 申请人收到结果通知

**审批选项**:

- `1` = 立即报销
- `2` = 次月生成报销单
- `3` = 对公支付，无需报销

## 配置信息

### ETM Plus API

- **地址**: http://localhost:8001
- **健康检查**: http://localhost:8001/health
- **发票上传**: POST /api/v2/invoice/upload
- **审批回复**: POST /api/v2/wecom/approval-reply

### 企业微信配置

- **插件**: @wecom/wecom-openclaw-plugin v2026.3.20
- **状态**: configured, enabled
- **审批者**: HuangZhengBo
- **超时时间**: 24 小时

### 网关配置

- **端口**: 18789
- **Web 界面**: http://localhost:18789
- **状态**: 运行中（PID 71031）

## 故障排除

### 问题 1: 企业微信消息无响应

**可能原因**:

1. 企业微信配置未正确设置
2. 网关未正确监听企业微信消息
3. 技能未正确触发

**解决方法**:

1. 检查 `~/.config/openclaw/openclaw.json` 中的企业微信配置
2. 查看网关日志：`tail -f /tmp/openclaw-gateway.log`
3. 验证企业微信插件是否正确加载

### 问题 2: 发票上传失败

**可能原因**:

1. ETM Plus API 不可达
2. 文件格式不支持
3. API 参数错误

**解决方法**:

1. 确认 ETM Plus API 正在运行：`curl http://localhost:8001/health`
2. 检查文件格式（支持 PDF、JPG、PNG）
3. 查看 ETM Plus API 日志

### 问题 3: 审批回复推送失败

**可能原因**:

1. application_id 不正确
2. ETM Plus API 数据库配置问题
3. 审批者权限问题

**解决方法**:

1. 确认 application_id 是从发票上传响应中获取的
2. 检查 ETM Plus API 数据库配置
3. 验证审批者 ID 是否正确

## 下一步

1. **配置企业微信应用**: 确保企业微信应用正确配置并有权接收消息
2. **测试完整流程**: 从发票接收到审批完成
3. **优化技能指令**: 根据实际测试结果调整技能逻辑
4. **添加错误处理**: 增强错误处理和用户提示

## 相关文件

- **ETM API 工具**: `src/agents/tools/etm-api-tool.ts`
- **审批状态管理**: `src/agents/sessions/approval-state.ts`
- **发票审批技能**: `skills/invoice-approval/instructions.md`
- **配置文件**: `~/.config/openclaw/openclaw.json`
- **测试脚本**: `test-etm-direct.mjs`

## 技术支持

如遇到问题，请检查：

1. 网关日志
2. ETM Plus API 日志 (`/tmp/openclaw_api.log`)
3. 企业微信应用日志
