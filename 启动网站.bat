@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"
title 购物网站 - 开发服务器

echo.
echo  ========================================
echo    购物网站 - 开发服务器
echo  ========================================
echo.

REM 检查 Node.js 环境
where npm >nul 2>&1
if errorlevel 1 (
    echo  [错误] 未找到 npm，请先安装 Node.js
    echo  下载地址: https://nodejs.org
    pause
    exit /b 1
)

REM 校验项目目录
if not exist "package.json" (
    echo  [错误] 未找到 package.json，请确保在项目根目录运行
    pause
    exit /b 1
)

REM 安装依赖（缺失时）
if not exist "node_modules" (
    echo  [1/2] 安装依赖...
    call npm install
    if errorlevel 1 (
        echo  [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo  [完成] 依赖已安装
    echo.
) else (
    echo  [跳过] 依赖已存在
    echo.
)

REM 启动开发服务器
echo  [启动] Next.js 开发服务器
echo.
echo  ----------------------------------------
echo   访问地址: http://localhost:3000
echo   停止服务: Ctrl + C
echo  ----------------------------------------
echo.

npm run dev

echo.
echo  ----------------------------------------
echo  服务器已停止
echo  ----------------------------------------
pause
