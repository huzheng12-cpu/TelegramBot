const WfServer = require('../models/WfServer');

// 添加数据
async function addWfServer(serverData) {
  try {
    const server = new WfServer(serverData);
    return await server.save();
  } catch (error) {
    console.error('添加服务周期失败:', error);
    throw error;
  }
}

// 更新数据
async function updateWfServer(ip, updateData) {
  try {
    const updatedServer = await WfServer.findOneAndUpdate({ ip }, updateData, { new: true });
    if (!updatedServer) {
      throw new Error(`服务周期 IP ${ip} 不存在`);
    }
    return updatedServer;
  } catch (error) {
    console.error('更新服务周期失败:', error);
    throw error;
  }
}

// 删除数据
async function deleteWfServer(ip) {
  try {
    const deletedServer = await WfServer.findOneAndDelete({ ip });
    if (!deletedServer) {
      throw new Error(`服务周期 IP ${ip} 不存在`);
    }
    return deletedServer;
  } catch (error) {
    console.error('删除服务周期失败:', error);
    throw error;
  }
}

// 查询单个数据
async function findWfServer(ip) {
  console.log(ip);

  try {
    const server = await WfServer.findOne({ ip });
    if (!server) {
      throw new Error(`服务周期 IP ${ip} 不存在`);
    }
    return server;
  } catch (error) {
    // console.error('查询服务周期失败:', error);
    throw error;
  }
}

// 获取所有数据并支持分页和排序
async function findAllWfServers(page = 1, limit = 10, sortBy = 'renewalDate', order = 'desc') {
  try {
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
    return await WfServer.find({})
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    console.error('获取服务周期列表失败:', error);
    throw error;
  }
}

module.exports = { addWfServer, updateWfServer, deleteWfServer, findWfServer, findAllWfServers };