const { connectDatabase } = require('./src/config/database');
const ProjectService = require('./src/services/ProjectService');
const logger = require('./src/utils/logger');

async function testDeleteRecord() {
  console.log('🧪 测试删除记录功能...\n');

  try {
    // 连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');

    // 获取所有项目
    const projects = await ProjectService.getAllProjects();
    console.log(`📊 当前数据库中有 ${projects.length} 个项目`);

    if (projects.length === 0) {
      console.log('❌ 没有项目数据，无法测试功能');
      return;
    }

    const testProject = projects[0];
    console.log(`\n🔍 测试项目: ${testProject.projectName} (ID: ${testProject.projectId})`);

    // 检查项目是否有维护记录
    if (testProject.maintenanceRecords.length === 0) {
      console.log('❌ 项目没有维护记录，无法测试删除功能');
      return;
    }

    console.log(`📋 项目有 ${testProject.maintenanceRecords.length} 条维护记录`);

    // 找到第一个未删除的记录
    let recordIndex = -1;
    for (let i = 0; i < testProject.maintenanceRecords.length; i++) {
      if (!testProject.maintenanceRecords[i].isDeleted) {
        recordIndex = i;
        break;
      }
    }

    if (recordIndex === -1) {
      console.log('❌ 没有找到未删除的记录，无法测试删除功能');
      return;
    }

    const record = testProject.maintenanceRecords[recordIndex];
    console.log(`\n📋 测试记录 ${recordIndex + 1}:`);
    console.log(`   - 支付日期: ${record.paymentDate}`);
    console.log(`   - 支付金额: ${record.paymentAmount}`);
    console.log(`   - 是否已付: ${record.isPayment}`);
    console.log(`   - 备注: ${record.Details}`);
    console.log(`   - 已删除: ${record.isDeleted}`);

    // 测试删除记录
    console.log('\n🗑️ 测试删除记录...');
    const updatedProject = await ProjectService.deleteMaintenanceRecord(testProject.projectId, recordIndex);
    console.log(`✅ 记录删除成功`);

    // 验证记录被标记为已删除
    const deletedRecord = updatedProject.maintenanceRecords[recordIndex];
    console.log(`   - 记录已删除: ${deletedRecord.isDeleted}`);
    console.log(`   - 删除时间: ${deletedRecord.deletedAt}`);

    // 验证统计不包含已删除记录
    console.log('\n📊 验证统计不包含已删除记录...');
    const now = new Date();
    const statistics = await ProjectService.getMonthlyStatistics(now.getFullYear(), now.getMonth() + 1);
    console.log(`✅ 当月统计获取成功，已收: ${statistics.totalReceived}，未收: ${statistics.totalUnpaid}`);

    // 恢复记录
    console.log('\n🔄 恢复记录...');
    const restoredProject = await ProjectService.restoreMaintenanceRecord(testProject.projectId, recordIndex);
    console.log(`✅ 记录恢复成功`);

    // 验证记录已恢复
    const restoredRecord = restoredProject.maintenanceRecords[recordIndex];
    console.log(`   - 记录已恢复: ${!restoredRecord.isDeleted}`);
    console.log(`   - 删除时间: ${restoredRecord.deletedAt}`);

    console.log('\n🎉 删除记录功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    // 关闭数据库连接
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行测试
testDeleteRecord(); 