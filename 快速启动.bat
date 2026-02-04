@echo off
chcp 65001 >nul
title 启动购物网站
cd /d "%~dp0"
echo ========================================
echo   购物网站 - 开发服务器
echo ========================================
echo.
echo 当前目录: %CD%
echo.
echo 正在检查依赖...
if not exist "node_modules" (
    echo 检测到缺少依赖，正在安装...
    call npm install
    if errorlevel 1 (
        echo.
        echo 依赖安装失败！
        pause
        exit /b 1
    )
    echo.
    echo 依赖安装完成！
    echo.
)
echo.
echo ========================================
echo   启动开发服务器
echo ========================================
echo.
echo 服务器启动后，请在浏览器访问: http://localhost:3000
echo.
echo 按 Ctrl+C 可以停止服务器
echo.
echo ========================================
echo.
npm run dev
pause
