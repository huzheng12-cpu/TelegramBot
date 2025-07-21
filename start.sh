#!/bin/bash

# Telegram Bot 启动脚本
# 作者: AI Assistant
# 日期: $(date +%Y-%m-%d)

echo "=========================================="
echo "        Telegram Bot 启动脚本"
echo "=========================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到.env文件，请确保已配置环境变量"
    echo "   需要配置 ROBOT_SERVER_EXPIRY_REMINDER_TOKEN 等变量"
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

# 启动应用
echo "🚀 正在启动Telegram Bot..."
echo "=========================================="

# 使用node启动应用
node app.js

# 如果程序异常退出，显示错误信息
if [ $? -ne 0 ]; then
    echo "❌ 程序异常退出，退出码: $?"
    echo "请检查日志信息或.env配置"
fi 