# 网站部署指南

本项目是一个 Next.js 16 电商应用，使用 Prisma + SQLite。以下是几种部署方案。

---

## 方案一：Vercel + Turso（推荐，免费额度充足）

**优点**：部署简单、自动 HTTPS、全球 CDN、免费额度大  
**注意**：需将 SQLite 迁移到 Turso（兼容 SQLite 的云端数据库）

### 步骤

#### 1. 注册并安装

- 注册 [Vercel](https://vercel.com) 和 [Turso](https://turso.tech)
- 安装 Vercel CLI：`npm i -g vercel`
- 安装 Turso CLI：`brew install tursodatabase/tap/turso`（或从 [官网](https://docs.turso.tech/cli) 下载）

#### 2. 创建 Turso 数据库

```bash
# 登录 Turso
turso auth login

# 创建数据库
turso db create shopping-db --region nrt  # nrt=东京，可选其他区域

# 获取连接 URL 和 token
turso db show shopping-db --url
turso db tokens create shopping-db
```

#### 3. 修改 Prisma 支持 Turso

```bash
npm install @libsql/client
```

在 `prisma/schema.prisma` 中，将 `provider = "sqlite"` 改为使用 libsql（Turso 兼容）。

**注意**：Turso 使用 libsql 驱动，需要安装 `@prisma/adapter-libsql`。或使用 Turso 的 `libsql://` URL 格式。

更简单的方式：Turso 提供 SQLite 兼容接口，使用 `libsql://` 作为 DATABASE_URL。

#### 4. 迁移数据

```bash
# 导出本地 SQLite 数据（如需要）
# 使用 prisma db pull 或手动导出

# 推送 schema 到 Turso
DATABASE_URL="libsql://shopping-db-xxx.turso.io?authToken=xxx" npx prisma db push
```

#### 5. 部署到 Vercel

```bash
# 在项目根目录
vercel

# 在 Vercel 控制台添加环境变量：
# DATABASE_URL = libsql://xxx.turso.io?authToken=xxx
```

---

## 方案二：Railway（适合保留 SQLite）

**优点**：支持持久化存储，可继续使用 SQLite，部署简单  
**费用**：约 $5/月 起（有免费试用）

### 步骤

1. 注册 [Railway](https://railway.app)
2. 新建项目 → 选择 "Deploy from GitHub"
3. 连接你的 GitHub 仓库
4. 添加环境变量：
   - `DATABASE_URL`：Railway 提供 PostgreSQL，或使用 Volume 挂载 SQLite 文件
5. Railway 会自动检测 Next.js 并构建

**SQLite 说明**：Railway 支持 Volume，可将 SQLite 文件存到 Volume。但更推荐在 Railway 上使用 PostgreSQL（免费），需修改 Prisma schema。

---

## 方案三：Render

**优点**：有免费档位，支持 Web Service  
**注意**：免费实例会休眠，冷启动较慢

### 步骤

1. 注册 [Render](https://render.com)
2. New → Web Service，连接 GitHub 仓库
3. 配置：
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma db push && npm start`
4. 添加 PostgreSQL 数据库（Render 免费提供）
5. 修改 `prisma/schema.prisma`：`provider = "postgresql"`
6. 设置 `DATABASE_URL` 环境变量

---

## 方案四：自建 VPS（云服务器）

**优点**：完全可控，可继续用 SQLite，适合长期运营  
**常见**：腾讯云、阿里云、DigitalOcean、Vultr

### 步骤概要

1. 购买一台 Linux 服务器（推荐 1核2G 起）
2. 安装 Node.js、PM2、Nginx
3. 克隆代码，`npm install && npm run build`
4. 用 PM2 运行：`pm2 start npm --name "shopping" -- start`
5. 配置 Nginx 反向代理到 3000 端口
6. 配置 SSL（Let's Encrypt）

---

## 部署前检查清单

- [ ] 确保 `npm run build` 本地能成功
- [ ] 创建 `.env.example` 列出所需环境变量（勿提交 `.env`）
- [ ] 修改默认管理员密码（当前为 admin/admin123）
- [ ] 检查 `next.config.ts` 中的 `bodySizeLimit` 是否满足需求

---

## 从 SQLite 迁移到 PostgreSQL（如选 Vercel/Render）

1. 修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. 安装 PostgreSQL 驱动：`npm install pg`

3. 迁移数据：使用 `prisma db push` 或创建 migration

4. 如有现有数据，可用工具导出 SQLite 再导入 PostgreSQL

---

## 推荐选择

| 需求           | 推荐方案        |
|----------------|-----------------|
| 快速上线、免费 | Vercel + Turso  |
| 保留 SQLite    | Railway 或 VPS  |
| 完全掌控       | VPS             |
| 学习/演示      | Render 免费档   |

如需我帮你具体实现某一方案的配置（如改 schema、写部署脚本），请告诉我选哪个方案。
