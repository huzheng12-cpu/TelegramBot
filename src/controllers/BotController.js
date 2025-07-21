const { Markup } = require('telegraf');
const ProjectService = require('../services/ProjectService');
const config = require('../config');
const logger = require('../utils/logger');

class BotController {
  constructor() {
    this.itemsPerPage = config.pagination.itemsPerPage;
  }

  /**
   * 处理开始命令
   */
  async handleStart(ctx) {
    try {
      const message = '欢迎使用服务器到期提醒机器人！\n\n' +
        '可用命令:\n' +
        '📋 /list - 查看项目列表\n' +
        '💰 /total - 查看当月费用统计\n' +
        '📊 /details <项目ID> - 查看项目详情\n' +
        '➕ /add - 添加新项目\n' +
        '✏️ /edit <项目ID> - 编辑项目\n' +
        '🗑️ /delete <项目ID> - 删除项目\n' +
        '🔄 /restore_project <项目ID> - 恢复已删除项目\n' +
        '🔄 /restore_record <项目ID> <记录索引> - 恢复已删除记录\n' +
        '🗑️ /deleted_projects - 查看已删除项目列表';

      await ctx.reply(message);
    } catch (error) {
      logger.error('处理开始命令失败', { error: error.message });
      await ctx.reply('抱歉，处理命令时出现错误');
    }
  }

  /**
   * 处理列表命令
   */
  async handleList(ctx, page = 0) {
    if (typeof page !== 'number') {
      page = 0;
    }
    try {
      const result = await ProjectService.getProjectsWithPagination(page, this.itemsPerPage);

      if (result.projects.length === 0) {
        return await ctx.reply('暂无项目数据');
      }

      let message = `📋 项目列表 (第 ${page + 1}/${result.totalPages} 页)\n\n`;

      const keyboard = [];
      result.projects.forEach(project => {
        keyboard.push([
          Markup.button.callback(
            `📊 ${project.projectName}`,
            `details_${project.projectId}`
          )
        ]);
      });

      // 添加分页按钮
      if (result.totalPages > 1) {
        const paginationRow = [];

        if (result.hasPrev) {
          paginationRow.push(Markup.button.callback('⬅️ 上一页', `list_page_${page - 1}`));
        }

        if (result.hasNext) {
          paginationRow.push(Markup.button.callback('下一页 ➡️', `list_page_${page + 1}`));
        }

        if (paginationRow.length > 0) {
          keyboard.push(paginationRow);
        }
      }

      // 添加新增项目按钮
      keyboard.push([Markup.button.callback('➕ 新增项目', 'add_project')]);

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理列表命令失败', { page, error: error.message });
      await ctx.reply('抱歉，获取项目列表时出现错误');
    }
  }

  /**
   * 处理分页按钮
   */
  async handleListPage(ctx) {
    const page = parseInt(ctx.match[1]);
    await this.handleList(ctx, page);
  }

  /**
   * 处理详情命令
   */
  async handleDetails(ctx, projectId) {
    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        return await ctx.reply('未找到指定的项目');
      }

      let message = `📊 <b>项目详情</b>\n\n`;
      message += `🆔 项目ID: ${project.projectId}\n`;
      message += `📝 项目名称: ${project.projectName}\n`;
      message += `📅 开始日期: ${project.startDate || '--'}\n`;
      message += `📄 详情备注: ${project.maintenanceDetails || '--'}\n`;
      message += `💰 开台费: ${project.openingFee || 0}${project.isOpeningFee ? ' ✅' : ''}\n`;
      message += `💰 累计收费: ${project.totalFee} USDT\n`;
      message += `⚠️ 未付费用: ${project.unpaidFee} USDT\n\n`;

