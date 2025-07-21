const { Markup } = require('telegraf');

// 每页显示的服务器数量
const ITEMS_PER_PAGE = 10;

// 列出所有服务器（带分页）
async function handleList(ctx, page) {

  if (typeof page !== 'number') {
    page = 0;
  }
  try {
    const serverData = require('../data/serverData.json');

    if (serverData.length === 0) {
      return ctx.reply('暂无服务器数据');
    }

    const totalPages = Math.ceil(serverData.length / ITEMS_PER_PAGE);
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageData = serverData.slice(startIndex, endIndex);

    let message = `项目列表 (第 ${page + 1}/${totalPages} 页):\n\n`;

    const keyboard = [];

    currentPageData.forEach(project => {
      const { projectId, projectName } = project;

      // 添加查看详情按钮
      keyboard.push([Markup.button.callback(`查看详情: ${projectName}`, `details_${projectId}`)]);
    });

    // 只有当总页数大于1时才显示分页按钮
    if (totalPages > 1) {
      const row = [];

      if (page > 0) {
        row.push(Markup.button.callback('⬅️ 上一页', `list_page_${page - 1}`));
      }

      if (page < totalPages - 1) {
        row.push(Markup.button.callback('下一页 ➡️', `list_page_${page + 1}`));
      }

      if (row.length > 0) {
        keyboard.push(row);
      }
    }

    const replyMarkup = Markup.inlineKeyboard(keyboard);

    await ctx.replyWithHTML(message, replyMarkup);
  } catch (error) {
    await ctx.reply('列出服务器时发生错误');
  }
}

// 处理分页按钮点击
async function handleListPage(ctx) {
  const page = parseInt(ctx.match[1]);
  await handleList(ctx, page);
}

module.exports = {
  handleList,
  handleListPage
};
