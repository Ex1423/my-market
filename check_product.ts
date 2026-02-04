
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = 'cmku3xods002ridaz6luh6d1v';
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, title: true }
  });
  console.log('Product:', product);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
