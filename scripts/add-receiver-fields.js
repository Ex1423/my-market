/**
 * 添加 User 表的 receiverName 和 address 字段
 * 使用与 lib/prisma.ts 相同的数据库路径（优先根目录 dev.db）
 */

const path = require('path');
const fs = require('fs');

function getDatabasePath() {
  const rootDb = path.join(process.cwd(), 'dev.db');
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const dbPath = fs.existsSync(rootDb) ? rootDb : prismaDb;
  const absolutePath = path.resolve(dbPath);
  return absolutePath.replace(/\\/g, '/');
}

process.env.DATABASE_URL = `file:${getDatabasePath()}`;
console.log('数据库路径:', process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumns() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN receiverName TEXT`);
    console.log('✓ receiverName 已添加');
  } catch (e) {
    if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
      console.log('✓ receiverName 已存在');
    } else {
      throw e;
    }
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN address TEXT`);
    console.log('✓ address 已添加');
  } catch (e) {
    if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
      console.log('✓ address 已存在');
    } else {
      throw e;
    }
  }
}

addColumns()
  .then(() => console.log('\n完成！'))
  .catch((e) => {
    console.error('错误:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
