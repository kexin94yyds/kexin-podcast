const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { backupDatabase, restoreDatabase } = require('./db-backup');

// GitHub数据持久化配置  
const PODCASTS_DATA_FILE = './data/podcasts-data.json';

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary配置 - 已启用云存储
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('🌟 Cloudinary配置已加载:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  use_cloudinary: process.env.USE_CLOUDINARY
});

// 详细的Cloudinary诊断
console.log('🔍 详细诊断信息:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- USE_CLOUDINARY:', process.env.USE_CLOUDINARY);
console.log('- CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ 已设置' : '❌ 未设置');
console.log('- CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('- CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ 已设置' : '❌ 未设置');

const useCloudinary = process.env.USE_CLOUDINARY === 'true';
console.log('- useCloudinary 变量:', useCloudinary);

if (useCloudinary) {
  console.log('✅ 将使用Cloudinary存储');
} else {
  console.log('❌ 将使用本地存储 - 这可能是问题所在！');
}

// 数据存储路径配置
const DATA_DIR = process.env.NODE_ENV === 'production' ? './data' : './data';
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'podcast.db');

// GitHub数据持久化函数
function savePodcastToGitHub(podcast) {
  try {
    let data = { podcasts: [], lastUpdated: new Date().toISOString(), version: "1.0" };
    
    if (fs.existsSync(PODCASTS_DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(PODCASTS_DATA_FILE, 'utf8'));
    }
    
    // 添加新播客
    data.podcasts.push(podcast);
    data.lastUpdated = new Date().toISOString();
    
    // 保存到文件
    fs.writeFileSync(PODCASTS_DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 播客数据已保存到GitHub持久化文件');
    
    return true;
  } catch (error) {
    console.error('❌ 保存到GitHub失败:', error.message);
    return false;
  }
}

function loadPodcastsFromGitHub() {
  try {
    if (fs.existsSync(PODCASTS_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(PODCASTS_DATA_FILE, 'utf8'));
      console.log(`📂 从GitHub加载了 ${data.podcasts.length} 条播客记录`);
      return data.podcasts;
    }
  } catch (error) {
    console.error('❌ 从GitHub加载失败:', error.message);
  }
  return [];
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOADS_DIR));

// 确保数据目录和uploads目录存在
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(UPLOADS_DIR);

// 数据库设置
const db = new sqlite3.Database(DB_PATH);

// 创建播客表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS podcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    duration TEXT,
    filesize INTEGER,
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // 为现有表添加file_url字段（如果不存在）
  db.run(`ALTER TABLE podcasts ADD COLUMN file_url TEXT`, (err) => {
    // 忽略字段已存在的错误
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加file_url字段失败:', err.message);
    }
    
    // 数据库初始化完成后，尝试从备份恢复数据
    setTimeout(() => {
      restoreDatabase().then(count => {
        if (count > 0) {
          console.log(`🔄 已从备份恢复 ${count} 条播客记录`);
        }
      }).catch(err => {
        console.log('📝 没有备份文件或恢复失败，这是正常的（首次运行）');
      });
    }, 1000);
  });
});

// 文件上传配置
// useCloudinary 变量已在上面定义

let storage;
if (useCloudinary) {
  // Cloudinary存储配置
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'podcast-uploads',
      allowed_formats: ['mp3', 'wav', 'm4a', 'aac', 'ogg'],
      resource_type: 'video', // 音频文件使用video类型
    },
  });
} else {
  // 本地存储配置
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许音频文件
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传音频文件！'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB限制
  }
});

// API路由

// 获取所有播客
app.get('/api/podcasts', (req, res) => {
  // 优先从GitHub数据文件加载
  const githubPodcasts = loadPodcastsFromGitHub();
  
  if (githubPodcasts.length > 0) {
    console.log(`🎯 使用GitHub数据: ${githubPodcasts.length} 条播客`);
    res.json(githubPodcasts);
    return;
  }
  
  // 降级到数据库
  db.all('SELECT * FROM podcasts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`📊 使用数据库数据: ${rows.length} 条播客`);
    res.json(rows);
  });
});

// 获取单个播客
app.get('/api/podcasts/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM podcasts WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '播客未找到' });
      return;
    }
    res.json(row);
  });
});

