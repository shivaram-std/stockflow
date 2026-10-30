import { ensureDemoAccount } from '../src/utils/demo';
import { prisma } from '../src/utils/prisma';

async function main() {
  console.log('Seeding demo organization and realistic inventory catalog...');
  const { organization, user } = await ensureDemoAccount();
  console.log(`Demo setup ready: Org "${organization.name}" (${organization.id}), User: ${user.email}`);
}

main()
  .catch((e) => {
    console.error('Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
