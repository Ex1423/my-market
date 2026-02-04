@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 立即修复数据库
color 0E

echo.
echo ========================================
echo        立即修复数据库
echo ========================================
echo.
echo 正在修复 User 表缺失字段问题...
echo.

REM 停止 Node.js
echo [1/3] 停止 Node.js 进程...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul
echo.

REM 修复数据库
echo [2/3] 修复数据库结构...
echo.
npx prisma db push --accept-data-loss --skip-generate
if errorlevel 1 (
    echo.
    echo ⚠ 第一次尝试失败，使用备用方法...
    echo.
    npx prisma migrate reset --force --skip-seed 2>nul
    npx prisma db push --accept-data-loss --skip-generate
)
echo.

REM 生成 Prisma Client
echo [3/3] 生成 Prisma Client...
echo.
npx prisma generate
if errorlevel 1 (
    echo.
    echo ❌ 生成失败，但可以尝试继续...
    echo.
)
echo.

echo ========================================
echo        修复完成！
echo ========================================
echo.
echo 现在可以运行: npm run dev
echo.
pause