// 上传播客
app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择音频文件' });
  }

  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: '请提供播客标题' });
  }

  // 获取文件信息
  const filename = useCloudinary ? (req.file.public_id || req.file.filename) : req.file.filename;
  const fileUrl = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
  
  // 调试日志
  console.log('📁 文件上传信息:', {
    useCloudinary,
    filename,
    fileUrl,
    originalname: req.file.originalname,
    size: req.file.size,
    cloudinary_path: req.file.path,
    cloudinary_public_id: req.file.public_id
  });
  
  // 验证必需字段
  if (!filename) {
    return res.status(400).json({ error: '文件名获取失败' });
  }
  
  const stmt = db.prepare(`INSERT INTO podcasts (title, description, filename, originalname, filesize, file_url) 
                          VALUES (?, ?, ?, ?, ?, ?)`);
  
  stmt.run([
    title,
    description || '',
    filename,
    req.file.originalname,
    req.file.size || 0,
    fileUrl
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 创建播客对象
    const podcast = {
      id: this.lastID,
      title: title,
      description: description || '',
      filename: filename,
      originalname: req.file.originalname,
      duration: null,
      filesize: req.file.size || 0,
      file_url: fileUrl,
      created_at: new Date().toISOString()
    };
    
    // 保存到GitHub持久化文件
    savePodcastToGitHub(podcast);
    
    // 同时备份数据库
    backupDatabase().then(() => {
      console.log('💾 数据库已自动备份');
    }).catch(err => {
      console.error('⚠️ 备份失败:', err.message);
    });
    
    res.json({
      id: this.lastID,
      message: '播客上传成功！',
      filename: req.file.filename
    });
  });
  
  stmt.finalize();
});

// 获取分享链接
app.get('/api/podcasts/:id/share', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM podcasts WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '播客未找到' });
      return;
    }
    
    // 生成分享链接
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${id}`;
    res.json({
      shareUrl: shareUrl,
      title: row.title,
      description: row.description
    });
  });
});

// 分享页面路由
app.get('/share/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM podcasts WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      res.status(404).send('播客未找到');
      return;
    }
    
    // 返回分享页面HTML
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${row.title} - 我的播客</title>
    <meta name="description" content="${row.description || '来听听这个播客'}">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            min-height: 100vh;
            color: white;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .share-container {
            text-align: center;
            max-width: 400px;
        }
        .share-cover {
            width: 200px;
            height: 200px;
            border-radius: 20px;
            background: linear-gradient(135deg, #ff7b7b, #667eea);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: white;
            margin: 0 auto 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .share-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .share-subtitle {
            color: #ffd700;
            margin-bottom: 30px;
        }
        .play-button {
            background: white;
            color: #333;
            border: none;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            font-size: 2rem;
            cursor: pointer;
            margin-bottom: 20px;
            transition: transform 0.2s ease;
        }
        .play-button:hover {
            transform: scale(1.05);
        }
        .audio-controls {
            width: 100%;
            margin-top: 20px;
        }
        audio {
            width: 100%;
            margin-top: 20px;
        }
        .back-link {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            text-decoration: none;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> 返回首页</a>
    <div class="share-container">
        <div class="share-cover">🎙️</div>
        <div class="share-title">${row.title}</div>
        <div class="share-subtitle">我的播客</div>
        ${row.description ? `<p style="color: #ccc; margin-bottom: 30px;">${row.description}</p>` : ''}
        <button class="play-button" onclick="togglePlay()">
            <i class="fas fa-play" id="playIcon"></i>
        </button>
        <audio controls id="audioPlayer">
            <source src="/uploads/${row.filename}" type="audio/mpeg">
            您的浏览器不支持音频播放
        </audio>
    </div>
    
    <script>
        const audio = document.getElementById('audioPlayer');
        const playIcon = document.getElementById('playIcon');
        const playButton = document.querySelector('.play-button');
        
        function togglePlay() {
            if (audio.paused) {
                audio.play();
                playIcon.className = 'fas fa-pause';
            } else {
                audio.pause();
                playIcon.className = 'fas fa-play';
            }
        }
        
        audio.addEventListener('play', () => {
            playIcon.className = 'fas fa-pause';
        });
        
        audio.addEventListener('pause', () => {
            playIcon.className = 'fas fa-play';
        });
        
        audio.addEventListener('ended', () => {
            playIcon.className = 'fas fa-play';
        });
    </script>
</body>
</html>
    `);
  });
});

// 删除播客
app.delete('/api/podcasts/:id', (req, res) => {
  const id = req.params.id;
  
  // 先获取文件信息
  db.get('SELECT filename FROM podcasts WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: '播客未找到' });
      return;
    }
    
    // 删除文件
    const filePath = path.join(UPLOADS_DIR, row.filename);
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error('删除文件失败:', unlinkErr);
      }
    });
    
    // 从数据库删除记录
    db.run('DELETE FROM podcasts WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '播客删除成功' });
    });
  });
});

// 上传页面路由
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// 健康检查端点 - 用于外部监控服务
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// 简单的ping端点
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// 服务前端静态文件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 优雅关闭数据库连接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});
