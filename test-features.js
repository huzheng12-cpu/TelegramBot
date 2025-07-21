const { connectDatabase } = require('./src/config/database');
const ProjectService = require('./src/services/ProjectService');
const logger = require('./src/utils/logger');

async function testFeatures() {
  console.log('🧪 测试新增功能...\n');

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

    // 测试更新项目
    console.log('\n📝 测试更新项目...');
    const updateData = {
      projectName: testProject.projectName + ' (已更新)',
      maintenanceDetails: '测试更新 - ' + new Date().toLocaleString()
    };

    const updatedProject = await ProjectService.updateProject(testProject.projectId, updateData);
    console.log(`✅ 项目更新成功: ${updatedProject.projectName}`);

    // 测试添加维护记录
    console.log('\n➕ 测试添加维护记录...');
    const recordData = {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentAmount: '1000',
      isPayment: false,
      Details: '测试添加的记录'
    };

    const projectWithRecord = await ProjectService.addMaintenanceRecord(testProject.projectId, recordData);
    console.log(`✅ 维护记录添加成功，当前记录数: ${projectWithRecord.maintenanceRecords.length}`);

    // 测试更新维护记录
    console.log('\n✏️ 测试更新维护记录...');
    const recordIndex = projectWithRecord.maintenanceRecords.length - 1;
    const updateRecordData = {
      isPayment: true,
      Details: '测试更新的记录'
    };

    const projectWithUpdatedRecord = await ProjectService.updateMaintenanceRecord(
      testProject.projectId,
      recordIndex,
      updateRecordData
    );
    console.log(`✅ 维护记录更新成功`);

    // 测试删除维护记录
    console.log('\n🗑️ 测试删除维护记录...');
    const projectWithoutRecord = await ProjectService.deleteMaintenanceRecord(
      testProject.projectId,
      recordIndex
    );
    console.log(`✅ 维护记录删除成功，剩余记录数: ${projectWithoutRecord.maintenanceRecords.length}`);

    // 恢复项目名称
    console.log('\n🔄 恢复项目名称...');
    await ProjectService.updateProject(testProject.projectId, {
      projectName: testProject.projectName
    });
    console.log('✅ 项目名称已恢复');

    console.log('\n🎉 所有功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 关闭数据库连接
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行测试
testFeatures(); 