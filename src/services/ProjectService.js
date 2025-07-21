const Project = require('../models/Project');
const logger = require('../utils/logger');

class ProjectService {
  /**
   * 获取所有项目（包括已删除的）
   */
  async getAllProjects(includeDeleted = false) {
    try {
      let query = Project.find();
      if (!includeDeleted) {
        query = query.where({ isDeleted: { $ne: true } });
      }
      return await query.sort({ projectId: 1 });
    } catch (error) {
      logger.error('获取所有项目失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 根据ID获取项目
   */
  async getProjectById(projectId, includeDeleted = false) {
    try {
      let query = Project.findOne({ projectId });
      if (!includeDeleted) {
        query = query.where({ isDeleted: { $ne: true } });
      }
      return await query;
    } catch (error) {
      logger.error('根据ID获取项目失败', { projectId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取分页项目列表
   */
  async getProjectsWithPagination(page = 0, limit = 10, includeDeleted = false) {
    try {
      const skip = page * limit;
      let query = Project.find();

      if (!includeDeleted) {
        query = query.where({ isDeleted: { $ne: true } });
      }

      const projects = await query
        .sort({ projectId: 1 })
        .skip(skip)
        .limit(limit);

      let countQuery = Project.countDocuments();
      if (!includeDeleted) {
        countQuery = countQuery.where({ isDeleted: { $ne: true } });
      }
      const total = await countQuery;

      return {
        projects,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 0
      };
    } catch (error) {
      logger.error('获取分页项目列表失败', { page, limit, error: error.message });
      throw error;
    }
  }

  /**
   * 创建新项目
   */
  async createProject(projectData) {
    try {
      const project = new Project(projectData);
      await project.save();
      logger.info('项目创建成功', { projectId: project.projectId });
      return project;
    } catch (error) {
      logger.error('创建项目失败', { projectData, error: error.message });
      throw error;
    }
  }

  /**
   * 更新项目
   */
  async updateProject(projectId, updateData) {
    try {
      const project = await Project.findOneAndUpdate(
        { projectId, isDeleted: { $ne: true } },
        updateData,
        { new: true, runValidators: true }
      );

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      logger.info('项目更新成功', { projectId });
      return project;
    } catch (error) {
      logger.error('更新项目失败', { projectId, updateData, error: error.message });
      throw error;
    }
  }

  /**
   * 软删除项目
   */
  async deleteProject(projectId) {
    try {
      const project = await Project.findOneAndUpdate(
        { projectId, isDeleted: { $ne: true } },
        {
          isDeleted: true,
          deletedAt: new Date()
        },
        { new: true }
      );

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      logger.info('项目软删除成功', { projectId });
      return project;
    } catch (error) {
      logger.error('软删除项目失败', { projectId, error: error.message });
      throw error;
    }
  }

  /**
   * 恢复已删除的项目
   */
  async restoreProject(projectId) {
    try {
      const project = await Project.findOneAndUpdate(
        { projectId, isDeleted: true },
        {
          isDeleted: false,
          deletedAt: null
        },
        { new: true }
      );

      if (!project) {
        throw new Error('项目不存在或未被删除');
      }

      logger.info('项目恢复成功', { projectId });
      return project;
    } catch (error) {
      logger.error('恢复项目失败', { projectId, error: error.message });
      throw error;
    }
  }

  /**
   * 添加维护记录
   */
  async addMaintenanceRecord(projectId, recordData) {
    try {
      const project = await Project.findOne({ projectId, isDeleted: { $ne: true } });

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      project.maintenanceRecords.push(recordData);
      await project.save();

      logger.info('维护记录添加成功', { projectId, recordData });
      return project;
    } catch (error) {
      logger.error('添加维护记录失败', { projectId, recordData, error: error.message });
      throw error;
    }
  }

  /**
   * 更新维护记录
   */
  async updateMaintenanceRecord(projectId, recordIndex, recordData) {
    try {
      const project = await Project.findOne({ projectId, isDeleted: { $ne: true } });

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      if (recordIndex < 0 || recordIndex >= project.maintenanceRecords.length) {
        throw new Error('维护记录索引无效');
      }

      // 只更新未删除的记录
      const record = project.maintenanceRecords[recordIndex];
      if (record.isDeleted) {
        throw new Error('该记录已被删除');
      }

      project.maintenanceRecords[recordIndex] = {
        ...record,
        ...recordData
      };

      await project.save();

      logger.info('维护记录更新成功', { projectId, recordIndex, recordData });
      return project;
    } catch (error) {
      logger.error('更新维护记录失败', { projectId, recordIndex, recordData, error: error.message });
      throw error;
    }
  }

  /**
   * 软删除维护记录
   */
  async deleteMaintenanceRecord(projectId, recordIndex) {
    try {
      const project = await Project.findOne({ projectId, isDeleted: { $ne: true } });

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      if (recordIndex < 0 || recordIndex >= project.maintenanceRecords.length) {
        throw new Error('维护记录索引无效');
      }

      // 只删除未删除的记录
      const record = project.maintenanceRecords[recordIndex];
      if (record.isDeleted) {
        throw new Error('该记录已被删除');
      }

      // 保留所有原有字段，只添加删除标记
      project.maintenanceRecords[recordIndex] = {
        paymentDate: record.paymentDate,
        paymentAmount: record.paymentAmount,
        isPayment: record.isPayment,
        Details: record.Details,
        isDeleted: true,
        deletedAt: new Date()
      };

      await project.save();

      logger.info('维护记录软删除成功', { projectId, recordIndex });
      return project;
    } catch (error) {
      logger.error('软删除维护记录失败', { projectId, recordIndex, error: error.message });
      throw error;
    }
  }

  /**
   * 恢复已删除的维护记录
   */
  async restoreMaintenanceRecord(projectId, recordIndex) {
    try {
      const project = await Project.findOne({ projectId, isDeleted: { $ne: true } });

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      if (recordIndex < 0 || recordIndex >= project.maintenanceRecords.length) {
        throw new Error('维护记录索引无效');
      }

      // 只恢复已删除的记录
      const record = project.maintenanceRecords[recordIndex];
      if (!record.isDeleted) {
        throw new Error('该记录未被删除');
      }

      // 保留所有原有字段，只移除删除标记
      project.maintenanceRecords[recordIndex] = {
        paymentDate: record.paymentDate,
        paymentAmount: record.paymentAmount,
        isPayment: record.isPayment,
        Details: record.Details,
        isDeleted: false,
        deletedAt: null
      };

      await project.save();

      logger.info('维护记录恢复成功', { projectId, recordIndex });
      return project;
    } catch (error) {
      logger.error('恢复维护记录失败', { projectId, recordIndex, error: error.message });
      throw error;
    }
  }

  /**
   * 获取当月费用统计
   */
  async getMonthlyStatistics(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const projects = await Project.find({ isDeleted: { $ne: true } });

      let totalReceived = 0;
      let totalUnpaid = 0;
      const projectDetails = [];

      projects.forEach(project => {
        let projectReceived = 0;
        let projectUnpaid = 0;

        project.maintenanceRecords
          .filter(record => !record.isDeleted)
          .forEach(record => {
            const paymentDate = new Date(record.paymentDate);
            const paymentAmount = Number(record.paymentAmount) || 0;

            if (paymentDate >= startDate && paymentDate <= endDate) {
              if (record.isPayment) {
                projectReceived += paymentAmount;
                totalReceived += paymentAmount;
              } else {
                projectUnpaid += paymentAmount;
                totalUnpaid += paymentAmount;
              }
            }
          });

        if (projectReceived > 0 || projectUnpaid > 0) {
          projectDetails.push({
            projectId: project.projectId,
            projectName: project.projectName,
            received: projectReceived,
            unpaid: projectUnpaid
          });
        }
      });

      // 按已收费用排序
      projectDetails.sort((a, b) => {
        if (a.received > 0 && b.received === 0) return -1;
        if (a.received === 0 && b.received > 0) return 1;
        return 0;
      });

      return {
        totalReceived,
        totalUnpaid,
        totalAmount: totalReceived + totalUnpaid,
        projectDetails,
        period: { year, month }
      };
    } catch (error) {
      logger.error('获取当月费用统计失败', { year, month, error: error.message });
      throw error;
    }
  }

  /**
   * 获取即将到期的支付记录
   */
  async getUpcomingPayments(reminderDays = 3) {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + reminderDays);

      const projects = await Project.find({ isDeleted: { $ne: true } });
      const upcomingPayments = [];

      projects.forEach(project => {
        project.maintenanceRecords
          .filter(record => !record.isDeleted && !record.isPayment)
          .forEach(record => {
            const paymentDate = new Date(record.paymentDate);
            const daysLeft = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));

            if (paymentDate >= today && paymentDate <= futureDate) {
              upcomingPayments.push({
                projectId: project.projectId,
                projectName: project.projectName,
                paymentDate: record.paymentDate,
                paymentAmount: record.paymentAmount,
                daysLeft,
                details: record.Details
              });
            }
          });
      });

      return upcomingPayments;
    } catch (error) {
      logger.error('获取即将到期的支付记录失败', { reminderDays, error: error.message });
      throw error;
    }
  }

  /**
   * 从JSON文件导入数据
   */
  async importFromJson(jsonData) {
    try {
      const projects = Array.isArray(jsonData) ? jsonData : [jsonData];

      for (const projectData of projects) {
        await Project.findOneAndUpdate(
          { projectId: projectData.projectId },
          projectData,
          { upsert: true, new: true }
        );
      }

      logger.info('数据导入成功', { count: projects.length });
      return projects.length;
    } catch (error) {
      logger.error('数据导入失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取已删除的项目列表
   */
  async getDeletedProjects() {
    try {
      return await Project.find({ isDeleted: true }).sort({ deletedAt: -1 });
    } catch (error) {
      logger.error('获取已删除项目失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取已删除的维护记录
   */
  async getDeletedMaintenanceRecords(projectId) {
    try {
      const project = await Project.findOne({ projectId, isDeleted: { $ne: true } });

      if (!project) {
        throw new Error('项目不存在或已被删除');
      }

      return project.maintenanceRecords.filter(record => record.isDeleted);
    } catch (error) {
      logger.error('获取已删除维护记录失败', { projectId, error: error.message });
      throw error;
    }
  }
}

module.exports = new ProjectService(); 