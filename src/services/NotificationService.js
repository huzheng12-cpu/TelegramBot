const { Telegraf } = require('telegraf');
const ProjectService = require('./ProjectService');
const config = require('../config');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.bot = new Telegraf(config.telegram.token);
    this.chatId = config.telegram.chatId;
  }

  /**
   * 发送支付提醒
   */
  async sendPaymentReminders() {
    try {
      const upcomingPayments = await ProjectService.getUpcomingPayments(config.cron.reminderDays);

      if (upcomingPayments.length === 0) {
        logger.info('没有即将到期的支付记录');
        return;
      }

      for (const payment of upcomingPayments) {
        const message = this.formatPaymentReminder(payment);
        await this.sendMessage(message);

        // 避免发送过快
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info('支付提醒发送完成', { count: upcomingPayments.length });
    } catch (error) {
      logger.error('发送支付提醒失败', { error: error.message });
    }
  }

  /**
   * 格式化支付提醒消息
   */
  formatPaymentReminder(payment) {
    const { projectName, projectId, paymentDate, paymentAmount, daysLeft, details } = payment;

    let message = `🔔 <b>支付提醒</b>\n\n`;
    message += `🏢 项目: ${projectName} (ID: ${projectId})\n`;
    message += `📅 支付日期: ${paymentDate}\n`;
    message += `💰 支付金额: <b>${paymentAmount}</b> USDT\n`;
    message += `⏰ 剩余天数: <b>${daysLeft}</b> 天\n`;

    if (details) {
      message += `📝 备注: ${details}\n`;
    }

    message += `\n请及时处理支付事宜！`;

    return message;
  }

  /**
   * 发送消息
   */
  async sendMessage(message) {
    try {
      await this.bot.telegram.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
      logger.debug('消息发送成功', { chatId: this.chatId });
    } catch (error) {
      logger.error('消息发送失败', {
        chatId: this.chatId,
        error: error.message
      });
    }
  }

  /**
   * 发送系统通知
   */
  async sendSystemNotification(title, content, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const message = `${icons[type]} <b>${title}</b>\n\n${content}`;
    await this.sendMessage(message);
  }

  /**
   * 发送错误通知
   */
  async sendErrorNotification(error, context = '') {
    const message = `❌ <b>系统错误</b>\n\n`;
    message += `📝 错误信息: ${error.message}\n`;
    if (context) {
      message += `🔍 错误上下文: ${context}\n`;
    }
    message += `⏰ 时间: ${new Date().toLocaleString('zh-CN')}`;

    await this.sendMessage(message);
  }
}

module.exports = new NotificationService(); 