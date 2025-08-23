# Cloudinary 配置指南

## 🎯 目标
使用Cloudinary免费10GB存储来保存音频文件，解决Render重启时文件丢失的问题。

## 📋 配置步骤

### 1. 注册Cloudinary账号
1. 访问 [cloudinary.com](https://cloudinary.com)
2. 点击 "Sign up for free"
3. 填写信息并验证邮箱

### 2. 获取配置信息
登录后在Dashboard页面找到：
- **Cloud Name**: 你的云名称
- **API Key**: API密钥
- **API Secret**: API密钥（保密）

### 3. 在Render中配置环境变量
1. 登录 [render.com](https://render.com)
2. 进入你的播客服务
3. 点击 "Environment" 标签
4. 添加以下环境变量：

```
CLOUDINARY_CLOUD_NAME = 你的Cloud Name
CLOUDINARY_API_KEY = 你的API Key  
CLOUDINARY_API_SECRET = 你的API Secret
USE_CLOUDINARY = true
```

### 4. 重新部署
1. 推送代码到GitHub
2. Render会自动重新部署
3. 新上传的音频文件将保存到Cloudinary

## 🔄 工作原理

### 本地开发
- `USE_CLOUDINARY=false` (默认)
- 文件保存在本地 `data/uploads/` 目录

### 生产环境
- `USE_CLOUDINARY=true`
- 文件上传到Cloudinary云存储
- 数据库保存Cloudinary的URL

## ✅ 验证配置

上传一个音频文件后：
1. 检查Cloudinary控制台是否有文件
2. 播放音频是否正常
3. 重启服务后音频是否还在

## 🎉 优势

- ✅ **永久存储**: 文件不会因服务重启丢失
- ✅ **免费10GB**: 足够存储大量播客
- ✅ **全球CDN**: 音频加载更快
- ✅ **自动备份**: Cloudinary提供数据备份

## 🔧 故障排除

### 上传失败
- 检查环境变量是否正确设置
- 确认API密钥有效
- 查看服务器日志

### 音频无法播放
- 检查file_url字段是否正确
- 确认Cloudinary URL可访问
- 检查浏览器控制台错误

## 📊 使用监控

在Cloudinary控制台可以查看：
- 存储使用量
- 带宽使用量
- 文件数量
- 访问统计
