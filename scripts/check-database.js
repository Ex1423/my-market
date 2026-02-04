/**
 * 检查数据库文件是否存在和可访问
 */

const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const rootDb = path.join(process.cwd(), 'dev.db');
const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');

console.log('检查数据库文件...\n');
console.log('项目根目录:', process.cwd());
console.log('根目录 dev.db:', rootDb, fs.existsSync(rootDb) ? '✓ 存在' : '✗ 不存在');
console.log('prisma/dev.db:', prismaDb, fs.existsSync(prismaDb) ? '✓ 存在' : '✗ 不存在');

const dbPath = fs.existsSync(rootDb) ? rootDb : prismaDb;
console.log('\n将使用的数据库:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.log('\n⚠️  数据库文件不存在，将创建新数据库');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('已创建目录:', dbDir);
  }
} else {
  const stats = fs.statSync(dbPath);
  console.log('文件大小:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('修改时间:', stats.mtime.toLocaleString());
}

// 测试 Prisma 连接
console.log('\n测试数据库连接...');
const dbUrl = pathToFileURL(path.resolve(dbPath)).href;
console.log('DATABASE_URL:', dbUrl);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

prisma.$connect()
  .then(() => {
    console.log('✓ 数据库连接成功');
    return prisma.user.count();
  })
  .then(count => {
    console.log('用户数量:', count);
    return prisma.product.count();
  })
  .then(count => {
    console.log('商品数量:', count);
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error('✗ 数据库连接失败:', e.message);
    prisma.$disconnect();
    process.exit(1);
  });
