const { PrismaClient } = require('@prisma/client');

// Explicitly point to root dev.db
// Note: path must be absolute or correct relative to where this script runs?
// Prisma Client usually takes connection string in constructor or env.
const dbUrl = 'file:./dev.db'; // Relative to CWD (root) if we pass it directly? 
// Actually, let's use absolute path to be safe.
const path = require('path');
const absolutePath = path.join(process.cwd(), 'dev.db');
const connectionString = `file:${absolutePath.replace(/\\/g, '/')}`;

console.log('Checking DB at:', connectionString);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  try {
    // Try to query raw SQL to get table info
    const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
    console.log('User table columns:', result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();