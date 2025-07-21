const dotenv = require('dotenv');
dotenv.config();
const { Telegraf } = require('telegraf');
const { handleList, handleListPage } = require('./list');
const { handleDetails, handleDetailsAction, handleBackToList } = require('./details');
const { handleTotal, handleViewProjectDetails } = require('./total');
const bot = new Telegraf(process.env.ROBOT_SERVER_EXPIRY_REMINDER_TOKEN);

const { CronJob } = require('cron');
const serverData = require('../data/serverData.json');
// 注册命令
bot.start((ctx) => {
  ctx.reply('欢迎使用！使用 /list 来管理服务器。');
});
bot.on('text', (ctx, next) => {
  const messageText = ctx.message.text;
  if (!['/list', '/details', '/total'].some(command => messageText.startsWith(command))) {
    ctx.reply('命令列表:\n/list\n/total');
  } else {
    return next();
  }
});

// 列出所有服务器
bot.command('list', handleList);

//列出当月收取费用的总和
bot.command('total', handleTotal);

// 查看项目明细
// bot.command('view_project_details', handleViewProjectDetails);
bot.action('view_project_details', handleViewProjectDetails);

// 处理分页按钮
bot.action(/list_page_(\d+)/, handleListPage);

// 处理详情按钮
bot.action(/details_(\d+)/, handleDetailsAction);

// 处理返回列表按钮
bot.action('back_to_list', handleBackToList);

// 查看项目详情
bot.command('details', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length !== 1) {
    return ctx.reply('请使用正确的格式: /details <projectId>');
  }
  const projectId = args[0];
  await handleDetails(ctx, projectId);
});




// 定时器任务：每天检查支付日期
const checkPaymentDates = new CronJob('0 0 * * *', async () => {
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);
  serverData.forEach(({ projectId, projectName, maintenanceRecords }) => {
    maintenanceRecords
      .filter(({ isPayment, paymentDate }) => {
        const condition = !isPayment && new Date(paymentDate) <= threeDaysLater && new Date(paymentDate) >= today;
        return condition;
      })
      .forEach(({ paymentDate, paymentAmount }) => {
        const daysLeft = Math.ceil((new Date(paymentDate) - today) / (1000 * 60 * 60 * 24));
        bot.telegram.sendMessage(7786672932,
          `提醒: 项目 "${projectName}" (ID: ${projectId}) 的支付日期在 ${daysLeft} 天后到期。需要支付${paymentAmount}USDT`);
      });
  });
});



// 启动定时器
checkPaymentDates.start();

// 启动机器人
bot.launch();

console.log('机器人已启动');
