@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 强制修复数据库
color 0C

echo ========================================
echo   强制修复数据库 - 添加缺失字段
echo ========================================
echo.
echo 此脚本将：
echo   1. 停止所有 Node.js 进程
echo   2. 直接修改数据库添加缺失字段
echo   3. 同步 Prisma schema
echo   4. 重新生成 Prisma Client
echo.
pause

REM 检查是否在正确目录
if not exist "package.json" (
    echo 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo.
echo [步骤 1/4] 停止所有 Node.js 进程...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✓ 已停止
echo.

echo [步骤 2/4] 直接修复数据库（添加字段）...
echo.
node scripts/fix-database-direct.js
if errorlevel 1 (
    echo.
    echo 直接修复失败，尝试使用 Prisma 方式...
    echo.
    npx prisma db push --accept-data-loss --skip-generate
    if errorlevel 1 (
        echo.
        echo ========================================
        echo   修复失败！
        echo ========================================
        echo.
        echo 请手动执行以下命令：
        echo   1. npx prisma db push --accept-data-loss
        echo   2. npx prisma generate
        echo.
        pause
        exit /b 1
    )
)
echo.

echo [步骤 3/4] 同步 Prisma schema...
npx prisma db push --accept-data-loss --skip-generate
if errorlevel 1 (
    echo 警告: Schema 同步可能有问题，但继续执行...
) else (
    echo ✓ Schema 已同步
)
echo.

echo [步骤 4/4] 重新生成 Prisma Client...
npx prisma generate
if errorlevel 1 (
    echo.
    echo ========================================
    echo   Prisma Client 生成失败！
    echo ========================================
    echo.
    pause
    exit /b 1
)
echo ✓ Prisma Client 已生成
echo.

echo ========================================
echo   修复完成！
echo ========================================
echo.
echo 现在可以重新启动网站了
echo.
pause
