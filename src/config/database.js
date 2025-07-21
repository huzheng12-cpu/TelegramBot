const mongoose = require('mongoose');
require('dotenv').config();

const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_DATABASE,
  MONGODB_USERNAME,
  MONGODB_PASSWORD
} = process.env;

// 构建连接字符串
const buildConnectionString = () => {
  if (MONGODB_USERNAME && MONGODB_PASSWORD) {
    return `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;
  }
  return `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
};

// 连接配置
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  authSource: 'admin'
};

// 连接数据库
const connectDatabase = async () => {
  try {
    const connectionString = buildConnectionString();
    await mongoose.connect(connectionString, connectOptions);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
};

// 监听连接事件
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose 连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose 连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose 连接断开');
});

// 优雅关闭
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ 应用程序终止，关闭数据库连接');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error);
    process.exit(1);
  }
});

module.exports = { connectDatabase }; 