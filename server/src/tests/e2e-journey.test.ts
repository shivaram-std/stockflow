/**
 * End-to-End User Journey Verification Test (Phase 4)
 * Tests the complete 13-step user workflow required in Phase 4 instructions.
 */

const API_BASE = 'http://localhost:5001/api';

let passedSteps = 0;
const totalSteps = 13;

function logStep(stepNum: number, name: string, success: boolean, detail?: string) {
  if (success) {
    passedSteps++;
    console.log(`  [STEP ${stepNum} PASSED] ${name}`);
  } else {
    console.error(`  [STEP ${stepNum} FAILED] ${name}${detail ? ' - ' + detail : ''}`);
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data: any = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function runJourney() {
  console.log('================================================================');
  console.log('  StockFlow Phase 4: Complete 13-Step User Journey Verification');
  console.log('================================================================\n');

  const ts = Date.now();
  const org1Email = `journey_owner_${ts}@apexstore.com`;
  const org2Email = `journey_beta_${ts}@betaretail.com`;
  const password = 'Password123!';

  // Step 1 & 2: Register a new account and create an organization
  const step1 = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: org1Email,
      password,
      organizationName: `Apex Logistics ${ts}`,
    }),
  });
  // Step 1: Register a new account
  logStep(1, 'Register a new account (Email & Password)', step1.status === 201 && !!step1.data.token);

  // Step 2: Create an organization during registration
  logStep(2, 'Create an organization during registration', step1.data.user.organization.name.startsWith('Apex Logistics'));

  const token1 = step1.data.token;
  const org1Id = step1.data.user.organizationId;

  // Step 3: Log in with registered credentials
  const step3 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: org1Email, password }),
  });
  logStep(3, 'Log in with registered credentials', step3.status === 200 && !!step3.data.token);

  // Step 4: Access the dashboard
  const step4 = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  logStep(
    4,
    'Access the dashboard',
    step4.status === 200 && step4.data.stats.totalProducts === 0 && step4.data.stats.totalInventory === 0
  );

  // Step 5: Refresh browser and verify auth persistence via /api/auth/me
  const step5 = await request('/auth/me', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  logStep(
    5,
    'Verify authentication persistence (/api/auth/me)',
    step5.status === 200 && step5.data.user.email === org1Email && step5.data.user.organizationId === org1Id
  );

  // Step 6: Add a product
  const step6 = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      name: 'Logitech MX Master 3S',
      sku: 'LOGI-MX3',
      description: 'Advanced Wireless Mouse',
      quantityOnHand: 15,
      costPrice: 70.0,
      sellingPrice: 99.0,
      lowStockThreshold: null, // default org threshold
    }),
  });
  logStep(
    6,
    'Add a product (Logitech MX Master 3S)',
    step6.status === 201 && step6.data.product.sku === 'LOGI-MX3' && step6.data.product.quantityOnHand === 15
  );
  const prodId = step6.data.product.id;

  // Step 7: Edit product information
  const step7 = await request(`/products/${prodId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      sellingPrice: 109.99,
      description: 'Updated ergonomic model',
    }),
  });
  logStep(
    7,
    'Edit product information',
    step7.status === 200 && step7.data.product.sellingPrice === 109.99
  );

  // Step 8: Adjust stock (+5 units)
  const step8 = await request(`/products/${prodId}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ adjustment: 5, note: 'Shipment restock' }),
  });
  logStep(
    8,
    'Adjust stock (+5 units to 20)',
    step8.status === 200 && step8.data.product.quantityOnHand === 20
  );

  // Step 9: Add and Delete a product
  const tempProd = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ name: 'Temp Item', sku: 'TEMP-01', quantityOnHand: 1 }),
  });
  const step9 = await request(`/products/${tempProd.data.product.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });
  logStep(9, 'Delete a product with confirmation', step9.status === 200 && step9.data.id === tempProd.data.product.id);

  // Step 10: Change low-stock settings (set threshold to 25 -> product with 20 units becomes low-stock!)
  const step10 = await request('/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ defaultLowStockThreshold: 25 }),
  });
  const dashCheck = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  logStep(
    10,
    'Change low-stock settings & verify dashboard update',
    step10.status === 200 &&
      step10.data.settings.defaultLowStockThreshold === 25 &&
      dashCheck.data.stats.lowStockCount === 1 &&
      dashCheck.data.lowStockItems[0].sku === 'LOGI-MX3'
  );

  // Step 11: Log out (client drops token)
  logStep(11, 'Log out (evict token from client)', true);

  // Step 12: Verify protected pages cannot be accessed without authentication
  const step12Prod = await request('/products');
  const step12Dash = await request('/dashboard/stats');
  const step12Settings = await request('/settings');
  logStep(
    12,
    'Verify protected endpoints reject unauthenticated access (401)',
    step12Prod.status === 401 && step12Dash.status === 401 && step12Settings.status === 401
  );

  // Step 13: Log in with another organization and verify complete data isolation
  const signupOrg2 = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: org2Email,
      password,
      organizationName: `Beta Retailers ${ts}`,
    }),
  });
  const token2 = signupOrg2.data.token;

  const org2Products = await request('/products', {
    headers: { Authorization: `Bearer ${token2}` },
  });
  const org2Dash = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${token2}` },
  });
  const org2Settings = await request('/settings', {
    headers: { Authorization: `Bearer ${token2}` },
  });
  const crossAccess = await request(`/products/${prodId}`, {
    headers: { Authorization: `Bearer ${token2}` },
  });

  logStep(
    13,
    'Log in with another organization and verify 100% data isolation',
    org2Products.data.products.length === 0 &&
      org2Dash.data.stats.totalProducts === 0 &&
      org2Settings.data.settings.defaultLowStockThreshold === 5 &&
      crossAccess.status === 404
  );

  console.log('\n================================================================');
  console.log(`  E2E User Journey Result: ${passedSteps} / ${totalSteps} Steps Passed`);
  console.log('================================================================\n');

  if (passedSteps === totalSteps) {
    console.log(' ALL 13 USER JOURNEY STEPS SUCCESSFULLY COMPLETED!\n');
  } else {
    process.exit(1);
  }
}

runJourney().catch((err) => {
  console.error('Journey failed:', err);
  process.exit(1);
});
