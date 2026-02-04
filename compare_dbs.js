const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function check(name, dbPath) {
  process.env.DATABASE_URL = `file:${dbPath}`;
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.count();
    const products = await prisma.product.count();
    const categories = await prisma.category.count();
    console.log(`${name} (${dbPath}): Users=${users}, Products=${products}, Categories=${categories}`);
  } catch (e) {
    console.log(`${name} error:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await check('Root DB', path.join(process.cwd(), 'dev.db'));
  await check('Prisma DB', path.join(process.cwd(), 'prisma', 'dev.db'));
}

main();
