const { CronJob } = require('cron');
const NotificationService = require('./NotificationService');
const config = require('../config');
const logger = require('../utils/logger');

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * 启动所有定时任务
   */
  startAllJobs() {
    this.startPaymentReminderJob();
    logger.info('所有定时任务已启动');
  }

  /**
   * 启动支付提醒定时任务
   */
  startPaymentReminderJob() {
    const job = new CronJob(
      config.cron.schedule,
      async () => {
        logger.info('执行支付提醒定时任务');
        try {
          await NotificationService.sendPaymentReminders();
        } catch (error) {
          logger.error('支付提醒定时任务执行失败', { error: error.message });
          await NotificationService.sendErrorNotification(error, '支付提醒定时任务');
        }
      },
      null,
      false,
      'Asia/Shanghai'
    );

    job.start();
    this.jobs.set('paymentReminder', job);
    
    logger.info('支付提醒定时任务已启动', { 
      schedule: config.cron.schedule,
      reminderDays: config.cron.reminderDays 
    });
  }

  /**
   * 停止所有定时任务
   */
  stopAllJobs() {
    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info(`定时任务已停止: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * 停止指定定时任务
   */
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      logger.info(`定时任务已停止: ${jobName}`);
    } else {
      logger.warn(`未找到定时任务: ${jobName}`);
    }
  }

  /**
   * 获取所有定时任务状态
   */
  getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate()
      };
    }
    return status;
  }

  /**
   * 手动执行支付提醒
   */
  async executePaymentReminder() {
    logger.info('手动执行支付提醒');
    try {
      await NotificationService.sendPaymentReminders();
      return { success: true, message: '支付提醒执行成功' };
    } catch (error) {
      logger.error('手动执行支付提醒失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CronService(); 