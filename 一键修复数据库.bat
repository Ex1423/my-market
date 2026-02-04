@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 修复数据库 - 添加缺失字段
color 0A

echo ========================================
echo   修复数据库 - 添加 User 表缺失字段
echo ========================================
echo.

REM 检查是否在正确目录
if not exist "package.json" (
    echo 错误: 请在项目根目录运行此脚本
    echo 当前目录: %CD%
    pause
    exit /b 1
)

echo [1/3] 停止所有 Node.js 进程...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo 没有运行的 Node.js 进程，继续...
) else (
    echo Node.js 进程已停止
)
timeout /t 1 /nobreak >nul
echo.

echo [2/3] 同步数据库结构（添加缺失字段）...
echo 正在添加: avatar, phone, notificationSound 字段...
echo.
npx prisma db push --accept-data-loss --skip-generate
if errorlevel 1 (
    echo.
    echo ========================================
    echo   数据库同步失败！
    echo ========================================
    echo.
    echo 请检查上方错误信息
    echo.
    echo 如果错误是"字段已存在"，可以尝试：
    echo   1. 运行: node scripts/add-user-fields.js
    echo   2. 或手动检查数据库文件
    echo.
    pause
    exit /b 1
)
echo.
echo ✓ 数据库结构已同步
echo.

echo [3/3] 重新生成 Prisma Client...
npx prisma generate
if errorlevel 1 (
    echo.
    echo ========================================
    echo   Prisma Client 生成失败！
    echo ========================================
    echo.
    echo 请检查上方错误信息
    pause
    exit /b 1
)
echo.
echo ✓ Prisma Client 已重新生成
echo.

echo ========================================
echo   修复完成！
echo ========================================
echo.
echo 现在可以重新启动网站了：
echo   运行: npm run dev
echo   或双击: 启动网站.bat
echo.
pause
