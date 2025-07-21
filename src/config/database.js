const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// 构建连接字符串
const buildConnectionString = () => {
  const { host, port, name, username, password } = config.database;

  // 如果有用户名和密码，使用认证连接
  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${name}?authSource=admin`;
  }

  // 无认证连接
  return `mongodb://${host}:${port}/${name}`;
};

// 连接配置（移除已弃用的选项）
const connectOptions = {
  serverSelectionTimeoutMS: 5000
};

// 连接数据库
const connectDatabase = async () => {
  try {
    const connectionString = buildConnectionString();
    await mongoose.connect(connectionString, connectOptions);
    logger.info('数据库连接成功', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      auth: !!(config.database.username && config.database.password)
    });
  } catch (error) {
    logger.error('数据库连接失败', { error: error.message });
    process.exit(1);
  }
};

// 监听连接事件
mongoose.connection.on('connected', () => {
  logger.info('Mongoose 连接成功');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose 连接错误', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose 连接断开');
});

// 优雅关闭
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('应用程序终止，关闭数据库连接');
    process.exit(0);
  } catch (error) {
    logger.error('关闭数据库连接失败', { error: error.message });
    process.exit(1);
  }
});

module.exports = { connectDatabase }; 