// 测试Cloudinary配置
const cloudinary = require('cloudinary').v2;

// 配置Cloudinary（使用你的实际配置）
cloudinary.config({
  cloud_name: 'dnathica2',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
});

console.log('🧪 测试Cloudinary配置...');
console.log('Cloud Name:', cloudinary.config().cloud_name);
console.log('API Key:', cloudinary.config().api_key ? '已设置' : '未设置');
console.log('API Secret:', cloudinary.config().api_secret ? '已设置' : '未设置');

// 测试连接
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary连接成功:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary连接失败:', error.message);
  });

// 列出现有文件
cloudinary.api.resources({
  type: 'upload',
  prefix: 'podcast-uploads/',
  max_results: 10
})
  .then(result => {
    console.log('📁 现有文件数量:', result.resources.length);
    result.resources.forEach(file => {
      console.log('  -', file.public_id, file.secure_url);
    });
  })
  .catch(error => {
    console.error('❌ 获取文件列表失败:', error.message);
  });
