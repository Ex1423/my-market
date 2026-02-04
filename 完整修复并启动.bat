@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========== 1. 停止所有 Node.js 进程 ==========
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo ========== 2. 同步数据库结构 ==========
npx prisma db push
if errorlevel 1 (
  echo.
  echo 数据库同步失败，请检查上方报错。
  pause
  exit /b 1
)
echo.
echo ========== 3. 重新生成 Prisma Client ==========
npx prisma generate
if errorlevel 1 (
  echo.
  echo Prisma Client 生成失败，请检查上方报错。
  pause
  exit /b 1
)
echo.
echo ========== 4. 启动网站 ==========
echo 浏览器访问: http://localhost:3000
echo 按 Ctrl+C 可停止服务器
echo.
npm run dev
