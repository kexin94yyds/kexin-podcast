const fs = require('fs-extra');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 数据初始化脚本
async function initData() {
  console.log('🚀 初始化数据目录...');
  
  const DATA_DIR = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/data' : './data';
  const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
  const DB_PATH = path.join(DATA_DIR, 'podcast.db');
  
  try {
    // 确保目录存在
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(UPLOADS_DIR);
    console.log('✅ 数据目录创建成功');
    
    // 检查数据库是否存在，如果不存在则创建
    if (!(await fs.pathExists(DB_PATH))) {
      console.log('📦 创建新数据库...');
      const db = new sqlite3.Database(DB_PATH);
      
      await new Promise((resolve, reject) => {
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
          )`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        db.close();
      });
      
      console.log('✅ 数据库初始化成功');
    } else {
      console.log('✅ 数据库已存在');
    }
    
    console.log('🎉 数据初始化完成！');
    console.log(`📁 数据目录: ${DATA_DIR}`);
    console.log(`📁 上传目录: ${UPLOADS_DIR}`);
    console.log(`📁 数据库: ${DB_PATH}`);
    
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  initData();
}

module.exports = initData;
