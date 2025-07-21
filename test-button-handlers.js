const { Markup } = require('telegraf');

// 测试按钮callback数据格式
function testButtonCallbacks() {
  console.log('🧪 测试按钮callback数据格式...\n');

  // 测试删除记录按钮
  const projectId = '1';
  const recordIndex = '0';

  const deleteButtonCallback = `delete_record_${projectId}_${recordIndex}`;
  const confirmDeleteButtonCallback = `confirm_delete_record_${projectId}_${recordIndex}`;
  const restoreButtonCallback = `restore_record_${projectId}_${recordIndex}`;

  console.log('按钮callback数据:');
  console.log(`删除记录按钮: ${deleteButtonCallback}`);
  console.log(`确认删除按钮: ${confirmDeleteButtonCallback}`);
  console.log(`恢复记录按钮: ${restoreButtonCallback}`);

  // 测试正则表达式匹配
  const deletePattern = /delete_record_(\d+)_(\d+)/;
  const confirmDeletePattern = /confirm_delete_record_(\d+)_(\d+)/;
  const restorePattern = /restore_record_(\d+)_(\d+)/;

  console.log('\n正则表达式匹配测试:');

  const deleteMatch = deleteButtonCallback.match(deletePattern);
  console.log(`删除按钮匹配: ${deleteMatch ? '成功' : '失败'}`);
  if (deleteMatch) {
    console.log(`  项目ID: ${deleteMatch[1]}, 记录索引: ${deleteMatch[2]}`);
  }

  const confirmDeleteMatch = confirmDeleteButtonCallback.match(confirmDeletePattern);
  console.log(`确认删除按钮匹配: ${confirmDeleteMatch ? '成功' : '失败'}`);
  if (confirmDeleteMatch) {
    console.log(`  项目ID: ${confirmDeleteMatch[1]}, 记录索引: ${confirmDeleteMatch[2]}`);
  }

  const restoreMatch = restoreButtonCallback.match(restorePattern);
  console.log(`恢复按钮匹配: ${restoreMatch ? '成功' : '失败'}`);
  if (restoreMatch) {
    console.log(`  项目ID: ${restoreMatch[1]}, 记录索引: ${restoreMatch[2]}`);
  }

  console.log('\n✅ 按钮callback数据格式测试完成！');
}

// 运行测试
testButtonCallbacks(); 