// 模拟Telegram按钮点击的测试
function testTelegramButtonSimulation() {
  console.log('🧪 模拟Telegram按钮点击测试...\n');

  // 模拟按钮callback数据
  const projectId = '1';
  const recordIndex = '0';

  const deleteButtonCallback = `delete_record_${projectId}_${recordIndex}`;
  const confirmDeleteButtonCallback = `confirm_delete_record_${projectId}_${recordIndex}`;

  console.log('按钮callback数据:');
  console.log(`删除按钮: ${deleteButtonCallback}`);
  console.log(`确认删除按钮: ${confirmDeleteButtonCallback}`);

  // 模拟ctx.match数据
  const deleteMatch = deleteButtonCallback.match(/delete_record_(\d+)_(\d+)/);
  const confirmDeleteMatch = confirmDeleteButtonCallback.match(/confirm_delete_record_(\d+)_(\d+)/);

  console.log('\n模拟ctx.match数据:');
  console.log('删除按钮match:', deleteMatch);
  console.log('确认删除按钮match:', confirmDeleteMatch);

  if (deleteMatch) {
    const [projectIdFromMatch, recordIndexFromMatch] = deleteMatch.slice(1);
    console.log(`删除按钮参数解析: projectId=${projectIdFromMatch}, recordIndex=${recordIndexFromMatch}`);
  }

  if (confirmDeleteMatch) {
    const [projectIdFromMatch, recordIndexFromMatch] = confirmDeleteMatch.slice(1);
    console.log(`确认删除按钮参数解析: projectId=${projectIdFromMatch}, recordIndex=${recordIndexFromMatch}`);
  }

  // 测试正则表达式
  const patterns = {
    delete: /delete_record_(\d+)_(\d+)/,
    confirmDelete: /confirm_delete_record_(\d+)_(\d+)/,
    restore: /restore_record_(\d+)_(\d+)/
  };

  console.log('\n正则表达式测试:');
  Object.entries(patterns).forEach(([name, pattern]) => {
    const testCallback = `${name}_record_${projectId}_${recordIndex}`;
    const match = testCallback.match(pattern);
    console.log(`${name}模式匹配 "${testCallback}": ${match ? '成功' : '失败'}`);
    if (match) {
      console.log(`  捕获组: [${match.slice(1).join(', ')}]`);
    }
  });

  console.log('\n✅ 按钮模拟测试完成！');
}

// 运行测试
testTelegramButtonSimulation(); 