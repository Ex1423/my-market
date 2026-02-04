@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========== 修复 User 表缺失字段 ==========
echo.
echo 正在添加 avatar, phone, notificationSound 字段...
echo.

REM 使用 SQLite 命令行工具添加字段
REM 检查数据库文件位置
if exist "dev.db" (
    set DB_FILE=dev.db
) else if exist "prisma\dev.db" (
    set DB_FILE=prisma\dev.db
) else (
    echo 错误: 找不到数据库文件
    pause
    exit /b 1
)

echo 数据库文件: %DB_FILE%
echo.

REM 使用 Prisma db push 来同步 schema（推荐方式）
echo ========== 同步数据库结构 ==========
npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo.
    echo 数据库同步失败，请检查上方报错。
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
echo ========== 完成！User 表字段已更新 ==========
echo 现在可以重新启动网站了
pause
