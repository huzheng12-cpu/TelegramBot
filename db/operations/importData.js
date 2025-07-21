const fs = require('fs');
const Server = require('../models/Server');
require('../index');

// 导入数据
async function importData() {
  try {
    const data = JSON.parse(fs.readFileSync('data/serverData.json', 'utf8'));
    for (const server of data) {
      // 确保数据有效
      if (!server.ids) {
        console.warn('Skipping invalid server data:', server);
        continue;
      }
      
      // 使用 addWfServer 函数处理导入
      await addWfServer(server);
    }
  } catch (error) {
    console.error('Error importing WF servers:', error);
    throw error;
  }
}

// 添加单条数据
function addServer(serverData) {
  const server = new Server(serverData);
  return server.save();
}

// 更新单条数据
function updateServer(ip, updateData) {
  return Server.findOneAndUpdate({ ip }, updateData, { new: true });
}

// 删除单条数据
function deleteServer(ip) {
  return Server.findOneAndDelete({ ip });
}

// 查询单条数据
function findServer(ip) {
  return Server.findOne({ ip });
}

// 获取所有数据并支持分页和排序
function findAllServers(page = 1, limit = 10, sortBy = 'expiryDate', order = 'desc') {
  const sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;
  return Server.find({})
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
}

module.exports = { importData, addServer, updateServer, deleteServer, findServer, findAllServers };