@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 快速修复并启动网站
color 0B

echo ========================================
echo   快速修复数据库并启动网站
echo ========================================
echo.

REM 检查是否在正确目录
if not exist "package.json" (
    echo 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo [步骤 1] 停止 Node.js 进程...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul
echo.

echo [步骤 2] 修复数据库...
npx prisma db push --accept-data-loss --skip-generate >nul 2>&1
if errorlevel 1 (
    echo 警告: 数据库同步可能有问题，但继续执行...
) else (
    echo ✓ 数据库已同步
)
echo.

echo [步骤 3] 生成 Prisma Client...
npx prisma generate >nul 2>&1
if errorlevel 1 (
    echo 警告: Prisma Client 生成可能有问题，但继续执行...
) else (
    echo ✓ Prisma Client 已生成
)
echo.

echo [步骤 4] 启动开发服务器...
echo.
echo ========================================
echo   服务器启动中...
echo ========================================
echo.
echo 启动后，请在浏览器访问: http://localhost:3000
echo 按 Ctrl+C 可以停止服务器
echo.
echo ========================================
echo.

npm run dev
