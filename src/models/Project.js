const mongoose = require('mongoose');

const MaintenanceRecordSchema = new mongoose.Schema({
  paymentDate: { type: String, required: true },
  isPayment: { type: Boolean, default: false },
  Details: { type: String, default: '' },
  paymentAmount: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  projectName: { type: String, required: true },
  startDate: { type: String, required: true },
  maintenanceDetails: { type: String, default: '' },
  openingFee: { type: String, default: '0' },
  isOpeningFee: { type: Boolean, default: false },
  serverTime: { type: String, required: true },
  maintenanceRecords: { type: [MaintenanceRecordSchema], default: [] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Virtual fields for total and unpaid fees (只计算未删除的记录)
ProjectSchema.virtual('totalFee').get(function () {
  if (!this.maintenanceRecords || this.maintenanceRecords.length === 0) {
    return 0;
  }

  return this.maintenanceRecords
    .filter(record => !record.isDeleted)
    .reduce((total, record) => {
      const amount = Number(record.paymentAmount) || 0;
      return total + amount;
    }, 0);
});

ProjectSchema.virtual('unpaidFee').get(function () {
  if (!this.maintenanceRecords || this.maintenanceRecords.length === 0) {
    return 0;
  }

  return this.maintenanceRecords
    .filter(record => !record.isPayment && !record.isDeleted)
    .reduce((total, record) => {
      const amount = Number(record.paymentAmount) || 0;
      return total + amount;
    }, 0);
});

// 添加查询中间件，默认只查询未删除的项目
ProjectSchema.pre('find', function () {
  if (!this._conditions.isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

ProjectSchema.pre('findOne', function () {
  if (!this._conditions.isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

ProjectSchema.pre('findOneAndUpdate', function () {
  if (!this._conditions.isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

ProjectSchema.pre('findOneAndDelete', function () {
  if (!this._conditions.isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Create model
const Project = mongoose.model('Project', ProjectSchema);

// Safely create indexes
async function createIndexes() {
  try {
    await Project.createIndexes();
  } catch (error) {
    if (!error.message.includes('already has an index')) {
      console.error('创建索引失败:', error.message);
    }
  }
}

// Create indexes after model is defined
createIndexes();

module.exports = Project; 