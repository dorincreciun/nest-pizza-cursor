import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'john.doe@example.com';

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: ADMIN_EMAIL },
    data: { rol: Role.ADMIN },
  });
  if (result.count === 0) {
    console.log(`No user found with email "${ADMIN_EMAIL}". Create the account first (e.g. register), then run this script.`);
    process.exit(1);
  }
  console.log(`✅ Role set to ADMIN for ${ADMIN_EMAIL}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
