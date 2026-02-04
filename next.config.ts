import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Server Actions 请求体限制
    },
    // API 路由 / Route Handler 请求体限制（9 张 base64 图片可能较大）
    proxyClientMaxBodySize: '15mb',
  },
};

export default nextConfig;
