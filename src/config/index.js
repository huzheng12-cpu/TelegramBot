require('dotenv').config();

const config = {
  // 应用配置
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  // Telegram Bot 配置
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },

  // 数据库配置
  database: {
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || 27017,
    name: process.env.MONGODB_DATABASE || 'lottery',
    username: process.env.MONGODB_USERNAME,
    password: process.env.MONGODB_PASSWORD
  },

  // 定时任务配置
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 0 * * *',
    reminderDays: parseInt(process.env.PAYMENT_REMINDER_DAYS) || 3
  },

  // 分页配置
  pagination: {
    itemsPerPage: parseInt(process.env.ITEMS_PER_PAGE) || 10
  }
};

// 验证必需的配置
const validateConfig = () => {
  const errors = [];

  // 数据库配置验证
  if (!config.database.host) {
    errors.push('database.host');
  }
  if (!config.database.name) {
    errors.push('database.name');
  }

  // 在生产环境中验证Telegram配置
  if (config.app.nodeEnv === 'production') {
    if (!config.telegram.token) {
      errors.push('telegram.token');
    }
    if (!config.telegram.chatId) {
      errors.push('telegram.chatId');
    }
  } else {
    // 开发环境中只给出警告
    if (!config.telegram.token) {
      console.warn('⚠️  警告: 未配置 TELEGRAM_BOT_TOKEN，机器人功能将不可用');
    }
    if (!config.telegram.chatId) {
      console.warn('⚠️  警告: 未配置 TELEGRAM_CHAT_ID，通知功能将不可用');
    }
  }

  if (errors.length > 0) {
    throw new Error(`缺少必需的配置: ${errors.join(', ')}`);
  }
};

// 执行配置验证
validateConfig();

module.exports = config; 