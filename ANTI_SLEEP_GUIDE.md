# 🚀 防止Render休眠指南

## 🎯 目标
让您的播客服务24/7在线，避免15分钟无访问后的休眠问题。

## 📋 已实施的解决方案

### 1. 健康检查端点
已在服务器中添加了以下端点：
- `https://kexin-podcast.onrender.com/healthz` - 详细健康状态
- `https://kexin-podcast.onrender.com/ping` - 简单ping响应
- `https://kexin-podcast.onrender.com/api/podcasts` - 播客API

### 2. 免费监控服务设置

#### 方案A：UptimeRobot（推荐）
1. 访问 [uptimerobot.com](https://uptimerobot.com)
2. 注册免费账号
3. 添加新监控：
   - **监控类型**: HTTP(s)
   - **URL**: `https://kexin-podcast.onrender.com/ping`
   - **检查间隔**: 5分钟
   - **超时**: 10秒
   - **重试**: 3次

#### 方案B：Cron-job.org
1. 访问 [cron-job.org](https://cron-job.org)
2. 注册免费账号
3. 创建新任务：
   - **URL**: `https://kexin-podcast.onrender.com/healthz`
   - **执行间隔**: 每5分钟
   - **超时**: 10秒

#### 方案C：GitHub Actions（免费）
在您的GitHub仓库中创建 `.github/workflows/keep-alive.yml`：

```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/5 * * * *'  # 每5分钟执行
  workflow_dispatch:  # 手动触发

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Service
        run: |
          curl -f https://kexin-podcast.onrender.com/ping || exit 1
          echo "Service is alive!"
```

## 🔧 测试健康检查

### 本地测试
```bash
# 测试健康检查端点
curl https://kexin-podcast.onrender.com/healthz

# 测试ping端点
curl https://kexin-podcast.onrender.com/ping

# 测试播客API
curl https://kexin-podcast.onrender.com/api/podcasts
```

### 预期响应
- `/healthz`: JSON格式的详细服务状态
- `/ping`: 简单的"pong"响应
- `/api/podcasts`: 播客列表（当前为空）

## 📊 监控效果

### 优势
- ✅ **完全免费**: 使用免费监控服务
- ✅ **24/7在线**: 每5分钟唤醒一次服务
- ✅ **自动恢复**: 服务休眠后立即被唤醒
- ✅ **详细监控**: 可查看服务状态和性能

### 注意事项
- ⚠️ **Render政策**: 官方未明确允许此做法
- ⚠️ **免费额度**: 每月750小时免费实例时间
- ⚠️ **长期稳定性**: 建议定期检查监控状态

## 🎉 预期结果

设置完成后：
1. 您的播客服务将保持24/7在线
2. 首次访问不再有延迟
3. 音频文件可以随时访问
4. 用户体验显著改善

## 🔄 备用方案

如果监控方案失效，可以考虑：
1. 升级到Render付费计划
2. 迁移到Fly.io（免费层不休眠）
3. 使用静态站点 + 外部存储

## 📞 技术支持

如果遇到问题：
1. 检查监控服务是否正常运行
2. 验证健康检查端点是否响应
3. 查看Render服务日志
4. 考虑调整监控间隔（建议5-10分钟）

---

**提示**: 建议先使用UptimeRobot，它是最稳定和用户友好的免费监控服务。
