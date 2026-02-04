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
2. **Site URL**：本地开发填 `http://localhost:3000`
3. **Redirect URLs** 添加：
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`

### 3. 关闭邮箱确认（可选，便于本地测试）

1. **Authentication** → **Providers** → **Email**
2. 关闭 **Confirm email**

---

完成上述配置后重启开发服务器：`npm run dev`
