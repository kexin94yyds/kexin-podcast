// Cloudinary诊断脚本
console.log('🔍 Cloudinary环境诊断');
console.log('==================');

console.log('环境变量检查:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_CLOUDINARY:', process.env.USE_CLOUDINARY);
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ 已设置' : '❌ 未设置');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ 已设置' : '❌ 未设置');

console.log('\n逻辑检查:');
const useCloudinary = process.env.USE_CLOUDINARY === 'true';
console.log('useCloudinary 变量:', useCloudinary);

if (useCloudinary) {
  console.log('✅ 应该使用Cloudinary存储');
  
  // 尝试初始化Cloudinary
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    console.log('✅ Cloudinary配置已加载');
    console.log('Cloud Name:', cloudinary.config().cloud_name);
    
    // 测试连接
    cloudinary.api.ping()
      .then(result => {
        console.log('✅ Cloudinary连接测试成功:', result);
      })
      .catch(error => {
        console.error('❌ Cloudinary连接测试失败:', error.message);
      });
      
  } catch (error) {
    console.error('❌ Cloudinary初始化失败:', error.message);
  }
} else {
  console.log('❌ 使用本地存储（这就是问题所在！）');
}

console.log('\n建议:');
if (!useCloudinary) {
  console.log('1. 检查Render环境变量 USE_CLOUDINARY 是否设置为 "true"');
  console.log('2. 检查其他Cloudinary环境变量是否正确设置');
  console.log('3. 重新部署应用');
}
