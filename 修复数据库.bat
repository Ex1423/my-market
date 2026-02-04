@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========== 停止所有 Node.js 进程 ==========
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo ========== 同步数据库结构 ==========
echo 注意: 如果提示字段已存在，这是正常的，可以继续
npx prisma db push --accept-data-loss
if errorlevel 1 (
  echo.
  echo 数据库同步失败，请检查上方报错。
  echo.
  echo 如果错误是字段已存在，可以尝试手动修复：
  echo 1. 打开数据库文件
  echo 2. 检查 User 表是否已有 avatar, phone, notificationSound 字段
  echo 3. 如果没有，请手动添加这些字段
  pause
  exit /b 1
)
echo.
echo ========== 重新生成 Prisma Client ==========
npx prisma generate
if errorlevel 1 (
  echo.
  echo Prisma Client 生成失败，请检查上方报错。
  pause
  exit /b 1
)
echo.
echo ========== 完成！现在可以启动网站了 ==========
echo 运行: npm run dev
pause
