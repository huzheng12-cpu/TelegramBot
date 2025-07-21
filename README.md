# Telegram 服务器到期提醒机器人

一个基于 Node.js 和 Telegraf 的 Telegram 机器人，用于管理服务器到期提醒和费用统计。

## 功能特性

- 📋 **项目列表管理** - 查看所有项目，支持分页浏览
- 💰 **费用统计** - 按月统计维护费用，区分已收和未收
- 📊 **项目详情** - 查看单个项目的详细信息和维护记录
- 🔔 **自动提醒** - 定时检查即将到期的支付，自动发送提醒
- 📈 **数据统计** - 提供详细的费用统计和项目明细
- 🗄️ **数据持久化** - 使用 MongoDB 存储数据，支持数据导入导出
- ✏️ **项目管理** - 支持编辑项目信息和删除项目
- ➕ **记录管理** - 支持添加、编辑和删除维护记录

## 项目结构

```
src/
├── app.js                 # 主应用入口
├── config/               # 配置文件
│   ├── index.js          # 统一配置管理
│   └── database.js       # 数据库配置
├── controllers/          # 控制器层
│   └── BotController.js  # 机器人控制器
├── models/              # 数据模型
│   └── Project.js       # 项目模型
├── services/            # 服务层
│   ├── ProjectService.js      # 项目服务
│   ├── NotificationService.js # 通知服务
│   └── CronService.js         # 定时任务服务
└── utils/               # 工具类
    ├── logger.js        # 日志工具
    └── dataMigration.js # 数据迁移工具
```

## 安装和配置

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量模板文件：

```bash
cp config.env.example .env
```

编辑 `.env` 文件，配置以下参数：

```env
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=7786672932

# 数据库配置（本地MongoDB，无认证）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=lottery
# 如果MongoDB启用了认证，请取消注释并填写以下信息
# MONGODB_USERNAME=admin
# MONGODB_PASSWORD=admin123

# 应用配置
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# 定时任务配置
CRON_SCHEDULE=0 0 * * *
PAYMENT_REMINDER_DAYS=3

# 分页配置
ITEMS_PER_PAGE=10
```

### 3. 启动应用

```bash
# 生产环境
npm start

# 开发环境（支持热重载）
npm run dev
```

## 使用说明

### 机器人命令

- `/start` - 显示欢迎信息和可用命令
- `/list` - 查看项目列表（支持分页）
- `/total` - 查看当月费用统计
- `/details <项目ID>` - 查看指定项目的详细信息

### 项目管理操作

#### 新增项目
1. 在项目列表页面点击 "➕ 新增项目" 按钮
2. 使用命令格式：`/add_project <数据>`
3. 数据格式：`项目ID|项目名称|开始日期|详情备注|开台费|是否已付|服务器时间`
4. 示例：`/add_project 20|新项目|2025-01-01|新项目备注|5000|false|2025-06-11`

#### 编辑项目
1. 在项目详情页面点击 "✏️ 编辑项目" 按钮
2. 使用命令格式：`/edit_project <项目ID> <数据>`
3. 数据格式：`项目名称|开始日期|详情备注|开台费|是否已付`
4. 示例：`/edit_project 5 新项目名称|2025-01-01|新备注|5000|true`

#### 删除项目
1. 在项目详情页面点击 "🗑️ 删除项目" 按钮
2. 确认删除操作
3. ⚠️ 此操作会将项目标记为已删除，但数据仍保留在数据库中
4. 💡 如需恢复，请使用 `/restore_project <项目ID>` 命令

#### 恢复已删除项目
1. 使用命令格式：`/restore_project <项目ID>`
2. 示例：`/restore_project 5`

#### 查看已删除项目
1. 使用命令：`/deleted_projects`
2. 查看所有已删除的项目列表

#### 添加维护记录
1. 在项目详情页面点击 "➕ 添加记录" 按钮
2. 使用命令格式：`/add_record <项目ID> <数据>`
3. 数据格式：`支付日期|支付金额|是否已付|备注`
4. 示例：`/add_record 5 2025-07-21|3000|true|维护费`

#### 编辑维护记录
1. 在项目详情页面点击对应记录的 "✏️ 编辑记录X" 按钮
2. 使用命令格式：`/edit_record <项目ID> <记录索引> <数据>`
3. 数据格式：`支付日期|支付金额|是否已付|备注`
4. 示例：`/edit_record 5 0 2025-07-21|3500|true|更新后的维护费`

#### 删除维护记录
1. 在项目详情页面点击对应记录的 "🗑️ 删除记录X" 按钮
2. 确认删除操作
3. ⚠️ 此操作会将记录标记为已删除，但数据仍保留在数据库中
4. 💡 如需恢复，请使用 `/restore_record <项目ID> <记录索引>` 命令

#### 恢复已删除记录
1. 使用命令格式：`/restore_record <项目ID> <记录索引>`
2. 示例：`/restore_record 5 0`

### 数据管理

#### 导入数据

```bash
# 从JSON文件导入数据
node src/utils/dataMigration.js import data/serverData.json
```

#### 导出数据

```bash
# 导出数据到JSON文件
node src/utils/dataMigration.js export data/exported_data.json
```

#### 验证数据

```bash
# 验证数据完整性
node src/utils/dataMigration.js validate
```

## 软删除功能

本项目采用软删除机制，所有删除操作都不会真正删除数据，而是将数据标记为已删除状态：

- **项目软删除**：设置 `isDeleted: true` 和 `deletedAt` 时间戳
- **记录软删除**：在维护记录中设置 `isDeleted: true` 和 `deletedAt` 时间戳
- **数据恢复**：支持恢复已删除的项目和记录
- **查询过滤**：默认查询会自动过滤已删除的数据

### 软删除的优势

- 🔒 **数据安全**：避免误删导致的数据丢失
- 🔄 **可恢复性**：支持随时恢复已删除的数据
- 📊 **数据完整性**：保持历史数据的完整性
- 🛡️ **审计追踪**：记录删除时间和操作历史

## 定时任务

机器人会自动执行以下定时任务：

- **支付提醒** - 每天检查即将到期的支付记录，提前3天发送提醒

定时任务配置可通过环境变量调整：
- `CRON_SCHEDULE` - 定时任务执行时间（默认：每天0点）
- `PAYMENT_REMINDER_DAYS` - 提前提醒天数（默认：3天）

## 开发

### 代码规范

项目使用 ESLint 进行代码检查：

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### 日志系统

项目使用统一的日志系统，支持不同级别的日志：

- `error` - 错误日志
- `warn` - 警告日志
- `info` - 信息日志
- `debug` - 调试日志

日志级别可通过 `LOG_LEVEL` 环境变量配置。

## 部署

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name telegram-bot

# 查看状态
pm2 status

# 查看日志
pm2 logs telegram-bot
```

### 使用 Docker 部署

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MongoDB服务是否运行：`sudo systemctl status mongod`
   - 确认MongoDB端口是否正确（默认27017）
   - 验证数据库名称是否正确
   - 如果使用认证，确保用户名密码正确

2. **机器人无响应**
   - 检查 Telegram Bot Token 是否正确
   - 确认机器人是否已启动
   - 查看应用日志

3. **定时任务不执行**
   - 检查时区配置
   - 确认 Cron 表达式格式
   - 查看定时任务日志

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

### MongoDB 相关

#### 启动MongoDB服务

```bash
# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS (使用Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB
```

#### 检查MongoDB状态

```bash
# 检查服务状态
sudo systemctl status mongod

# 连接到MongoDB
mongo
# 或
mongosh
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

ISC License