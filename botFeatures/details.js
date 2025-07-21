const { Markup } = require('telegraf');
const { handleList } = require('./list');

// 显示项目详情
async function handleDetails(ctx, projectId) {
  try {
    const serverData = require('../data/serverData.json');

    // 查找指定的项目
    const project = serverData.find(p => p.projectId === projectId);

    if (!project) {
      return ctx.reply('未找到指定的项目');
    }

    const { projectName, startDate, maintenanceDetails, openingFee, maintenanceRecords } = project;

    let message = `�� <b>项目详情</b>\n\n`;
    message += `🆔 项目ID: ${projectId}\n`;
    message += `📝 项目名称: ${projectName}\n`;
    message += `📅 开始日期: ${startDate || '--'}\n`;
    message += `📄 详情备注: ${maintenanceDetails || '--'}\n`;
    message += `💰 开台费: ${openingFee || 0}${project.isOpeningFee ? '✅' : ''}\n`;
    const totalMaintenanceFee = maintenanceRecords.reduce((acc, record) => {
      return record.isPayment ? acc + Number(record.paymentAmount) : acc;
    }, 0) || 0;
    const totalFee = totalMaintenanceFee + (Number(openingFee) || 0);
    message += `💰 累计收费: ${totalFee} USDT\n\n`;

    if (maintenanceRecords && maintenanceRecords.length > 0) {
      message += `📊 <b>收费记录 (${maintenanceRecords.length}条)</b>\n\n`;
      maintenanceRecords.forEach((record, index) => {
        const { paymentDate, Details, paymentAmount, isPayment } = record;
        message += `📋 <b>记录 ${index + 1}</b>\n`;
        message += `  • 支付日期: ${paymentDate}\n`;
        message += `  • 支付金额: <b>${paymentAmount}</b> ${isPayment ? '✅' : ''}\n`;
        message += `  • 备注: ${Details}\n`;
        message += `\n`;
      });
    } else {
      message += `📊 <b>维护记录</b>\n暂无维护记录\n`;
    }

    // 创建返回按钮
    const keyboard = [
      [Markup.button.callback('⬅️ 返回列表', 'back_to_list')]
    ];

    const replyMarkup = Markup.inlineKeyboard(keyboard);

    await ctx.replyWithHTML(message, replyMarkup);
  } catch (error) {
    console.error('显示项目详情时发生错误:', error);
    await ctx.reply('显示项目详情时发生错误');
  }
}

// 处理详情按钮点击
async function handleDetailsAction(ctx) {
  const projectId = ctx.match[1];
  await handleDetails(ctx, projectId);
}

// 处理返回列表按钮
async function handleBackToList(ctx) {
  // 直接调用 handleList 函数以返回列表
  await handleList(ctx, 0);
}

module.exports = {
  handleDetails,
  handleDetailsAction,
  handleBackToList
};
