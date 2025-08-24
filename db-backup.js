const sqlite3 = require('sqlite3').verbose();
const fs = require('fs-extra');
const path = require('path');

// 数据存储路径配置
const DATA_DIR = './data';
const DB_PATH = path.join(DATA_DIR, 'podcast.db');
const BACKUP_FILE = path.join(DATA_DIR, 'podcasts-backup.json');

// 备份数据库到JSON文件
function backupDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.all('SELECT * FROM podcasts ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        console.error('❌ 备份失败:', err.message);
        reject(err);
        return;
      }
      
      const backup = {
        timestamp: new Date().toISOString(),
        podcasts: rows
      };
      
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
      console.log(`✅ 数据库已备份到 ${BACKUP_FILE}`);
      console.log(`📊 备份了 ${rows.length} 条播客记录`);
      resolve(rows.length);
    });
    
    db.close();
  });
}

// 从JSON文件恢复数据库
function restoreDatabase() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.log('📝 没有找到备份文件，跳过恢复');
      resolve(0);
      return;
    }
    
    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    const db = new sqlite3.Database(DB_PATH);
    
    // 清空现有数据
    db.run('DELETE FROM podcasts', (err) => {
      if (err) {
        console.error('❌ 清空数据库失败:', err.message);
        reject(err);
        return;
      }
      
      // 恢复数据
      const stmt = db.prepare(`INSERT INTO podcasts 
        (id, title, description, filename, originalname, duration, filesize, file_url, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      let restored = 0;
      backup.podcasts.forEach(podcast => {
        stmt.run([
          podcast.id,
          podcast.title,
          podcast.description,
          podcast.filename,
          podcast.originalname,
          podcast.duration,
          podcast.filesize,
          podcast.file_url,
          podcast.created_at
        ], (err) => {
          if (!err) restored++;
        });
      });
      
      stmt.finalize(() => {
        console.log(`✅ 从备份恢复了 ${restored} 条播客记录`);
        console.log(`📅 备份时间: ${backup.timestamp}`);
        resolve(restored);
      });
    });
    
    db.close();
  });
}

module.exports = { backupDatabase, restoreDatabase };

// 如果直接运行此脚本
if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'backup') {
    backupDatabase().catch(console.error);
  } else if (action === 'restore') {
    restoreDatabase().catch(console.error);
  } else {
    console.log('用法: node db-backup.js [backup|restore]');
  }
}
