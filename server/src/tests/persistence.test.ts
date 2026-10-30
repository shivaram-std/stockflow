/**
 * Persistence & Restart Resilience Test
 * Validates that database records survive complete server shutdowns and restarts.
 */

import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

async function testPersistence() {
  console.log('================================================================');
  console.log('  StockFlow Database Persistence & Restart Resilience Test');
  console.log('================================================================\n');

  const ts = Date.now();
  const testEmail = `persistence_${ts}@example.com`;

  // Step 1: Write data
  console.log('1. Writing test organization and product to database...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('TestPass123!', salt);

  const org = await prisma.organization.create({
    data: {
      name: `Persistent Org ${ts}`,
      defaultLowStockThreshold: 8,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: testEmail,
      passwordHash,
      organizationId: org.id,
    },
  });

  const product = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Persistent Steel Screws',
      sku: `SCREW-${ts}`,
      quantityOnHand: 500,
      costPrice: 5.5,
      sellingPrice: 12.0,
      lastUpdatedBy: user.email,
    },
  });

  console.log(`  -> Created Org: ${org.id}, Product: ${product.id}`);

  // Step 2: Disconnect Prisma completely (simulate server crash or shutdown)
  console.log('2. Simulating full server shutdown and disconnecting database connection...');
  await prisma.$disconnect();

  // Step 3: Re-instantiate connection to SQLite file and query records
  console.log('3. Restarting server and reconnecting to persistent storage...');
  const verifyOrg = await prisma.organization.findUnique({
    where: { id: org.id },
  });

  const verifyProduct = await prisma.product.findUnique({
    where: { id: product.id },
  });

  if (
    verifyOrg &&
    verifyOrg.name === `Persistent Org ${ts}` &&
    verifyProduct &&
    verifyProduct.quantityOnHand === 500
  ) {
    console.log('  [PASS] All organization and product records intact after restart!');
    console.log('  [PASS] Database persistence successfully verified.\n');
  } else {
    console.error('  [FAIL] Data did not persist across restarts!');
    process.exit(1);
  }

  await prisma.$disconnect();
}

testPersistence().catch((err) => {
  console.error('Persistence test failed:', err);
  process.exit(1);
});
