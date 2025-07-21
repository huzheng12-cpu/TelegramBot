
const { Markup } = require('telegraf');

// 统计当月费用总和
async function handleTotal(ctx) {
  try {
    const serverData = require('../data/serverData.json');

    // 获取当前月份的开始和结束日期
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    let totalReceived = 0;    // 已收费用
    let totalUnpaid = 0;      // 未收费用
    const projectDetails = serverData.map(project => {
      const { projectId, projectName, maintenanceRecords } = project;
      let projectReceived = 0;
      let projectUnpaid = 0;

      // 只统计维护记录
      maintenanceRecords?.forEach(record => {
        const paymentDate = new Date(record.paymentDate);
        const paymentAmount = Number(record.paymentAmount) || 0;

        // 检查是否在当前月份
        if (paymentDate >= monthStart && paymentDate <= monthEnd) {
          if (record.isPayment) {
            projectReceived += paymentAmount;
            totalReceived += paymentAmount;
          } else {
            projectUnpaid += paymentAmount;
            totalUnpaid += paymentAmount;
          }
        }
      });

      return (projectReceived > 0 || projectUnpaid > 0) ? {
        projectId,
        projectName,
        received: projectReceived,
        unpaid: projectUnpaid
      } : null;
    }).filter(Boolean);

    // 根据已收和未收排序，已收的放最前面
    projectDetails.sort((a, b) => {
      if (a.received > 0 && b.received === 0) return -1;
      if (a.received === 0 && b.received > 0) return 1;
      return 0;
    });

    const totalAmount = totalReceived + totalUnpaid;

    // 构建消息
    const message = `
      <b>${currentYear}年${currentMonth + 1}月维护费统计</b>\n\n
      💰 <b>总计</b>\n
      • 已收费用: <b>${totalReceived.toLocaleString()}</b> USDT ✅\n
      • 未收费用: <b>${totalUnpaid.toLocaleString()}</b> USDT ⚠️\n
      • 当月总额: <b>${totalAmount.toLocaleString()}</b> USDT\n\n
      📅 统计时间: ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN')}
    `;

    const keyboard = [
      [Markup.button.callback('查看项目明细', 'view_project_details')]
    ];

    const replyMarkup = Markup.inlineKeyboard(keyboard);

    await ctx.replyWithHTML(message.trim(), replyMarkup);

  } catch (error) {
    console.error('统计费用时发生错误:', error);
    await ctx.reply('统计费用时发生错误');
  }
}

async function handleViewProjectDetails(ctx) {
  console.log('查看项目明细');

  try {
    const serverData = require('../data/serverData.json');
    let message = '';

    if (serverData.length > 0) {
      message += ` <b>项目明细</b>\n\n`;
      serverData.forEach(project => {
        const { projectId, projectName, maintenanceRecords } = project;
        let projectReceived = 0;
        let projectUnpaid = 0;
        message += `🏢 <b>${projectName}</b> (ID: ${projectId})\n`;


        maintenanceRecords.forEach(record => {
          const paymentDate = new Date(record.paymentDate);
          const now = new Date();
          if (paymentDate.getFullYear() === now.getFullYear() && paymentDate.getMonth() === now.getMonth()) {
            message += `   备注: ${record.Details || '无'}\n`;
            message += `   时间: ${record.paymentDate || '无'}\n`;
            if (record.isPayment) {
              projectReceived += parseFloat(record.paymentAmount);
            } else {
              projectUnpaid += parseFloat(record.paymentAmount);
            }
          }
        });

        if (projectReceived > 0) {
          message += `  ✅ 已收: ${projectReceived.toLocaleString()} USDT\n`;
        }
        if (projectUnpaid > 0) {
          message += `  ⚠️ 未收: ${projectUnpaid.toLocaleString()} USDT\n`;
        }
        message += `\n`;
      });
    } else {
      message += `📋 <b>项目明细</b>\n本月暂无维护费记录\n`;
    }

    await ctx.replyWithHTML(message.trim());
  } catch (error) {
    console.error('查看项目明细时发生错误:', error);
    await ctx.reply('查看项目明细时发生错误');
  }
}

module.exports = {
  handleTotal,
  handleViewProjectDetails
};

// 处理查看项目明细按钮点击
