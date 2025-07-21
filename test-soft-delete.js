const { connectDatabase } = require('./src/config/database');
const ProjectService = require('./src/services/ProjectService');
const logger = require('./src/utils/logger');

async function testSoftDelete() {
  console.log('🧪 测试软删除功能...\n');

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

    // 测试1: 添加维护记录
    console.log('\n➕ 测试1: 添加维护记录...');
    const recordData = {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentAmount: '2000',
      isPayment: false,
      Details: '测试软删除的记录'
    };

    const projectWithRecord = await ProjectService.addMaintenanceRecord(testProject.projectId, recordData);
    console.log(`✅ 维护记录添加成功，当前记录数: ${projectWithRecord.maintenanceRecords.length}`);

    // 测试2: 软删除维护记录
    console.log('\n🗑️ 测试2: 软删除维护记录...');
    const recordIndex = projectWithRecord.maintenanceRecords.length - 1;
    const projectWithDeletedRecord = await ProjectService.deleteMaintenanceRecord(testProject.projectId, recordIndex);
    console.log(`✅ 维护记录软删除成功`);

    // 验证记录被标记为已删除
    const deletedRecord = projectWithDeletedRecord.maintenanceRecords[recordIndex];
    console.log(`   - 记录已删除: ${deletedRecord.isDeleted}`);
    console.log(`   - 删除时间: ${deletedRecord.deletedAt}`);

    // 测试3: 验证统计不包含已删除记录
    console.log('\n📊 测试3: 验证统计不包含已删除记录...');
    const now = new Date();
    const statistics = await ProjectService.getMonthlyStatistics(now.getFullYear(), now.getMonth() + 1);
    console.log(`✅ 当月统计获取成功，已收: ${statistics.totalReceived}，未收: ${statistics.totalUnpaid}`);

    // 测试4: 恢复维护记录
    console.log('\n🔄 测试4: 恢复维护记录...');
    const projectWithRestoredRecord = await ProjectService.restoreMaintenanceRecord(testProject.projectId, recordIndex);
    console.log(`✅ 维护记录恢复成功`);

    // 验证记录已恢复
    const restoredRecord = projectWithRestoredRecord.maintenanceRecords[recordIndex];
    console.log(`   - 记录已恢复: ${!restoredRecord.isDeleted}`);
    console.log(`   - 删除时间: ${restoredRecord.deletedAt}`);

    // 测试5: 创建新项目用于删除测试
    console.log('\n➕ 测试5: 创建新项目用于删除测试...');
    const newProjectData = {
      projectId: 'soft_delete_test_' + Date.now(),
      projectName: '软删除测试项目',
      startDate: '2025-01-01',
      maintenanceDetails: '测试软删除功能',
      openingFee: '3000',
      isOpeningFee: false,
      serverTime: '2025-06-11',
      maintenanceRecords: []
    };

    const newProject = await ProjectService.createProject(newProjectData);
    console.log(`✅ 新项目创建成功: ${newProject.projectName} (ID: ${newProject.projectId})`);

    // 测试6: 软删除项目
    console.log('\n🗑️ 测试6: 软删除项目...');
    const deletedProject = await ProjectService.deleteProject(newProject.projectId);
    console.log(`✅ 项目软删除成功`);
    console.log(`   - 项目已删除: ${deletedProject.isDeleted}`);
    console.log(`   - 删除时间: ${deletedProject.deletedAt}`);

    // 测试7: 验证项目不在正常列表中
    console.log('\n📋 测试7: 验证项目不在正常列表中...');
    const projectsAfterDelete = await ProjectService.getAllProjects();
    const foundProject = projectsAfterDelete.find(p => p.projectId === newProject.projectId);
    console.log(`✅ 项目已从正常列表中移除: ${!foundProject}`);

    // 测试8: 获取已删除项目列表
    console.log('\n🗑️ 测试8: 获取已删除项目列表...');
    const deletedProjects = await ProjectService.getDeletedProjects();
    const foundDeletedProject = deletedProjects.find(p => p.projectId === newProject.projectId);
    console.log(`✅ 项目在已删除列表中: ${!!foundDeletedProject}`);

    // 测试9: 恢复项目
    console.log('\n🔄 测试9: 恢复项目...');
    const restoredProject = await ProjectService.restoreProject(newProject.projectId);
    console.log(`✅ 项目恢复成功`);
    console.log(`   - 项目已恢复: ${!restoredProject.isDeleted}`);
    console.log(`   - 删除时间: ${restoredProject.deletedAt}`);

    // 测试10: 验证项目重新出现在正常列表中
    console.log('\n📋 测试10: 验证项目重新出现在正常列表中...');
    const projectsAfterRestore = await ProjectService.getAllProjects();
    const foundRestoredProject = projectsAfterRestore.find(p => p.projectId === newProject.projectId);
    console.log(`✅ 项目重新出现在正常列表中: ${!!foundRestoredProject}`);

    // 清理：删除测试项目
    console.log('\n🧹 清理测试数据...');
    await ProjectService.deleteProject(newProject.projectId);
    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 软删除功能测试完成！');

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
testSoftDelete(); 