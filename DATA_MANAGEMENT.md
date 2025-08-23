# 播客数据管理指南

## 问题说明
当你修改代码并重新部署时，播客数据可能会丢失。这是因为：
1. 本地开发的数据存储在本地 `data/` 目录
2. 生产环境使用持久化磁盘存储
3. 两者之间需要手动同步

## 解决方案

### 1. 数据备份（在修改代码前）
```bash
npm run backup
```
这会将你的播客数据备份到 `backup/` 目录。

### 2. 数据恢复（在部署后）
```bash
npm run restore
```
这会从备份中恢复你的播客数据。

### 3. 完整工作流程

#### 修改代码前：
```bash
# 1. 备份当前数据
npm run backup

# 2. 修改你的代码
# ...

# 3. 提交并推送
git add .
git commit -m "你的修改说明"
git push origin main
```

#### 部署后（如果数据丢失）：
```bash
# 1. 恢复数据
npm run restore

# 2. 重启服务器
npm start
```

## 数据存储位置

### 本地开发
- 数据库: `./data/podcast.db`
- 音频文件: `./data/uploads/`

### 生产环境（Render）
- 数据库: `/opt/render/project/src/data/podcast.db`
- 音频文件: `/opt/render/project/src/data/uploads/`

## 注意事项

1. **备份文件不会被提交到GitHub**（因为音频文件太大）
2. **每次重要修改前都要备份**
3. **如果你有很多播客，建议定期下载备份**
4. **生产环境的持久化存储会自动保存数据**

## 紧急恢复

如果你的播客完全丢失了：
1. 检查 `backup/` 目录是否有备份
2. 运行 `npm run restore`
3. 如果没有备份，只能重新上传播客

## 最佳实践

1. **开发时定期备份**: `npm run backup`
2. **测试新功能前备份**
3. **重要播客上传后立即备份**
4. **保存重要播客的原始文件**