      if (project.maintenanceRecords && project.maintenanceRecords.length > 0) {
        message += `📋 <b>收费记录 (${project.maintenanceRecords.length}条)</b>\n\n`;
        project.maintenanceRecords.forEach((record, index) => {
          const statusIcon = record.isDeleted ? '🗑️' : (record.isPayment ? '✅' : '⚠️');
          const statusText = record.isDeleted ? '已删除' : (record.isPayment ? '已付' : '未付');
          message += `📋 <b>记录 ${index + 1}</b> ${statusIcon}\n`;
          message += `  • 支付日期: ${record.paymentDate}\n`;
          message += `  • 支付金额: <b>${record.paymentAmount}</b> ${statusText}\n`;
          message += `  • 备注: ${record.Details || '无'}\n`;
          if (record.isDeleted) {
            message += `  • 删除时间: ${record.deletedAt.toLocaleString()}\n`;
          }
          message += `\n`;
        });
      } else {
        message += `📋 <b>维护记录</b>\n暂无维护记录\n`;
      }

      // 创建操作按钮
      const keyboard = [
        [Markup.button.callback('✏️ 编辑项目', `edit_project_${projectId}`)],
        [Markup.button.callback('🗑️ 删除项目', `delete_project_${projectId}`)],
        [Markup.button.callback('➕ 添加记录', `add_record_${projectId}`)]
      ];

      // 为每个维护记录添加编辑和删除按钮（只显示未删除的记录）
      if (project.maintenanceRecords && project.maintenanceRecords.length > 0) {
        project.maintenanceRecords.forEach((record, index) => {
          if (!record.isDeleted) {
            keyboard.push([
              Markup.button.callback(`✏️ 编辑记录${index + 1}`, `edit_record_${projectId}_${index}`),
              Markup.button.callback(`🗑️ 删除记录${index + 1}`, `delete_record_${projectId}_${index}`)
            ]);
          } else {
            keyboard.push([
              Markup.button.callback(`🔄 恢复记录${index + 1}`, `restore_record_${projectId}_${index}`)
            ]);
          }
        });
      }

