@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在恢复用户和商品数据...
echo.
node scripts/restore-from-backup.js
echo.
pause
