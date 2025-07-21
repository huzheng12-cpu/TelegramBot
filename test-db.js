const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');

  // 数据库配置
  const dbConfig = {
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || 27017,
    name: process.env.MONGODB_DATABASE || 'lottery',
    username: process.env.MONGODB_USERNAME,
    password: process.env.MONGODB_PASSWORD
  };

  console.log('📋 配置信息:');
  console.log(`   - 主机: ${dbConfig.host}`);
  console.log(`   - 端口: ${dbConfig.port}`);
  console.log(`   - 数据库: ${dbConfig.name}`);
  console.log(`   - 认证: ${dbConfig.username && dbConfig.password ? '是' : '否'}`);
  console.log('');

  try {
    // 构建连接字符串
    let connectionString;
    if (dbConfig.username && dbConfig.password) {
      connectionString = `mongodb://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}?authSource=admin`;
    } else {
      connectionString = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`;
    }

    console.log('🔗 连接字符串:', connectionString.replace(/\/\/.*@/, '//***:***@'));

    // 连接数据库（移除弃用选项）
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ 数据库连接测试成功！');

    // 测试数据库操作
    const Project = require('./src/models/Project');

    // 测试查询
    const count = await Project.countDocuments();
    console.log(`📊 当前数据库中有 ${count} 个项目`);

    // 关闭连接
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');

  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    console.log('');
    console.log('💡 可能的解决方案:');
    console.log('   1. 确保MongoDB服务正在运行');
    console.log('   2. 检查MongoDB端口是否正确');
    console.log('   3. 确认数据库名称是否正确');
    console.log('   4. 如果使用认证，检查用户名密码');
    console.log('');
    console.log('🔧 启动MongoDB的命令:');
    console.log('   Ubuntu/Debian: sudo systemctl start mongod');
    console.log('   macOS: brew services start mongodb-community');
    console.log('   Windows: net start MongoDB');
    process.exit(1);
  }
}

// 运行测试
testDatabaseConnection(); 