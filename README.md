# 个人播客网站

一个简洁美观的个人播客网站，支持音频文件上传、播放和管理。

## 功能特点

- 🎙️ 音频文件上传（支持 MP3, WAV, M4A 等格式）
- 🎵 在线音频播放
- 📝 播客标题和描述管理
- 🗑️ 播客删除功能
- 📱 响应式设计，支持手机和电脑访问
- 🎨 现代化美观界面

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

或者使用开发模式（自动重启）：
```bash
npm run dev
```

### 3. 访问网站
打开浏览器访问：`http://localhost:5000`

## 使用说明

### 上传播客
1. 在网站首页填写播客标题（必填）
2. 可选填写播客描述
3. 选择音频文件（支持拖拽上传）
4. 点击"上传播客"按钮

### 播放播客
- 在播客列表中点击播放按钮
- 或直接使用音频控制栏
- 支持暂停、进度调节等基本功能

### 管理播客
- 查看所有已上传的播客
- 删除不需要的播客（会同时删除音频文件）

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **前端**: 原生 HTML/CSS/JavaScript
- **文件上传**: Multer
- **样式**: 现代 CSS + Font Awesome 图标

## 文件结构

```
播客/
├── server.js          # 后端服务器
├── package.json       # 项目配置
├── podcast.db         # SQLite 数据库（运行后生成）
├── uploads/           # 上传的音频文件（运行后生成）
└── public/
    └── index.html     # 前端页面
```

## 配置说明

- 默认端口：5000
- 文件上传限制：100MB
- 支持的音频格式：所有浏览器支持的音频格式
- 数据库：自动创建 SQLite 数据库文件

## 注意事项

- 首次运行会自动创建数据库和上传目录
- 音频文件存储在 `uploads` 目录中
- 删除播客时会同时删除对应的音频文件
- 建议定期备份数据库文件和音频文件

## 部署

### 支持Node.js的平台（推荐）

由于这是一个完整的Node.js应用，推荐部署到以下平台：

#### 1. Render（免费，推荐）
1. 访问 [render.com](https://render.com)
2. 连接GitHub仓库
3. 选择 "Web Service"
4. 构建命令：`npm install`
5. 启动命令：`npm start`
6. 自动使用项目中的 `render.yaml` 配置

#### 2. Railway（免费额度）
1. 访问 [railway.app](https://railway.app)
2. 连接GitHub仓库
3. 自动检测Node.js项目并部署

#### 3. Vercel（支持Node.js API）
1. 访问 [vercel.com](https://vercel.com)
2. 连接GitHub仓库
3. 需要配置为Node.js应用

#### 4. Heroku（付费）
1. 安装Heroku CLI
2. 创建应用：`heroku create your-app-name`
3. 推送代码：`git push heroku main`

### ⚠️ 不支持的平台

- **Netlify**：只支持静态网站，不能运行Node.js服务器
- **GitHub Pages**：只支持静态网站

### 部署要求

- Node.js 环境
- 文件系统写入权限
- 持久化存储（用于数据库和上传文件）
