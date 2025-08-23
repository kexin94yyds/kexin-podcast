const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 数据存储路径配置
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/data' : './data';
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'podcast.db');

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

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
  db.all('SELECT * FROM podcasts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
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

  const stmt = db.prepare(`INSERT INTO podcasts (title, description, filename, originalname, filesize) 
                          VALUES (?, ?, ?, ?, ?)`);
  
  stmt.run([
    title,
    description || '',
    req.file.filename,
    req.file.originalname,
    req.file.size
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
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
