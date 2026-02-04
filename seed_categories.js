const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('parsed_categories.json', 'utf8'));
  
  console.log('Cleaning existing categories...');
  // Delete all categories to avoid duplicates
  await prisma.category.deleteMany({});
  
  console.log('Seeding categories...');
  
  for (const l1 of data) {
    console.log(`Creating L1: ${l1.name}`);
    const createdL1 = await prisma.category.create({
      data: {
        name: l1.name,
        level: 1,
      }
    });
    
    if (l1.children) {
      for (const l2 of l1.children) {
        // console.log(`  Creating L2: ${l2.name}`);
        const createdL2 = await prisma.category.create({
          data: {
            name: l2.name,
            level: 2,
            parentId: createdL1.id
          }
        });
        
        if (l2.children) {
          for (const l3 of l2.children) {
            // console.log(`    Creating L3: ${l3.name}`);
            await prisma.category.create({
              data: {
                name: l3.name,
                description: l3.description,
                keywords: l3.keywords,
                level: 3,
                parentId: createdL2.id
              }
            });
          }
        }
      }
    }
  }
  
  console.log('Seeding completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
