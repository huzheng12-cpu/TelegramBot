const mongoose = require('mongoose');
const WfServer = require('../models/WfServer');

async function fixNullIds() {
  try {
    // 找出所有 ids 为 null 的记录
    const nullRecords = await WfServer.find({ ids: null });
    
    // 删除重复的 null 记录，只保留一个
    if (nullRecords.length > 1) {
      for (let i = 1; i < nullRecords.length; i++) {
        await WfServer.findByIdAndDelete(nullRecords[i]._id);
      }
    }
    
    // 如果还有一个 null 记录，可以给它设置一个默认值或删除
    if (nullRecords[0]) {
      await WfServer.findByIdAndDelete(nullRecords[0]._id);
    }
    
    console.log('Fixed null ids records');
  } catch (error) {
    console.error('Error fixing null ids:', error);
  }
} 