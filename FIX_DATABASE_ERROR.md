# 修复数据库错误：User 表缺少字段

## 错误信息
```
The column `main.User.avatar` does not exist in the current database.
```

## 问题原因
Prisma schema 中定义了 `avatar`、`phone` 和 `notificationSound` 字段，但数据库表中还没有这些列。

## 解决方案

### 方法 1：使用修复脚本（推荐）

运行以下命令：

```bash
npm run db:fix-user-fields
```

或者直接运行：

```bash
node scripts/add-user-fields.js
```

然后重新生成 Prisma Client：

```bash
npm run db:generate
```

### 方法 2：使用 Prisma db push

运行以下命令同步数据库结构：

```bash
npx prisma db push --accept-data-loss
```

然后重新生成 Prisma Client：

```bash
npx prisma generate
```

### 方法 3：使用批处理文件（Windows）

双击运行 `修复数据库.bat` 文件，它会自动：
1. 停止 Node.js 进程
2. 同步数据库结构
3. 重新生成 Prisma Client

## 验证修复

修复后，重启开发服务器：

```bash
npm run dev
```

如果不再出现字段缺失的错误，说明修复成功。

## 注意事项

- 这些字段都是可选的（`String?`），所以添加它们不会影响现有数据
- `notificationSound` 字段有默认值 `'default'`，现有用户会自动获得这个值
- 如果数据库中有重要数据，建议先备份

## 如果仍然有问题

1. 检查数据库文件位置：
   - 项目根目录的 `dev.db`
   - 或 `prisma/dev.db`

2. 手动检查 User 表结构：
   ```sql
   PRAGMA table_info(User);
   ```

3. 如果字段已存在但仍有错误，尝试：
   ```bash
   npx prisma generate --force
   ```
