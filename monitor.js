// 播客服务监控脚本
// 可以部署到 UptimeRobot、Cron-job.org 等免费监控服务

const TARGET_URL = 'https://kexin-podcast.onrender.com';
const ENDPOINTS = ['/healthz', '/ping', '/api/podcasts'];

async function checkHealth() {
  console.log(`🔍 开始检查服务健康状态: ${new Date().toISOString()}`);
  
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(`${TARGET_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Podcast-Monitor/1.0'
        },
        timeout: 10000 // 10秒超时
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - 状态: ${response.status}`);
        
        if (endpoint === '/healthz') {
          const data = await response.json();
          console.log(`📊 服务信息:`, {
            uptime: `${Math.round(data.uptime / 60)}分钟`,
            memory: `${Math.round(data.memory.heapUsed / 1024 / 1024)}MB`,
            timestamp: data.timestamp
          });
        }
      } else {
        console.log(`⚠️  ${endpoint} - 状态: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - 错误: ${error.message}`);
    }
  }
  
  console.log(`🏁 健康检查完成: ${new Date().toISOString()}\n`);
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  checkHealth();
}

// 导出函数供其他环境使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkHealth };
}
