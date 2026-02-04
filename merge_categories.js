const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find all categories named "宠物用品"
  const duplicates = await prisma.category.findMany({
    where: { name: '宠物用品', level: 1 },
    include: { children: true }
  });

  console.log(`Found ${duplicates.length} categories named "宠物用品"`);

  if (duplicates.length <= 1) {
    console.log('No duplicates found or only one exists.');
    return;
  }

  // 2. Identify the one to keep (the first one)
  const keeper = duplicates[0];
  const others = duplicates.slice(1);

  console.log(`Keeping category ID: ${keeper.id} (${keeper.children.length} children)`);

  // 3. Move children from others to keeper
  for (const other of others) {
    console.log(`Processing duplicate ID: ${other.id} (${other.children.length} children)`);
    
    if (other.children.length > 0) {
      // Update parentId of all children
      const updateResult = await prisma.category.updateMany({
        where: { parentId: other.id },
        data: { parentId: keeper.id }
      });
      console.log(`Moved ${updateResult.count} children from ${other.id} to ${keeper.id}`);
    }

    // 4. Delete the duplicate category
    await prisma.category.delete({
      where: { id: other.id }
    });
    console.log(`Deleted duplicate category ${other.id}`);
  }

  console.log('Merge completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
