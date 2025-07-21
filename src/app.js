const { Telegraf } = require('telegraf');
const { connectDatabase } = require('./config/database');
const BotController = require('./controllers/BotController');
const CronService = require('./services/CronService');
const ProjectService = require('./services/ProjectService');
const NotificationService = require('./services/NotificationService');
const config = require('./config');
const logger = require('./utils/logger');
const { Markup } = require('telegraf');

class TelegramBot {
  constructor() {
    // 检查是否有Telegram配置
    if (!config.telegram.token) {
      logger.warn('未配置Telegram Bot Token，跳过机器人初始化');
      this.bot = null;
      this.controller = null;
      return;
    }

    this.bot = new Telegraf(config.telegram.token);
    this.controller = BotController;
    this.setupBotHandlers();
  }

  /**
   * 设置机器人处理器
   */
  setupBotHandlers() {
    if (!this.bot) return;

    // 开始命令
    this.bot.start(this.controller.handleStart.bind(this.controller));

    // 列表命令
    this.bot.command('list', this.controller.handleList.bind(this.controller));

    // 统计命令
    this.bot.command('total', this.controller.handleTotal.bind(this.controller));

    // 详情命令
    this.bot.command('details', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 1) {
        return await ctx.reply('请使用正确的格式: /details <projectId>');
      }
      await this.controller.handleDetails(ctx, args[0]);
    });

    // 新增项目命令
    this.bot.command('add_project', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 1) {
        return await ctx.reply('请使用正确的格式: /add_project <数据>');
      }
      await this.handleAddProjectCommand(ctx, args[0]);
    });

    // 编辑项目命令
    this.bot.command('edit_project', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 2) {
        return await ctx.reply('请使用正确的格式: /edit_project <projectId> <数据>');
      }
      await this.handleEditProjectCommand(ctx, args[0], args[1]);
    });

    // 添加记录命令
    this.bot.command('add_record', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 2) {
        return await ctx.reply('请使用正确的格式: /add_record <projectId> <数据>');
      }
      await this.handleAddRecordCommand(ctx, args[0], args[1]);
    });

    // 编辑记录命令
    this.bot.command('edit_record', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 3) {
        return await ctx.reply('请使用正确的格式: /edit_record <projectId> <recordIndex> <数据>');
      }
      await this.handleEditRecordCommand(ctx, args[0], args[1], args[2]);
    });

    // 恢复项目命令
    this.bot.command('restore_project', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 1) {
        return await ctx.reply('请使用正确的格式: /restore_project <projectId>');
      }
      await this.controller.handleRestoreProject(ctx, args[0]);
    });

    // 恢复记录命令
    this.bot.command('restore_record', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length !== 2) {
        return await ctx.reply('请使用正确的格式: /restore_record <projectId> <recordIndex>');
      }
      await this.controller.handleRestoreRecord(ctx, args[0], args[1]);
    });

    // 查看已删除项目命令
    this.bot.command('deleted_projects', async (ctx) => {
      await this.controller.handleViewDeletedProjects(ctx);
    });

    // 处理分页按钮
    this.bot.action(/list_page_(\d+)/, this.controller.handleListPage.bind(this.controller));

    // 处理项目明细分页按钮
    this.bot.action(/project_details_page_(\d+)/, this.controller.handleProjectDetailsPage.bind(this.controller));

    // 处理详情按钮
    this.bot.action(/details_(\d+)/, this.controller.handleDetailsAction.bind(this.controller));

    // 处理返回列表按钮
    this.bot.action('back_to_list', this.controller.handleBackToList.bind(this.controller));

    // 处理查看项目明细按钮
    this.bot.action('view_project_details', this.controller.handleViewProjectDetails.bind(this.controller));

    // 处理新增项目按钮
    this.bot.action('add_project', this.controller.handleAddProject.bind(this.controller));

    // 处理编辑项目按钮
    this.bot.action(/edit_project_(\d+)/, this.controller.handleEditProject.bind(this.controller));

    // 处理删除项目按钮
    this.bot.action(/delete_project_(\d+)/, this.controller.handleDeleteProject.bind(this.controller));

    // 处理确认删除项目按钮
    this.bot.action(/confirm_delete_(\d+)/, this.controller.handleConfirmDelete.bind(this.controller));

    // 处理添加记录按钮
    this.bot.action(/add_record_(\d+)/, this.controller.handleAddRecord.bind(this.controller));

    // 处理编辑记录按钮
    this.bot.action(/edit_record_(\d+)_(\d+)/, async (ctx) => {
      await this.controller.handleEditRecord(ctx);
    });

    // 处理确认删除记录按钮（必须在删除记录按钮之前）
    this.bot.action(/confirm_delete_record_(\d+)_(\d+)/, async (ctx) => {
      console.log('🔍 确认删除记录按钮被点击');
      console.log('callback data:', ctx.callbackQuery.data);
      await this.controller.handleConfirmDeleteRecord(ctx);
    });

    // 处理删除记录按钮
    this.bot.action(/delete_record_(\d+)_(\d+)/, async (ctx) => {
      console.log('🔍 删除记录按钮被点击');
      console.log('callback data:', ctx.callbackQuery.data);
      await this.controller.handleDeleteRecord(ctx);
    });

    // 处理恢复记录按钮
    this.bot.action(/restore_record_(\d+)_(\d+)/, async (ctx) => {
      console.log('🔍 恢复记录按钮被点击');
      console.log('callback data:', ctx.callbackQuery.data);
      await this.controller.handleRestoreRecord(ctx);
    });

    // 处理未知命令
    this.bot.on('text', async (ctx, next) => {
      const messageText = ctx.message.text;
      if (!['/list', '/details', '/total', '/start', '/add_project', '/edit_project', '/add_record', '/edit_record', '/restore_project', '/restore_record', '/deleted_projects'].some(command => messageText.startsWith(command))) {
        await this.controller.handleUnknownCommand(ctx);
      } else {
        return next();
      }
    });

    // 错误处理
    this.bot.catch((err, ctx) => {
      logger.error('机器人错误', {
        error: err.message,
        update: ctx.update
      });
      ctx.reply('抱歉，处理您的请求时出现错误');
    });
  }

  /**
   * 处理新增项目命令
   */
  async handleAddProjectCommand(ctx, data) {
    try {
      const parts = data.split('|');
      if (parts.length !== 7) {
        return await ctx.reply('数据格式错误，请使用: 项目ID|项目名称|开始日期|详情备注|开台费|是否已付|服务器时间');
      }

      const [projectId, projectName, startDate, maintenanceDetails, openingFee, isOpeningFeeStr, serverTime] = parts;
      const isOpeningFee = isOpeningFeeStr.toLowerCase() === 'true';

      const projectData = {
        projectId,
        projectName,
        startDate,
        maintenanceDetails,
        openingFee,
        isOpeningFee,
        serverTime,
        maintenanceRecords: []
      };

      const newProject = await ProjectService.createProject(projectData);

      let message = `✅ <b>项目创建成功</b>\n\n`;
      message += `🆔 项目ID: ${newProject.projectId}\n`;
      message += `📝 项目名称: ${newProject.projectName}\n`;
      message += `📅 开始日期: ${newProject.startDate}\n`;
      message += `📄 详情备注: ${newProject.maintenanceDetails}\n`;
      message += `💰 开台费: ${newProject.openingFee}\n`;
      message += `✅ 开台费已付: ${newProject.isOpeningFee ? '是' : '否'}\n`;
      message += `🖥️ 服务器时间: ${newProject.serverTime}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理新增项目命令失败', { data, error: error.message });
      await ctx.reply('抱歉，创建项目时出现错误');
    }
  }

  /**
   * 处理编辑项目命令
   */
  async handleEditProjectCommand(ctx, projectId, data) {
    try {
      const parts = data.split('|');
      if (parts.length !== 5) {
        return await ctx.reply('数据格式错误，请使用: 项目名称|开始日期|详情备注|开台费|是否已付');
      }

      const [projectName, startDate, maintenanceDetails, openingFee, isOpeningFeeStr] = parts;
      const isOpeningFee = isOpeningFeeStr.toLowerCase() === 'true';

      const updateData = {
        projectName,
        startDate,
        maintenanceDetails,
        openingFee,
        isOpeningFee
      };

      const updatedProject = await ProjectService.updateProject(projectId, updateData);

      let message = `✅ <b>项目更新成功</b>\n\n`;
      message += `🆔 项目ID: ${updatedProject.projectId}\n`;
      message += `📝 项目名称: ${updatedProject.projectName}\n`;
      message += `📅 开始日期: ${updatedProject.startDate}\n`;
      message += `📄 详情备注: ${updatedProject.maintenanceDetails}\n`;
      message += `💰 开台费: ${updatedProject.openingFee}\n`;
      message += `✅ 开台费已付: ${updatedProject.isOpeningFee ? '是' : '否'}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理编辑项目命令失败', { projectId, data, error: error.message });
      await ctx.reply('抱歉，更新项目时出现错误');
    }
  }

  /**
   * 处理添加记录命令
   */
  async handleAddRecordCommand(ctx, projectId, data) {
    try {
      const parts = data.split('|');
      if (parts.length !== 4) {
        return await ctx.reply('数据格式错误，请使用: 支付日期|支付金额|是否已付|备注');
      }

      const [paymentDate, paymentAmount, isPaymentStr, Details] = parts;
      const isPayment = isPaymentStr.toLowerCase() === 'true';

      const recordData = {
        paymentDate,
        paymentAmount,
        isPayment,
        Details
      };

      const updatedProject = await ProjectService.addMaintenanceRecord(projectId, recordData);

      let message = `✅ <b>维护记录添加成功</b>\n\n`;
      message += `项目: ${updatedProject.projectName} (ID: ${projectId})\n`;
      message += `📅 支付日期: ${paymentDate}\n`;
      message += `💰 支付金额: ${paymentAmount} USDT\n`;
      message += `✅ 是否已付: ${isPayment ? '是' : '否'}\n`;
      message += `📝 备注: ${Details || '无'}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理添加记录命令失败', { projectId, data, error: error.message });
      await ctx.reply('抱歉，添加记录时出现错误');
    }
  }

  /**
   * 处理编辑记录命令
   */
  async handleEditRecordCommand(ctx, projectId, recordIndex, data) {
    try {
      const parts = data.split('|');
      if (parts.length !== 4) {
        return await ctx.reply('数据格式错误，请使用: 支付日期|支付金额|是否已付|备注');
      }

      const [paymentDate, paymentAmount, isPaymentStr, Details] = parts;
      const isPayment = isPaymentStr.toLowerCase() === 'true';

      const recordData = {
        paymentDate,
        paymentAmount,
        isPayment,
        Details
      };

      const recordIndexNum = parseInt(recordIndex);
      const updatedProject = await ProjectService.updateMaintenanceRecord(projectId, recordIndexNum, recordData);

      let message = `✅ <b>维护记录更新成功</b>\n\n`;
      message += `项目: ${updatedProject.projectName} (ID: ${projectId})\n`;
      message += `记录索引: ${recordIndexNum + 1}\n`;
      message += `📅 支付日期: ${paymentDate}\n`;
      message += `💰 支付金额: ${paymentAmount} USDT\n`;
      message += `✅ 是否已付: ${isPayment ? '是' : '否'}\n`;
      message += `📝 备注: ${Details || '无'}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理编辑记录命令失败', { projectId, recordIndex, data, error: error.message });
      await ctx.reply('抱歉，更新记录时出现错误');
    }
  }

  /**
   * 启动机器人
   */
  async start() {
    try {
      // 连接数据库
      await connectDatabase();
      logger.info('数据库连接成功');

      // 导入初始数据（如果数据库为空）
      await this.importInitialData();

      // 启动定时任务
      CronService.startAllJobs();

      // 如果有机器人配置，启动机器人
      if (this.bot) {
        await this.bot.launch();
        logger.info('Telegram机器人启动成功');

        // 发送启动通知
        if (config.telegram.chatId) {
          await NotificationService.sendSystemNotification(
            '系统启动',
            '服务器到期提醒机器人已成功启动',
            'success'
          );
        }
      } else {
        logger.info('跳过机器人启动（未配置Token）');
      }

      // 优雅关闭处理
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('启动失败', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * 导入初始数据
   */
  async importInitialData() {
    try {
      const projects = await ProjectService.getAllProjects();

      if (projects.length === 0) {
        logger.info('数据库为空，开始导入初始数据');

        // 读取JSON文件
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(__dirname, '../data/serverData.json');

        if (fs.existsSync(dataPath)) {
          const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          await ProjectService.importFromJson(jsonData);
          logger.info('初始数据导入完成');
        } else {
          logger.warn('未找到初始数据文件');
        }
      } else {
        logger.info('数据库已有数据，跳过导入');
      }
    } catch (error) {
      logger.error('导入初始数据失败', { error: error.message });
    }
  }

  /**
   * 设置优雅关闭
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭`);

      try {
        // 停止定时任务
        CronService.stopAllJobs();

        // 停止机器人
        if (this.bot) {
          this.bot.stop(signal);
        }

        // 发送关闭通知
        if (config.telegram.chatId) {
          await NotificationService.sendSystemNotification(
            '系统关闭',
            '服务器到期提醒机器人正在关闭',
            'warning'
          );
        }

        logger.info('优雅关闭完成');
        process.exit(0);
      } catch (error) {
        logger.error('优雅关闭失败', { error: error.message });
        process.exit(1);
      }
    };

    // 监听关闭信号
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }
}

// 启动应用
const app = new TelegramBot();
app.start().catch(error => {
  logger.error('应用启动失败', { error: error.message });
  process.exit(1);
}); 