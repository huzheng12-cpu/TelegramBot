#!/bin/bash

# Telegram Bot 启动脚本
# 作者: AI Assistant
# 日期: $(date +%Y-%m-%d)

echo "=========================================="
echo "    Telegram 服务器到期提醒机器人"
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
    echo "⚠️  警告: 未找到.env文件"
    echo "📝 正在从模板创建.env文件..."
    if [ -f "config.env.example" ]; then
        cp config.env.example .env
        echo "✅ .env文件已创建，请编辑配置文件"
        echo "   需要配置 TELEGRAM_BOT_TOKEN 等变量"
        exit 1
    else
        echo "❌ 未找到config.env.example模板文件"
        exit 1
    fi
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

# 检查数据文件是否存在
if [ ! -f "data/serverData.json" ]; then
    echo "⚠️  警告: 未找到初始数据文件 data/serverData.json"
    echo "   首次启动时会创建空数据库"
fi

# 启动应用
echo "🚀 正在启动Telegram机器人..."
echo "=========================================="

# 使用npm启动应用
npm start

# 如果程序异常退出，显示错误信息
if [ $? -ne 0 ]; then
    echo "❌ 程序异常退出，退出码: $?"
    echo "请检查日志信息或.env配置"
fi 