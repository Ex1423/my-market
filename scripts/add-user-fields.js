/**
 * 手动添加 User 表缺失的字段
 * 用于修复数据库 schema 不同步的问题
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// 获取数据库路径
function getDatabasePath() {
  const rootDb = path.join(process.cwd(), 'dev.db');
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  return fs.existsSync(rootDb) ? rootDb : prismaDb;
}

async function addUserFields() {
  const dbPath = getDatabasePath();
  console.log('数据库路径:', dbPath);
  
  if (!fs.existsSync(dbPath)) {
    console.error('错误: 数据库文件不存在:', dbPath);
    console.log('请先运行: npx prisma db push');
    process.exit(1);
  }

  // 使用默认配置，让 Prisma 自动处理路径
  const prisma = new PrismaClient();

  try {
    console.log('正在连接数据库...');
    await prisma.$connect();

    // 使用 Prisma 的 $executeRaw 来添加字段
    // SQLite 支持 ALTER TABLE ADD COLUMN（如果列不存在）
    console.log('正在添加 avatar 字段...');
    try {
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN avatar TEXT`;
      console.log('✓ avatar 字段已添加');
    } catch (e) {
      if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
        console.log('✓ avatar 字段已存在，跳过');
      } else {
        throw e;
      }
    }

    console.log('正在添加 phone 字段...');
    try {
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN phone TEXT`;
      console.log('✓ phone 字段已添加');
    } catch (e) {
      if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
        console.log('✓ phone 字段已存在，跳过');
      } else {
        throw e;
      }
    }

    console.log('正在添加 notificationSound 字段...');
    try {
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN notificationSound TEXT DEFAULT 'default'`;
      console.log('✓ notificationSound 字段已添加');
    } catch (e) {
      if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
        console.log('✓ notificationSound 字段已存在，跳过');
      } else {
        throw e;
      }
    }

    console.log('\n========== 完成！ ==========');
    console.log('所有字段已添加，现在可以运行: npx prisma generate');
    
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addUserFields();