      keyboard.push([Markup.button.callback('⬅️ 返回列表', 'back_to_list')]);

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理详情命令失败', { projectId, error: error.message });
      await ctx.reply('抱歉，获取项目详情时出现错误');
    }
  }

  /**
   * 处理详情按钮
   */
  async handleDetailsAction(ctx) {
    const projectId = ctx.match[1];
    await this.handleDetails(ctx, projectId);
  }

  /**
   * 处理返回列表按钮
   */
  async handleBackToList(ctx) {
    await this.handleList(ctx, 0);
  }

  /**
   * 处理新增项目按钮
   */
  async handleAddProject(ctx) {
    try {
      let message = `➕ <b>添加新项目</b>\n\n`;
      message += `请使用以下格式添加项目：\n`;
      message += `/add_project 项目ID|项目名称|开始日期|详情备注|开台费|是否已付|服务器时间\n`;
      message += `例如：/add_project 20|新项目|2025-01-01|新项目备注|5000|false|2025-06-11\n\n`;
      message += `说明：\n`;
      message += `• 项目ID：必须唯一\n`;
      message += `• 是否已付：true表示已付，false表示未付\n`;
      message += `• 服务器时间：服务器到期时间`;

      const keyboard = [
        [Markup.button.callback('📋 返回列表', 'back_to_list')]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理新增项目失败', { error: error.message });
      await ctx.reply('抱歉，处理新增项目时出现错误');
    }
  }

  /**
   * 处理编辑项目按钮
   */
  async handleEditProject(ctx) {
    const projectId = ctx.match[1];
    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        return await ctx.reply('未找到指定的项目');
      }

      let message = `✏️ <b>编辑项目</b>\n\n`;
      message += `🆔 项目ID: ${project.projectId}\n`;
      message += `📝 项目名称: ${project.projectName}\n`;
      message += `📅 开始日期: ${project.startDate || '--'}\n`;
      message += `📄 详情备注: ${project.maintenanceDetails || '--'}\n`;
      message += `💰 开台费: ${project.openingFee || 0}\n`;
      message += `✅ 开台费已付: ${project.isOpeningFee ? '是' : '否'}\n\n`;
      message += `请使用以下格式编辑项目：\n`;
      message += `/edit_project ${projectId} 项目名称|开始日期|详情备注|开台费|是否已付\n`;
      message += `例如：/edit_project ${projectId} 新项目名称|2025-01-01|新备注|5000|true`;

      const keyboard = [
        [Markup.button.callback('⬅️ 返回详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理编辑项目失败', { projectId, error: error.message });
      await ctx.reply('抱歉，处理编辑项目时出现错误');
    }
  }

  /**
   * 处理删除项目按钮
   */
  async handleDeleteProject(ctx) {
    const projectId = ctx.match[1];
    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        return await ctx.reply('未找到指定的项目');
      }

      let message = `🗑️ <b>删除项目确认</b>\n\n`;
      message += `您确定要删除以下项目吗？\n\n`;
      message += `🆔 项目ID: ${project.projectId}\n`;
      message += `📝 项目名称: ${project.projectName}\n`;
      message += `💰 累计收费: ${project.totalFee} USDT\n\n`;
      message += `⚠️ 此操作会将项目标记为已删除，但数据仍保留在数据库中\n`;
      message += `💡 如需恢复，请使用 /restore_project 命令`;

      const keyboard = [
        [
          Markup.button.callback('✅ 确认删除', `confirm_delete_${projectId}`),
          Markup.button.callback('❌ 取消', `details_${projectId}`)
        ]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理删除项目失败', { projectId, error: error.message });
      await ctx.reply('抱歉，处理删除项目时出现错误');
    }
  }

  /**
   * 处理确认删除项目
   */
  async handleConfirmDelete(ctx) {
    const projectId = ctx.match[1];
    try {
      const deletedProject = await ProjectService.deleteProject(projectId);

      let message = `✅ <b>项目删除成功</b>\n\n`;
      message += `🆔 项目ID: ${deletedProject.projectId}\n`;
      message += `📝 项目名称: ${deletedProject.projectName}\n`;
      message += `💰 累计收费: ${deletedProject.totalFee} USDT\n`;
      message += `🗑️ 删除时间: ${deletedProject.deletedAt.toLocaleString()}\n\n`;
      message += `💡 如需恢复项目，请使用命令：/restore_project ${projectId}`;

      const keyboard = [
        [Markup.button.callback('📋 返回列表', 'back_to_list')]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('确认删除项目失败', { projectId, error: error.message });
      await ctx.reply('抱歉，删除项目时出现错误');
    }
  }

  /**
   * 处理添加记录按钮
   */
  async handleAddRecord(ctx) {
    const projectId = ctx.match[1];
    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        return await ctx.reply('未找到指定的项目');
      }

      let message = `➕ <b>添加维护记录</b>\n\n`;
      message += `项目: ${project.projectName} (ID: ${projectId})\n\n`;
      message += `请使用以下格式添加记录：\n`;
      message += `/add_record ${projectId} 支付日期|支付金额|是否已付|备注\n`;
      message += `例如：/add_record ${projectId} 2025-07-21|3000|true|维护费`;

      const keyboard = [
        [Markup.button.callback('⬅️ 返回详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理添加记录失败', { projectId, error: error.message });
      await ctx.reply('抱歉，处理添加记录时出现错误');
    }
  }

  /**
   * 处理编辑记录按钮
   */
  async handleEditRecord(ctx) {
    const [projectId, recordIndex] = ctx.match.slice(1);
    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        return await ctx.reply('未找到指定的项目');
      }

      const recordIndexNum = parseInt(recordIndex);
      if (recordIndexNum < 0 || recordIndexNum >= project.maintenanceRecords.length) {
        return await ctx.reply('维护记录索引无效');
      }

      const record = project.maintenanceRecords[recordIndexNum];

      let message = `✏️ <b>编辑维护记录</b>\n\n`;
      message += `项目: ${project.projectName} (ID: ${projectId})\n`;
      message += `记录索引: ${recordIndexNum + 1}\n\n`;
      message += `当前记录信息：\n`;
      message += `📅 支付日期: ${record.paymentDate}\n`;
      message += `💰 支付金额: ${record.paymentAmount}\n`;
      message += `✅ 是否已付: ${record.isPayment ? '是' : '否'}\n`;
      message += `📝 备注: ${record.Details || '无'}\n\n`;
      message += `请使用以下格式编辑记录：\n`;
      message += `/edit_record ${projectId} ${recordIndex} 支付日期|支付金额|是否已付|备注\n`;
      message += `例如：/edit_record ${projectId} ${recordIndex} 2025-07-21|3500|true|更新后的维护费`;

      const keyboard = [
        [Markup.button.callback('⬅️ 返回详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理编辑记录失败', { projectId, recordIndex, error: error.message });
      await ctx.reply('抱歉，处理编辑记录时出现错误');
    }
  }

  /**
   * 处理删除记录按钮
   */
  async handleDeleteRecord(ctx) {
    console.log('🔍 删除记录按钮被点击');
    console.log('ctx.match:', ctx.match);
    console.log('ctx.callbackQuery:', ctx.callbackQuery);

    const [projectId, recordIndex] = ctx.match.slice(1);
    console.log('解析的参数:', { projectId, recordIndex });

    try {
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        return await ctx.reply('未找到指定的项目');
      }

      const recordIndexNum = parseInt(recordIndex);
      if (recordIndexNum < 0 || recordIndexNum >= project.maintenanceRecords.length) {
        return await ctx.reply('维护记录索引无效');
      }

      const record = project.maintenanceRecords[recordIndexNum];
      if (record.isDeleted) {
        return await ctx.reply('该记录已被删除');
      }

      let message = `🗑️ <b>删除维护记录确认</b>\n\n`;
      message += `您确定要删除以下记录吗？\n\n`;
      message += `项目: ${project.projectName} (ID: ${projectId})\n`;
      message += `记录索引: ${recordIndexNum + 1}\n`;
      message += `📅 支付日期: ${record.paymentDate}\n`;
      message += `💰 支付金额: ${record.paymentAmount} USDT\n`;
      message += `✅ 是否已付: ${record.isPayment ? '是' : '否'}\n`;
      message += `📝 备注: ${record.Details || '无'}\n\n`;
      message += `⚠️ 此操作会将记录标记为已删除，但数据仍保留在数据库中\n`;
      message += `💡 如需恢复，请使用 /restore_record 命令`;

      const keyboard = [
        [
          Markup.button.callback('✅ 确认删除', `confirm_delete_record_${projectId}_${recordIndex}`),
          Markup.button.callback('❌ 取消', `details_${projectId}`)
        ]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理删除记录失败', { projectId, recordIndex, error: error.message });
      await ctx.reply('抱歉，处理删除记录时出现错误');
    }
  }

  /**
   * 处理确认删除记录
   */
  async handleConfirmDeleteRecord(ctx) {
    console.log('🔍 确认删除记录按钮被点击');
    console.log('ctx.match:', ctx.match);
    console.log('ctx.callbackQuery:', ctx.callbackQuery);

    const [projectId, recordIndex] = ctx.match.slice(1);
    console.log('解析的参数:', { projectId, recordIndex });

    try {
      const recordIndexNum = parseInt(recordIndex);
      const updatedProject = await ProjectService.deleteMaintenanceRecord(projectId, recordIndexNum);

      let message = `✅ <b>维护记录删除成功</b>\n\n`;
      message += `项目: ${updatedProject.projectName} (ID: ${projectId})\n`;
      message += `记录索引: ${recordIndexNum + 1}\n`;
      message += `🗑️ 删除时间: ${new Date().toLocaleString()}\n\n`;
      message += `💡 如需恢复记录，请使用命令：/restore_record ${projectId} ${recordIndex}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('确认删除记录失败', { projectId, recordIndex, error: error.message });
      await ctx.reply('抱歉，删除记录时出现错误');
    }
  }

  /**
   * 处理恢复项目命令
   */
  async handleRestoreProject(ctx, projectId) {
    try {
      const restoredProject = await ProjectService.restoreProject(projectId);

      let message = `✅ <b>项目恢复成功</b>\n\n`;
      message += `🆔 项目ID: ${restoredProject.projectId}\n`;
      message += `📝 项目名称: ${restoredProject.projectName}\n`;
      message += `💰 累计收费: ${restoredProject.totalFee} USDT\n`;
      message += `🔄 恢复时间: ${new Date().toLocaleString()}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('恢复项目失败', { projectId, error: error.message });
      await ctx.reply('抱歉，恢复项目时出现错误');
    }
  }

  /**
   * 处理恢复记录命令
   */
  async handleRestoreRecord(ctx, projectId, recordIndex) {
    try {
      // 如果没有传递参数，尝试从ctx.match中获取
      if (!projectId || !recordIndex) {
        if (ctx.match && ctx.match.length >= 3) {
          projectId = ctx.match[1];
          recordIndex = ctx.match[2];
        } else {
          return await ctx.reply('参数错误，请使用正确的格式');
        }
      }

      const recordIndexNum = parseInt(recordIndex);
      const updatedProject = await ProjectService.restoreMaintenanceRecord(projectId, recordIndexNum);

      let message = `✅ <b>维护记录恢复成功</b>\n\n`;
      message += `项目: ${updatedProject.projectName} (ID: ${projectId})\n`;
      message += `记录索引: ${recordIndexNum + 1}\n`;
      message += `🔄 恢复时间: ${new Date().toLocaleString()}`;

      const keyboard = [
        [Markup.button.callback('📊 查看详情', `details_${projectId}`)]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('恢复记录失败', { projectId, recordIndex, error: error.message });
      await ctx.reply('抱歉，恢复记录时出现错误');
    }
  }

  /**
   * 处理查看已删除项目命令
   */
  async handleViewDeletedProjects(ctx) {
    try {
      const deletedProjects = await ProjectService.getDeletedProjects();

      if (deletedProjects.length === 0) {
        return await ctx.reply('暂无已删除的项目');
      }

      let message = `🗑️ <b>已删除项目列表</b>\n\n`;

      deletedProjects.forEach((project, index) => {
        message += `${index + 1}. <b>${project.projectName}</b> (ID: ${project.projectId})\n`;
        message += `   📅 删除时间: ${project.deletedAt.toLocaleString()}\n`;
        message += `   💰 累计收费: ${project.totalFee} USDT\n\n`;
      });

      message += `💡 如需恢复项目，请使用命令：/restore_project <项目ID>`;

      await ctx.replyWithHTML(message);
    } catch (error) {
      logger.error('查看已删除项目失败', { error: error.message });
      await ctx.reply('抱歉，获取已删除项目列表时出现错误');
    }
  }

  /**
   * 处理统计命令
   */
  async handleTotal(ctx) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const statistics = await ProjectService.getMonthlyStatistics(year, month);

      const message = `
📊 <b>${year}年${month}月维护费统计</b>\n\n
💰 <b>总计</b>\n
• 已收费用: <b>${statistics.totalReceived.toLocaleString()}</b> USDT ✅\n
• 未收费用: <b>${statistics.totalUnpaid.toLocaleString()}</b> USDT ⚠️\n
• 当月总额: <b>${statistics.totalAmount.toLocaleString()}</b> USDT\n\n
📅 统计时间: ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN')}
      `.trim();

      const keyboard = [
        [Markup.button.callback('查看项目明细', 'view_project_details')]
      ];

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理统计命令失败', { error: error.message });
      await ctx.reply('抱歉，统计费用时出现错误');
    }
  }

  /**
   * 处理查看项目明细按钮
   */
  async handleViewProjectDetails(ctx, page = 0) {
    try {
      // 验证页码参数
      if (typeof page !== 'number') {
        page = 0;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const statistics = await ProjectService.getMonthlyStatistics(year, month);

      // 分页设置
      const itemsPerPage = 5;
      const totalItems = statistics.projectDetails.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageItems = statistics.projectDetails.slice(startIndex, endIndex);

      let message = `📋 <b>项目明细</b>\n`;
      message += `📅 ${year}年${month}月 (第${page + 1}/${totalPages}页)\n\n`;

      if (currentPageItems.length > 0) {
        // 获取当前页项目的详细信息
        const projectDetails = await Promise.all(
          currentPageItems.map(async (project) => {
            try {
              const details = await ProjectService.getProjectById(project.projectId);
              return { ...project, details };
            } catch (error) {
              return { ...project, details: null };
            }
          })
        );

        projectDetails.forEach((project, index) => {
          const globalIndex = startIndex + index + 1;
          message += `${globalIndex}. <b>${project.projectName}</b> (ID: ${project.projectId})\n`;

          if (project.received > 0) {
            message += `   ✅ 已收: ${project.received.toLocaleString()} USDT\n`;
          }

          if (project.unpaid > 0) {
            message += `   ⚠️ 未收: ${project.unpaid.toLocaleString()} USDT\n`;
          }

          // 显示项目详细信息
          if (project.details) {
            if (project.details.maintenanceDetails) {
              message += `   📝 备注: ${project.details.maintenanceDetails}\n`;
            }

            // 显示支付记录详情
            if (project.details.maintenanceRecords && project.details.maintenanceRecords.length > 0) {
              const activeRecords = project.details.maintenanceRecords.filter(record => !record.isDeleted);
              if (activeRecords.length > 0) {
                message += `   📋 支付记录:\n`;
                activeRecords.forEach((record, recordIndex) => {
                  const statusIcon = record.isPayment ? '✅' : '⚠️';
                  const statusText = record.isPayment ? '已付' : '未付';
                  message += `      ${recordIndex + 1}. ${record.paymentDate} - ${record.paymentAmount} USDT ${statusIcon} ${statusText}\n`;
                  if (record.Details) {
                    message += `         📝 ${record.Details}\n`;
                  }
                });
              }
            }
          }

          message += `\n`;
        });
      } else {
        message += `暂无项目数据\n`;
      }

      message += `📅 统计时间: ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN')}`;

      // 构建分页键盘
      const keyboard = [];

      // 分页按钮
      if (totalPages > 1) {
        const pageRow = [];
        if (page > 0) {
          pageRow.push(Markup.button.callback('⬅️ 上一页', `project_details_page_${page - 1}`));
        }
        if (page < totalPages - 1) {
          pageRow.push(Markup.button.callback('下一页 ➡️', `project_details_page_${page + 1}`));
        }
        if (pageRow.length > 0) {
          keyboard.push(pageRow);
        }
      }

      keyboard.push([Markup.button.callback('⬅️ 返回', 'back_to_list')]);

      const replyMarkup = Markup.inlineKeyboard(keyboard);
      await ctx.replyWithHTML(message, replyMarkup);
    } catch (error) {
      logger.error('处理查看项目明细失败', { error: error.message });
      await ctx.reply('抱歉，获取项目明细时出现错误');
    }
  }

  /**
   * 处理项目明细分页
   */
  async handleProjectDetailsPage(ctx) {
    try {
      const page = parseInt(ctx.match[1]);
      await this.handleViewProjectDetails(ctx, page);
    } catch (error) {
      logger.error('处理项目明细分页失败', { error: error.message });
      await ctx.reply('抱歉，分页操作失败');
    }
  }

  /**
 * 处理未知命令
 */
  async handleUnknownCommand(ctx) {
    const message = '❓ 未知命令\n\n' +
      '可用命令:\n' +
      '📋 /list - 查看项目列表\n' +
      '💰 /total - 查看当月费用统计\n' +
      '📊 /details <项目ID> - 查看项目详情\n' +
      '➕ /add - 添加新项目\n' +
      '✏️ /edit <项目ID> - 编辑项目\n' +
      '🗑️ /delete <项目ID> - 删除项目\n' +
      '🔄 /restore_project <项目ID> - 恢复已删除项目\n' +
      '🔄 /restore_record <项目ID> <记录索引> - 恢复已删除记录\n' +
      '🗑️ /deleted_projects - 查看已删除项目列表';

    await ctx.reply(message);
  }
}

module.exports = new BotController(); 