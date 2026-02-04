# 购物网站 - PowerShell 启动脚本
# 用法: .\启动.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Set-Location $ProjectRoot
$Host.UI.RawWindow.Title = "购物网站 - 开发服务器"

Write-Host ""
Write-Host " ========================================" -ForegroundColor Cyan
Write-Host "   购物网站 - 开发服务器" -ForegroundColor Cyan
Write-Host " ========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host " [错误] 未找到 npm，请先安装 Node.js" -ForegroundColor Red
    Write-Host " 下载地址: https://nodejs.org" -ForegroundColor Yellow
    Read-Host " 按回车键退出"
    exit 1
}

# 检查项目
if (-not (Test-Path "package.json")) {
    Write-Host " [错误] 未找到 package.json" -ForegroundColor Red
    Read-Host " 按回车键退出"
    exit 1
}

# 安装依赖
if (-not (Test-Path "node_modules")) {
    Write-Host " [1/2] 安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host " [错误] 依赖安装失败" -ForegroundColor Red
        Read-Host " 按回车键退出"
        exit 1
    }
    Write-Host " [完成] 依赖已安装" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host " [跳过] 依赖已存在" -ForegroundColor Gray
    Write-Host ""
}

# 启动
Write-Host " [启动] Next.js 开发服务器" -ForegroundColor Green
Write-Host ""
Write-Host " ----------------------------------------" -ForegroundColor Gray
Write-Host "  访问地址: http://localhost:3000" -ForegroundColor White
Write-Host "  停止服务: Ctrl + C" -ForegroundColor Gray
Write-Host " ----------------------------------------" -ForegroundColor Gray
Write-Host ""

npm run dev

Write-Host ""
Write-Host " ----------------------------------------" -ForegroundColor Gray
Write-Host "  服务器已停止" -ForegroundColor Yellow
Write-Host " ----------------------------------------" -ForegroundColor Gray
Read-Host " 按回车键退出"
