# Supabase 认证配置说明

## 若出现 `"requested path is invalid"` 错误

### 1. 尝试使用 Legacy Anon Key

新版 `sb_publishable_xxx` 可能与部分客户端不兼容，可改用 Legacy anon key：

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目
2. **Settings** → **API** → **Legacy API Keys**
3. 复制 **anon (public)** 的值
4. 在 `.env.local` 中设置：
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   （替换为你的 anon key）

### 2. 配置 URL

1. **Authentication** → **URL Configuration**
2. **Site URL**：本地开发填 `http://localhost:3000`，线上填 `https://你的域名.vercel.app`
3. **Redirect URLs** 添加：
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`
   - `https://你的域名.vercel.app/**`
   - `https://你的域名.vercel.app/auth/callback`

### 3. 关闭邮箱确认（可选，便于本地测试）

1. **Authentication** → **Providers** → **Email**
2. 关闭 **Confirm email**

---

## 头像上传 Storage 配置

头像上传使用 Supabase Storage，需先创建公开存储桶：

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目
2. **Storage** → **New bucket**
3. 名称：`avatars`
4. 勾选 **Public bucket**（允许通过 getPublicUrl 公开访问）
5. 创建后，在 **Policies** 中确保已登录用户可上传：
   - 新建 Policy：`Allow authenticated users to upload`
   - 或使用默认的 `Allow public read, authenticated upload`

完成上述配置后重启开发服务器：`npm run dev`
