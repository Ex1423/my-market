# Vercel 部署 - 数据库配置说明

在 Vercel 上部署时，**SQLite 无法使用**（无持久化文件系统）。注册/登录出现「服务器错误」通常是因为数据库未正确配置。

## 快速修复步骤

### 方案一：Vercel Postgres（推荐，最简单）

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard) → 选择你的项目
2. 进入 **Storage** → **Create Database** → 选择 **Postgres**
3. 创建后，Vercel 会自动将 `POSTGRES_URL` 等环境变量添加到项目
4. 在项目 **Settings** → **Environment Variables** 中，添加或确认：
   - `DATABASE_URL` = `POSTGRES_URL` 的值（或直接复制 Postgres 连接字符串）

5. **修改 Prisma 使用 PostgreSQL**：

编辑 `prisma/schema.prisma`，将：
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
改为：
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

6. 安装驱动并推送 schema：
```bash
npm install pg
npx prisma db push
```

7. 重新部署项目（Redeploy）

---

### 方案二：Turso（SQLite 兼容）

1. 注册 [Turso](https://turso.tech)，创建数据库
2. 获取连接 URL 和 Token，格式类似：`libsql://xxx.turso.io?authToken=xxx`
3. 在 Vercel 项目 **Settings** → **Environment Variables** 添加：
   - `DATABASE_URL` = 你的 Turso 连接字符串

4. 安装驱动：
```bash
npm install @libsql/client
```

5. 修改 `prisma/schema.prisma` 的 datasource（Turso 使用 libsql，需参考 [Turso + Prisma 文档](https://docs.turso.tech/guides/prisma) 配置）

6. `npx prisma db push` 后重新部署

---

## 验证配置

部署完成后，在 Vercel 的 **Deployments** → 选择最新部署 → **Functions** → 查看日志，确认无数据库连接错误。

注册功能正常后，说明 `DATABASE_URL` 已正确配置。
