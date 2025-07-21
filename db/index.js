const mongoose = require("mongoose");

// 数据库连接信息
const hostname = '47.76.229.204';
const port = 27017;
const dbname = "lottery";
const username = 'admin';  // 替换为实际用户名
const password = 'admin123';  // 替换为实际密码

// 构建包含认证信息的连接字符串
const CONN_DB_STR = `mongodb://${username}:${password}@${hostname}:${port}/${dbname}?authSource=admin`;

// 连接配置
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  authSource: 'admin'  // 指定认证数据库
};

// 连接数据库
mongoose.connect(CONN_DB_STR, connectOptions)
  .then(() => console.log("数据库连接成功"))
  .catch(err => console.error("数据库连接失败:", err));

// 监听连接事件
mongoose.connection.on('connected', () => console.log('Mongoose 连接成功'));
mongoose.connection.on('error', (err) => console.error('Mongoose 连接错误:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose 连接断开'));

// 确保应用程序正常关闭时断开数据库连接
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('应用程序终止，关闭数据库连接');
  process.exit(0);
});
