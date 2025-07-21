const mongoose = require("mongoose");

// 定义模型
const WfServerSchema = new mongoose.Schema({
  ip: { type: String, unique: true, required: true },
  serverName: { type: String, required: true },
  cost: { type: String, required: true },
  renewalDate: { type: String, required: true },
  launchDate: { type: String, required: true },
});

const WfServer = mongoose.model('WfServer', WfServerSchema);

module.exports = WfServer; 