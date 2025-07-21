const { Telegraf } = require('telegraf');

// 模拟Telegraf按钮处理器
function testButtonHandler() {
  console.log('🧪 测试Telegraf按钮处理器...\n');

  // 创建模拟的bot实例
  const bot = new Telegraf('test_token');

  // 模拟按钮处理器
  bot.action(/delete_record_(\d+)_(\d+)/, (ctx) => {
    console.log('🔍 删除记录按钮被点击');
    console.log('ctx.match:', ctx.match);
    const [projectId, recordIndex] = ctx.match.slice(1);
    console.log('解析的参数:', { projectId, recordIndex });
    return ctx.reply(`删除记录按钮被点击: projectId=${projectId}, recordIndex=${recordIndex}`);
  });

  bot.action(/confirm_delete_record_(\d+)_(\d+)/, (ctx) => {
    console.log('🔍 确认删除记录按钮被点击');
    console.log('ctx.match:', ctx.match);
    const [projectId, recordIndex] = ctx.match.slice(1);
    console.log('解析的参数:', { projectId, recordIndex });
    return ctx.reply(`确认删除记录按钮被点击: projectId=${projectId}, recordIndex=${recordIndex}`);
  });

  // 测试callback数据
  const testCallbacks = [
    'delete_record_1_0',
    'confirm_delete_record_1_0',
    'restore_record_1_0'
  ];

  console.log('测试callback数据:');
  testCallbacks.forEach(callback => {
    console.log(`  ${callback}`);
  });

  console.log('\n✅ 按钮处理器测试完成！');
  console.log('注意：这只是模拟测试，实际需要在Telegram中测试');
}

// 运行测试
testButtonHandler(); 