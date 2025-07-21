const fs = require('fs');
const path = require('path');
const { connectDatabase } = require('../config/database');
const ProjectService = require('../services/ProjectService');
const logger = require('./logger');

/**
 * 数据迁移工具
 */
class DataMigration {
  /**
   * 从JSON文件迁移数据到数据库
   */
  static async migrateFromJson(jsonFilePath) {
    try {
      // 连接数据库
      await connectDatabase();
      logger.info('数据库连接成功');

      // 检查文件是否存在
      if (!fs.existsSync(jsonFilePath)) {
        throw new Error(`文件不存在: ${jsonFilePath}`);
      }

      // 读取JSON文件
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      logger.info('JSON文件读取成功', { count: jsonData.length });

      // 导入数据
      const importedCount = await ProjectService.importFromJson(jsonData);
      logger.info('数据迁移完成', { importedCount });

      return { success: true, importedCount };
    } catch (error) {
      logger.error('数据迁移失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出数据库数据到JSON文件
   */
  static async exportToJson(outputPath) {
    try {
      // 连接数据库
      await connectDatabase();
      logger.info('数据库连接成功');

      // 获取所有项目
      const projects = await ProjectService.getAllProjects();
      logger.info('获取项目数据成功', { count: projects.length });

      // 转换为JSON格式
      const jsonData = projects.map(project => project.toObject());

      // 写入文件
      fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
      logger.info('数据导出完成', { outputPath });

      return { success: true, exportedCount: projects.length };
    } catch (error) {
      logger.error('数据导出失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 验证数据完整性
   */
  static async validateData() {
    try {
      // 连接数据库
      await connectDatabase();
      logger.info('数据库连接成功');

      // 获取所有项目
      const projects = await ProjectService.getAllProjects();

      const validation = {
        totalProjects: projects.length,
        projectsWithRecords: 0,
        totalRecords: 0,
        paidRecords: 0,
        unpaidRecords: 0,
        totalPaidAmount: 0,
        totalUnpaidAmount: 0,
        errors: []
      };

      projects.forEach(project => {
        if (project.maintenanceRecords && project.maintenanceRecords.length > 0) {
          validation.projectsWithRecords++;
          validation.totalRecords += project.maintenanceRecords.length;

          project.maintenanceRecords.forEach(record => {
            const amount = Number(record.paymentAmount) || 0;

            if (record.isPayment) {
              validation.paidRecords++;
              validation.totalPaidAmount += amount;
            } else {
              validation.unpaidRecords++;
              validation.totalUnpaidAmount += amount;
            }
          });
        }

        // 验证项目ID唯一性
        if (!project.projectId) {
          validation.errors.push(`项目缺少ID: ${project.projectName}`);
        }
      });

      logger.info('数据验证完成', validation);
      return { success: true, validation };
    } catch (error) {
      logger.error('数据验证失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const command = process.argv[2];
  const filePath = process.argv[3];

  switch (command) {
    case 'import':
      if (!filePath) {
        console.error('请指定JSON文件路径');
        process.exit(1);
      }
      DataMigration.migrateFromJson(filePath)
        .then(result => {
          console.log('迁移结果:', result);
          process.exit(result.success ? 0 : 1);
        });
      break;

    case 'export':
      const outputPath = filePath || path.join(__dirname, '../../data/exported_data.json');
      DataMigration.exportToJson(outputPath)
        .then(result => {
          console.log('导出结果:', result);
          process.exit(result.success ? 0 : 1);
        });
      break;

    case 'validate':
      DataMigration.validateData()
        .then(result => {
          console.log('验证结果:', result);
          process.exit(result.success ? 0 : 1);
        });
      break;

    default:
      console.log('用法:');
      console.log('  node dataMigration.js import <json文件路径>');
      console.log('  node dataMigration.js export [输出文件路径]');
      console.log('  node dataMigration.js validate');
      process.exit(1);
  }
}

module.exports = DataMigration; 