import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// 确保数据库路径正确设置（处理路径含空格的情况）
function getDatabasePath(): string {
  // 如果已设置且是绝对路径，直接使用
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')) {
    return process.env.DATABASE_URL;
  }

  // 优先使用项目根目录的 dev.db（之前可能有账户和商品数据），否则用 prisma/dev.db
  const rootDb = path.join(process.cwd(), 'dev.db');
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const dbPath = fs.existsSync(rootDb) ? rootDb : prismaDb;

  // 确保目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 使用绝对路径，SQLite 接受 file: 格式（Windows 路径含空格也能正常工作）
  const absolutePath = path.resolve(dbPath);
  // 将 Windows 反斜杠转为正斜杠
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  // 使用 file: 格式（Prisma/SQLite 支持）
  const dbUrl = `file:${normalizedPath}`;
  
  return dbUrl;
}

// 设置 DATABASE_URL（必须在创建 PrismaClient 之前）
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:./')) {
  process.env.DATABASE_URL = getDatabasePath();
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 创建 PrismaClient 时确保使用正确的 DATABASE_URL
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
