@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========== 1. 恢复用户和商品 ==========
node scripts/restore-from-backup.js
if errorlevel 1 (
  echo 恢复失败，请检查上方报错。
  pause
  exit /b 1
)
echo.
echo ========== 2. 启动网站 ==========
echo 浏览器访问: http://localhost:3000
echo 按 Ctrl+C 可停止服务器
echo.
npm run dev
