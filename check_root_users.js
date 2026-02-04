const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function showUsers(dbPath) {
  process.env.DATABASE_URL = `file:${dbPath}`;
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany();
    console.log(`Users in ${dbPath}:`);
    users.forEach(u => console.log(`- ${u.username} (${u.role})`));
  } catch (e) {
    console.log(`Error:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await showUsers(path.join(process.cwd(), 'dev.db'));
}

main();
