
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rootCategories = await prisma.category.findMany({
    where: { level: 1 },
    include: {
      children: {
        include: {
          children: true
        }
      }
    }
  });
  console.log('Root Categories (Level 1):', JSON.stringify(rootCategories, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
