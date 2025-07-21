const { Telegraf } = require('telegraf');

// 测试按钮处理器注册
function testButtonRegistration() {
  console.log('🧪 测试按钮处理器注册...\n');

  const bot = new Telegraf('test_token');

  // 注册按钮处理器
  bot.action(/delete_record_(\d+)_(\d+)/, (ctx) => {
    console.log('✅ 删除记录按钮处理器被调用');
    console.log('callback data:', ctx.callbackQuery.data);
    console.log('match:', ctx.match);
    return ctx.reply('删除记录按钮处理器工作正常');
  });

  bot.action(/confirm_delete_record_(\d+)_(\d+)/, (ctx) => {
    console.log('✅ 确认删除记录按钮处理器被调用');
    console.log('callback data:', ctx.callbackQuery.data);
    console.log('match:', ctx.match);
    return ctx.reply('确认删除记录按钮处理器工作正常');
  });

  // 测试callback数据
  const testCallbacks = [
    'delete_record_1_2',
    'confirm_delete_record_1_2'
  ];

  console.log('测试callback数据:');
  testCallbacks.forEach(callback => {
    console.log(`  ${callback}`);
  });

  console.log('\n✅ 按钮处理器注册测试完成！');
  console.log('注意：这只是模拟测试，实际需要在Telegram中测试');
}

// 运行测试
testButtonRegistration(); 