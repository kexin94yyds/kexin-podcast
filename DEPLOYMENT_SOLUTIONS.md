# 播客数据持久化解决方案

## 🚨 问题原因
Render免费计划**不支持持久化存储**，每次服务重启（每天自动重启）都会清空数据。

## 💡 解决方案

### 方案1：升级到付费计划（推荐）
```yaml
# render.yaml
services:
  - type: web
    name: kexin-podcast
    env: node
    plan: starter  # $7/月，支持持久化存储
    buildCommand: npm ci && npm rebuild sqlite3
    startCommand: npm start
    disk:
      name: kexin-podcast-data
      mountPath: /opt/render/project/src/data
      sizeGB: 1
```

### 方案2：使用免费的外部数据库
1. **PostgreSQL** (推荐)
   - [Supabase](https://supabase.com) - 免费500MB
   - [Neon](https://neon.tech) - 免费3GB
   - [Railway](https://railway.app) - 免费500MB

2. **文件存储**
   - [Cloudinary](https://cloudinary.com) - 免费10GB
   - [AWS S3](https://aws.amazon.com/s3/) - 免费5GB

### 方案3：更换部署平台
1. **Railway** - 免费计划支持持久化存储
2. **Fly.io** - 免费计划包含持久化卷
3. **Heroku** - 付费计划支持持久化存储

### 方案4：定期备份恢复（临时方案）
```bash
# 每天手动备份
npm run backup

# 数据丢失后恢复
npm run restore
```

## 🎯 推荐方案

### 立即解决（免费）：
1. 注册 [Supabase](https://supabase.com)
2. 创建PostgreSQL数据库
3. 修改代码使用外部数据库
4. 音频文件使用Cloudinary存储

### 长期解决（付费）：
升级Render到Starter计划（$7/月），获得真正的持久化存储。

## 🔧 实施步骤

### 使用Supabase（免费方案）：
1. 注册Supabase账号
2. 创建新项目
3. 获取数据库连接字符串
4. 修改代码使用PostgreSQL
5. 部署更新

### 升级Render（付费方案）：
1. 登录Render控制台
2. 升级到Starter计划
3. 重新部署应用
4. 数据将永久保存

你想选择哪种方案？
