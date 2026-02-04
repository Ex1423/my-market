# 🔧 数据库修复指南

## 当前错误
```
The column `main.User.avatar` does not exist in the current database.
```

## ⚡ 快速修复（推荐）

### 方法 1：双击批处理文件（最简单）

**双击运行：`强制修复数据库.bat`**

这个脚本会自动：
1. ✅ 停止 Node.js 进程
2. ✅ 直接修改数据库添加缺失字段
3. ✅ 同步 Prisma schema
4. ✅ 重新生成 Prisma Client

### 方法 2：使用 npm 命令

```bash
npm run db:fix
```

### 方法 3：手动命令行修复

```bash
# 1. 切换到项目目录
cd /d "g:\kaifa\my shop\shopping"

# 2. 停止 Node.js（如果有运行）
taskkill /F /IM node.exe

# 3. 同步数据库结构
npx prisma db push --accept-data-loss

# 4. 重新生成 Prisma Client
npx prisma generate

# 5. 重新启动
npm run dev
```

## 📋 修复步骤详解

### 步骤 1：停止开发服务器

如果网站正在运行，先停止它：
- 在运行 `npm run dev` 的窗口按 `Ctrl + C`
- 或运行：`taskkill /F /IM node.exe`

### 步骤 2：修复数据库

选择以下任一方法：

**方法 A：使用 Prisma（推荐）**
```bash
npx prisma db push --accept-data-loss
```

**方法 B：使用直接修复脚本**
```bash
node scripts/fix-database-direct.js
```

**方法 C：使用 npm 脚本**
```bash
npm run db:fix-direct
```

### 步骤 3：重新生成 Prisma Client

```bash
npx prisma generate
```

或使用 npm 脚本：
```bash
npm run db:generate
```

### 步骤 4：重新启动网站

```bash
npm run dev
```

## 🔍 验证修复

修复后，尝试注册新用户。如果不再出现字段缺失错误，说明修复成功。

## ❌ 如果仍然失败

### 检查数据库文件位置

数据库文件可能在以下位置：
- `g:\kaifa\my shop\shopping\dev.db`
- `g:\kaifa\my shop\shopping\prisma\dev.db`

### 手动检查表结构

如果安装了 SQLite 命令行工具：
```bash
sqlite3 dev.db "PRAGMA table_info(User);"
```

应该看到以下字段：
- `id`
- `username`
- `password`
- `avatar` ← 这个字段必须存在
- `phone` ← 这个字段必须存在
- `notificationSound` ← 这个字段必须存在
- `role`
- `createdAt`

### 手动添加字段（最后手段）

如果所有方法都失败，可以手动使用 SQLite：

```sql
ALTER TABLE User ADD COLUMN avatar TEXT;
ALTER TABLE User ADD COLUMN phone TEXT;
ALTER TABLE User ADD COLUMN notificationSound TEXT DEFAULT 'default';
```

## 📝 注意事项

- ✅ 这些字段都是可选的，添加它们不会影响现有数据
- ✅ `notificationSound` 有默认值，现有用户会自动获得 `'default'`
- ✅ 修复过程中不会丢失数据
- ⚠️ 如果数据库中有重要数据，建议先备份

## 🆘 需要帮助？

如果以上方法都无法解决问题，请检查：
1. Node.js 和 npm 是否正确安装
2. Prisma 是否正确安装：`npx prisma --version`
3. 数据库文件是否存在且可写
4. 是否有足够的磁盘空间
