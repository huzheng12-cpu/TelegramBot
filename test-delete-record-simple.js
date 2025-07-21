const { connectDatabase } = require('./src/config/database');
const ProjectService = require('./src/services/ProjectService');

async function testDeleteRecordSimple() {
  console.log('🧪 简单测试删除记录功能...\n');

  try {
    await connectDatabase();
    console.log('✅ 数据库连接成功');

    // 获取第一个项目
    const projects = await ProjectService.getAllProjects();
    if (projects.length === 0) {
      console.log('❌ 没有项目数据');
      return;
    }

    const project = projects[0];
    console.log(`📋 测试项目: ${project.projectName} (ID: ${project.projectId})`);

    // 检查维护记录
    if (project.maintenanceRecords.length === 0) {
      console.log('❌ 没有维护记录');
      return;
    }

    console.log(`📋 维护记录数量: ${project.maintenanceRecords.length}`);

    // 找到第一个未删除的记录
    let recordIndex = -1;
    for (let i = 0; i < project.maintenanceRecords.length; i++) {
      if (!project.maintenanceRecords[i].isDeleted) {
        recordIndex = i;
        break;
      }
    }

    if (recordIndex === -1) {
      console.log('❌ 没有未删除的记录');
      return;
    }

    const record = project.maintenanceRecords[recordIndex];
    console.log(`\n📋 测试记录 ${recordIndex + 1}:`);
    console.log(`   - 支付日期: ${record.paymentDate}`);
    console.log(`   - 支付金额: ${record.paymentAmount}`);
    console.log(`   - 是否已付: ${record.isPayment}`);
    console.log(`   - 已删除: ${record.isDeleted}`);

    // 删除记录
    console.log('\n🗑️ 删除记录...');
    const updatedProject = await ProjectService.deleteMaintenanceRecord(project.projectId, recordIndex);
    console.log('✅ 删除成功');

    // 验证删除
    const deletedRecord = updatedProject.maintenanceRecords[recordIndex];
    console.log(`   - 记录已删除: ${deletedRecord.isDeleted}`);
    console.log(`   - 删除时间: ${deletedRecord.deletedAt}`);

    // 恢复记录
    console.log('\n🔄 恢复记录...');
    const restoredProject = await ProjectService.restoreMaintenanceRecord(project.projectId, recordIndex);
    console.log('✅ 恢复成功');

    // 验证恢复
    const restoredRecord = restoredProject.maintenanceRecords[recordIndex];
    console.log(`   - 记录已恢复: ${!restoredRecord.isDeleted}`);
    console.log(`   - 删除时间: ${restoredRecord.deletedAt}`);

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

testDeleteRecordSimple(); 