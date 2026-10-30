/**
 * Comprehensive Backend Integration & Multi-Tenancy Isolation Test Suite
 * Tests against real SQLite database, real bcrypt password hashing, and real JWT authentication.
 */

const API_BASE = 'http://localhost:5001/api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    organizationId: string;
    organization: {
      id: string;
      name: string;
      defaultLowStockThreshold: number;
    };
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ' - ' + detail : ''}`);
    process.exitCode = 1;
  }
}

async function request(endpoint: string, options: RequestInit = {}): Promise<{ status: number; data: any }> {
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

async function runTests() {
  console.log('=== Starting StockFlow Backend & Multi-Tenancy Test Suite ===\n');

  const timestamp = Date.now();
  const orgA_email = `owner_a_${timestamp}@example.com`;
  const orgB_email = `owner_b_${timestamp}@example.com`;
  const password = 'Password123!';

  // --- TEST GROUP 1: Authentication & Organization Creation ---
  console.log('Group 1: Authentication & Organization Setup');

  // 1.1 Signup Org A
  const signupA = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: orgA_email,
      password,
      organizationName: `Acme Corp ${timestamp}`,
    }),
  });
  assert(signupA.status === 201, 'Signup Org A succeeds (201)', JSON.stringify(signupA.data));
  const authA: AuthResponse = signupA.data;
  assert(!!authA.token, 'Signup Org A returns JWT token');
  assert(authA.user.organization.name.startsWith('Acme Corp'), 'Org A name is properly assigned');

  // 1.2 Signup Org B
  const signupB = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: orgB_email,
      password,
      organizationName: `Beta Retail ${timestamp}`,
    }),
  });
  assert(signupB.status === 201, 'Signup Org B succeeds (201)');
  const authB: AuthResponse = signupB.data;
  assert(authA.user.organizationId !== authB.user.organizationId, 'Org A and Org B have distinct Organization IDs');

  // 1.3 Duplicate email prevention
  const dupSignup = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: orgA_email,
      password,
      organizationName: 'Duplicate Attempt',
    }),
  });
  assert(dupSignup.status === 409, 'Duplicate signup rejected with 409 Conflict');

  // 1.4 Login Org A
  const loginA = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: orgA_email, password }),
  });
  assert(loginA.status === 200, 'Login Org A succeeds with valid credentials (200)');

  // 1.5 Login with invalid password
  const badLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: orgA_email, password: 'WrongPassword!' }),
  });
  assert(badLogin.status === 401, 'Login with incorrect password rejected (401)');

  // 1.6 Authenticated /me endpoint
  const meA = await request('/auth/me', {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(meA.status === 200 && meA.data.user.email === orgA_email, 'GET /auth/me returns authenticated tenant profile');

  // --- TEST GROUP 2: Product Management & Scoped SKU Uniqueness ---
  console.log('\nGroup 2: Product Management & SKU Scoping');

  // 2.1 Create Product in Org A
  const createProdA1 = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({
      name: 'MacBook Pro 16',
      sku: 'MBP-16',
      description: 'M3 Pro 36GB RAM',
      quantityOnHand: 10,
      costPrice: 2000,
      sellingPrice: 2499,
      lowStockThreshold: 4,
    }),
  });
  assert(createProdA1.status === 201, 'Org A creates Product 1 (MBP-16)');
  const prodA1 = createProdA1.data.product;

  // 2.2 Create Product 2 in Org A (low stock: qty 2 <= default 5)
  const createProdA2 = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({
      name: 'Magic Mouse',
      sku: 'MM-BLACK',
      quantityOnHand: 2,
      costPrice: 50,
      sellingPrice: 99,
      lowStockThreshold: null, // Should use org default threshold (5)
    }),
  });
  assert(createProdA2.status === 201, 'Org A creates Product 2 with default threshold');
  assert(createProdA2.data.product.isLowStock === true, 'Product 2 automatically flagged isLowStock=true (qty 2 <= default 5)');

  // 2.3 Duplicate SKU in SAME organization must fail
  const dupSkuOrgA = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({
      name: 'Another MacBook',
      sku: 'MBP-16', // Same SKU in Org A
      quantityOnHand: 5,
    }),
  });
  assert(dupSkuOrgA.status === 409, 'Duplicate SKU in same organization rejected with 409 Conflict');

  // 2.4 Same SKU in DIFFERENT organization MUST SUCCEED (tenant-scoped uniqueness)
  const sameSkuOrgB = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({
      name: "Org B's MacBook",
      sku: 'MBP-16', // Same SKU as Org A, but in Org B
      quantityOnHand: 7,
    }),
  });
  assert(sameSkuOrgB.status === 201, 'Same SKU in different organization allowed (tenant-scoped SKU uniqueness)');
  const prodB1 = sameSkuOrgB.data.product;

  // --- TEST GROUP 3: Strict Multi-Tenant Data Isolation ---
  console.log('\nGroup 3: Multi-Tenant Data Isolation Enforcement');

  // 3.1 Org B attempts to read Org A's product by ID
  const crossGet = await request(`/products/${prodA1.id}`, {
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(crossGet.status === 404, 'Org B cannot view Org A product (returns 404)');

  // 3.2 Org B attempts to update Org A's product
  const crossPut = await request(`/products/${prodA1.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({ name: 'Hacked Name' }),
  });
  assert(crossPut.status === 404, 'Org B cannot update Org A product (returns 404)');

  // 3.3 Org B attempts to adjust stock of Org A's product
  const crossAdjust = await request(`/products/${prodA1.id}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({ adjustment: -10 }),
  });
  assert(crossAdjust.status === 404, 'Org B cannot adjust stock of Org A product (returns 404)');

  // 3.4 Org B attempts to delete Org A's product
  const crossDelete = await request(`/products/${prodA1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(crossDelete.status === 404, 'Org B cannot delete Org A product (returns 404)');

  // 3.5 Org A's product list does not contain Org B's products
  const listA = await request('/products', {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const listB = await request('/products', {
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(listA.data.products.length === 2, "Org A's product list contains exactly its 2 products");
  assert(listB.data.products.length === 1, "Org B's product list contains exactly its 1 product");
  const crossContamination = listA.data.products.some((p: any) => p.id === prodB1.id);
  assert(!crossContamination, 'Zero cross-tenant product leakage in listing');

  // --- TEST GROUP 4: Stock Adjustments & Validation ---
  console.log('\nGroup 4: Stock Adjustments & Validations');

  // 4.1 Positive adjustment
  const adjustUp = await request(`/products/${prodA1.id}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ adjustment: 5, note: 'Received shipment' }),
  });
  assert(adjustUp.status === 200 && adjustUp.data.product.quantityOnHand === 15, 'Stock adjustment (+5) updates quantity to 15');

  // 4.2 Negative adjustment beyond available stock must fail
  const adjustNegative = await request(`/products/${prodA1.id}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ adjustment: -50 }),
  });
  assert(adjustNegative.status === 400, 'Adjustment resulting in negative stock rejected with 400');

  // --- TEST GROUP 5: Dashboard Statistics & Low-Stock Alerts ---
  console.log('\nGroup 5: Dashboard Statistics & Low Stock Alerts');

  const dashA = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(dashA.status === 200, 'GET /dashboard/stats succeeds');
  assert(dashA.data.stats.totalProducts === 2, 'Dashboard shows 2 total products');
  assert(dashA.data.stats.totalInventory === 17, 'Dashboard shows 17 total inventory units (15 + 2)');
  assert(dashA.data.stats.lowStockCount === 1, 'Dashboard shows 1 low stock item');
  assert(dashA.data.lowStockItems[0].sku === 'MM-BLACK', 'Low stock items list correctly contains MM-BLACK');

  // --- TEST GROUP 6: Settings & Dynamic Threshold Recalculation ---
  console.log('\nGroup 6: Organization Settings');

  // 6.1 Get settings
  const settingsA = await request('/settings', {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(settingsA.status === 200 && settingsA.data.settings.defaultLowStockThreshold === 5, 'Initial default threshold is 5');

  // 6.2 Update default threshold to 20 (making Product 1 also low stock!)
  const updateSettings = await request('/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ defaultLowStockThreshold: 20 }),
  });
  assert(updateSettings.status === 200 && updateSettings.data.settings.defaultLowStockThreshold === 20, 'Updated default threshold to 20');

  // 6.3 Verify Org B settings remain isolated
  const settingsB = await request('/settings', {
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(settingsB.data.settings.defaultLowStockThreshold === 5, "Org B's settings remain untouched (5)");

  // 6.4 Delete Product in Org A
  const deleteProd = await request(`/products/${prodA1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(deleteProd.status === 200, 'Product successfully deleted by owner');

  const verifyDelete = await request(`/products/${prodA1.id}`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(verifyDelete.status === 404, 'Deleted product is no longer retrievable');

  console.log(`\n=== Test Summary: ${passedTests}/${totalTests} Passed ===`);
  if (passedTests === totalTests) {
    console.log(' All backend endpoints and multi-tenancy isolation tests PASSED with 100% success!\n');
  } else {
    console.error(' Some tests FAILED.\n');
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
