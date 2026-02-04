@echo off
REM 通过 PowerShell 启动（适用于在 PowerShell 中运行失败时）
powershell -ExecutionPolicy Bypass -File "%~dp0启动.ps1"
pause
