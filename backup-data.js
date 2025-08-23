const fs = require('fs-extra');
const path = require('path');

// 数据备份脚本
async function backupData() {
  console.log('📦 开始备份播客数据...');
  
  const DATA_DIR = './data';
  const BACKUP_DIR = './backup';
  
  try {
    // 创建备份目录
    await fs.ensureDir(BACKUP_DIR);
    
    // 备份数据库
    if (await fs.pathExists(path.join(DATA_DIR, 'podcast.db'))) {
      await fs.copy(
        path.join(DATA_DIR, 'podcast.db'), 
        path.join(BACKUP_DIR, 'podcast.db')
      );
      console.log('✅ 数据库备份成功');
    }
    
    // 备份音频文件
    const uploadsDir = path.join(DATA_DIR, 'uploads');
    if (await fs.pathExists(uploadsDir)) {
      await fs.copy(uploadsDir, path.join(BACKUP_DIR, 'uploads'));
      const files = await fs.readdir(uploadsDir);
      console.log(`✅ 备份了 ${files.length} 个音频文件`);
    }
    
    console.log('🎉 数据备份完成！');
    console.log(`📁 备份位置: ${BACKUP_DIR}`);
    
  } catch (error) {
    console.error('❌ 备份失败:', error);
    process.exit(1);
  }
}

// 数据恢复脚本
async function restoreData() {
  console.log('🔄 开始恢复播客数据...');
  
  const DATA_DIR = './data';
  const BACKUP_DIR = './backup';
  
  try {
    if (!(await fs.pathExists(BACKUP_DIR))) {
      console.log('❌ 没有找到备份文件');
      return;
    }
    
    // 创建数据目录
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(path.join(DATA_DIR, 'uploads'));
    
    // 恢复数据库
    if (await fs.pathExists(path.join(BACKUP_DIR, 'podcast.db'))) {
      await fs.copy(
        path.join(BACKUP_DIR, 'podcast.db'), 
        path.join(DATA_DIR, 'podcast.db')
      );
      console.log('✅ 数据库恢复成功');
    }
    
    // 恢复音频文件
    const backupUploadsDir = path.join(BACKUP_DIR, 'uploads');
    if (await fs.pathExists(backupUploadsDir)) {
      await fs.copy(backupUploadsDir, path.join(DATA_DIR, 'uploads'));
      const files = await fs.readdir(backupUploadsDir);
      console.log(`✅ 恢复了 ${files.length} 个音频文件`);
    }
    
    console.log('🎉 数据恢复完成！');
    
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    process.exit(1);
  }
}

// 命令行参数处理
const command = process.argv[2];

if (command === 'backup') {
  backupData();
} else if (command === 'restore') {
  restoreData();
} else {
  console.log('用法:');
  console.log('  npm run backup   - 备份数据');
  console.log('  npm run restore  - 恢复数据');
}

module.exports = { backupData, restoreData };
