const fs = require('fs-extra');
const path = require('path');

// 数据迁移脚本
async function migrateData() {
  console.log('🚀 开始数据迁移...');
  
  const DATA_DIR = './data';
  const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
  
  try {
    // 创建新的数据目录
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(UPLOADS_DIR);
    console.log('✅ 创建数据目录成功');
    
    // 迁移数据库文件
    if (await fs.pathExists('./podcast.db')) {
      await fs.copy('./podcast.db', path.join(DATA_DIR, 'podcast.db'));
      console.log('✅ 数据库文件迁移成功');
    } else {
      console.log('ℹ️  没有找到现有数据库文件');
    }
    
    // 迁移上传文件
    if (await fs.pathExists('./uploads')) {
      const files = await fs.readdir('./uploads');
      for (const file of files) {
        if (file !== '.gitkeep') {
          await fs.copy(path.join('./uploads', file), path.join(UPLOADS_DIR, file));
        }
      }
      console.log(`✅ 迁移了 ${files.filter(f => f !== '.gitkeep').length} 个音频文件`);
    } else {
      console.log('ℹ️  没有找到现有上传文件');
    }
    
    console.log('🎉 数据迁移完成！');
    console.log('📁 新的数据存储位置：');
    console.log(`   数据库: ${path.join(DATA_DIR, 'podcast.db')}`);
    console.log(`   音频文件: ${UPLOADS_DIR}`);
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    process.exit(1);
  }
}

// 运行迁移
if (require.main === module) {
  migrateData();
}

module.exports = migrateData;
