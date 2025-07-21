const mongoose = require("mongoose");

// 定义模型
const ServerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  expiryDate: String,
  ip: { type: String, unique: true }
});

const Server = mongoose.model('Server', ServerSchema);

module.exports = Server; 