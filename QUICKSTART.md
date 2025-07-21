# 快速启动指南

## 1. 环境准备

### 确保MongoDB已安装并运行

```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 如果未运行，启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 检查Node.js环境

```bash
# 检查Node.js版本（需要16.0.0以上）
node --version

# 检查npm版本
npm --version
```

## 2. 项目配置

### 复制环境配置文件

```bash
cp config.env.example .env
```

### 编辑配置文件

编辑 `.env` 文件，主要配置以下内容：

```env
# Telegram Bot Token（必需）
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Telegram Chat ID（必需）
TELEGRAM_CHAT_ID=7786672932

# 数据库配置（本地MongoDB，无需认证）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=lottery
```

## 3. 安装依赖

```bash
npm install
```

## 4. 测试数据库连接

```bash
npm run test:db
```

如果看到 "✅ 数据库连接测试成功！" 说明配置正确。

## 5. 启动应用

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

## 6. 验证机器人

1. 在Telegram中找到您的机器人
2. 发送 `/start` 命令
3. 应该收到欢迎消息

## 常见问题

### 数据库连接失败

```bash
# 检查MongoDB是否运行
sudo systemctl status mongod

# 检查MongoDB端口
netstat -tlnp | grep 27017

# 手动连接MongoDB测试
mongosh
```

### 机器人无响应

1. 检查 `TELEGRAM_BOT_TOKEN` 是否正确
2. 确认机器人已启动（查看控制台日志）
3. 检查网络连接

### 权限问题

```bash
# 如果遇到权限问题，确保MongoDB数据目录权限正确
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

## 数据导入

如果要从现有JSON文件导入数据：

```bash
# 导入数据
node src/utils/dataMigration.js import data/serverData.json

# 验证数据
node src/utils/dataMigration.js validate
```

## 下一步

- 查看 [README.md](README.md) 了解详细功能
- 查看 [账单格式.md](账单格式.md) 了解数据格式
- 根据需要调整定时任务配置 