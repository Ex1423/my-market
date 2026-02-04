/**
 * 从 data/users.json 和 data/products.json 恢复用户和已发布商品到当前数据库。
 * 使用方式：在项目根目录执行 node scripts/restore-from-backup.js
 * 或 npm run restore
 */

const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// 与 lib/prisma.ts 一致：优先根目录 dev.db，否则 prisma/dev.db
function getDatabasePath() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')) {
    return process.env.DATABASE_URL;
  }
  const rootDb = path.join(process.cwd(), 'dev.db');
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const dbPath = fs.existsSync(rootDb) ? rootDb : prismaDb;
  
  // 确保目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // 使用绝对路径，SQLite 接受 file: 格式
  const absolutePath = path.resolve(dbPath);
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  return `file:${normalizedPath}`;
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:./')) {
  process.env.DATABASE_URL = getDatabasePath();
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreUsers() {
  const usersPath = path.join(process.cwd(), 'data', 'users.json');
  if (!fs.existsSync(usersPath)) {
    console.log('未找到 data/users.json，跳过用户恢复');
    return new Map();
  }
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  if (!Array.isArray(users) || users.length === 0) {
    console.log('data/users.json 为空，跳过用户恢复');
    return new Map();
  }

  const usernameToId = new Map();
  for (const u of users) {
    const username = u.username;
    if (!username) continue;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      usernameToId.set(username, existing.id);
      console.log('用户已存在，跳过:', username);
      continue;
    }
    const created = await prisma.user.create({
      data: {
        username,
        password: u.password || '',
        role: u.role || 'user',
      },
    });
    usernameToId.set(username, created.id);
    console.log('已恢复用户:', username);
  }
  return usernameToId;
}

function parsePublishDate(str) {
  if (!str) return new Date();
  if (typeof str === 'string' && /^\d{4}[\/\-]\d{1,2}[\/\-]?\d{0,2}$/.test(str)) {
    const [y, m, d] = str.replace(/-/g, '/').split('/').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function restoreProducts(defaultSellerId) {
  const productsPath = path.join(process.cwd(), 'data', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.log('未找到 data/products.json，跳过商品恢复');
    return;
  }
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  if (!Array.isArray(products) || products.length === 0) {
    console.log('data/products.json 为空，跳过商品恢复');
    return;
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const title = p.title;
    if (!title) continue;
    const sellerId = p.sellerId || defaultSellerId;
    if (!sellerId) {
      console.log('跳过商品（无卖家）:', title);
      continue;
    }
    const publishDate = parsePublishDate(p.publishDate);
    const imageData = p.imageData || null;
    const data = {
      title,
      price: String(p.price ?? ''),
      description: p.description ?? null,
      imageColor: p.imageColor ?? null,
      category: p.category ?? null,
      imageData,
      publishDate,
      condition: p.condition || '全新',
      location: p.location ?? null,
      specs: typeof p.specs === 'object' ? JSON.stringify(p.specs) : (p.specs ?? null),
      sellerId,
      images: imageData ? { create: [{ url: imageData }] } : undefined,
    };
    try {
      await prisma.product.create({ data });
      console.log('已恢复商品:', title);
    } catch (e) {
      console.error('恢复商品失败:', title, e.message);
    }
  }
}

async function main() {
  console.log('当前数据库:', process.env.DATABASE_URL);
  const usernameToId = await restoreUsers();
  const adminId = usernameToId.get('admin') || (await prisma.user.findUnique({ where: { username: 'admin' } }))?.id;
  const defaultSellerId = adminId || (await prisma.user.findFirst())?.id;
  if (!defaultSellerId) {
    console.log('未找到任何用户作为商品卖家，请先恢复用户或创建 admin 账号');
    return;
  }
  await restoreProducts(defaultSellerId);
  console.log('恢复完成。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
