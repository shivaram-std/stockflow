/**
 * StockFlow Phase 3: Comprehensive Security, Multi-Tenancy & Integration Test Suite
 * Validates:
 * 1. Authentication & JWT Security (expiration, tampering, missing auth)
 * 2. Protection against password hash leaks
 * 3. Protected endpoint access control
 * 4. Cross-tenant data isolation & URL/body parameter injection prevention
 * 5. Tenant-scoped SKU uniqueness
 * 6. Input validation & negative values protection (Zod)
 * 7. Dashboard metrics & low-stock calculations
 * 8. Organization settings isolation
 */

import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../index';

const API_BASE = 'http://localhost:5001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'stockflow-dev-secret-key-12345';

let activeServer: http.Server | null = null;

async function startServerIfNeeded(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return;
  } catch {
    // Server not running, will start
  }

  await new Promise<void>((resolve, reject) => {
    const s = app.listen(5001, () => {
      activeServer = s;
      console.log('  [TEST] Express API server listening on http://localhost:5001');
      resolve();
    });
    s.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

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

async function runTestSuite() {
  await startServerIfNeeded();

  console.log('================================================================');
  console.log('  StockFlow Backend & Security Verification Test Suite');
  console.log('================================================================\n');

  const ts = Date.now();
  const orgAEmail = `admin_a_${ts}@teststore.com`;
  const orgBEmail = `admin_b_${ts}@teststore.com`;
  const password = 'SecurePassword123!';

  // ============================================================================
  // SECTION 1: AUTHENTICATION, PASSWORD HASHING & JWT EXPIRATION
  // ============================================================================
  console.log('--- Section 1: Authentication & JWT Security ---');

  // 1.1 Signup Org A
  const signupA = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: orgAEmail,
      password,
      organizationName: `Alpha Store ${ts}`,
    }),
  });
  assert(signupA.status === 201, 'Signup Org A succeeds (201)');
  const authA: AuthResponse = signupA.data;
  assert(!!authA.token, 'Signup Org A returns JWT token');

  // 1.2 Verify password hashes are NEVER exposed in signup response
  const signupStrA = JSON.stringify(signupA.data);
  assert(
    !signupStrA.includes('passwordHash') && !signupStrA.includes('$2a$') && !signupStrA.includes('$2b$'),
    'Password hash is NOT exposed in signup response'
  );

  // 1.3 Signup Org B
  const signupB = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: orgBEmail,
      password,
      organizationName: `Beta Store ${ts}`,
    }),
  });
  assert(signupB.status === 201, 'Signup Org B succeeds (201)');
  const authB: AuthResponse = signupB.data;
  assert(authA.user.organizationId !== authB.user.organizationId, 'Distinct Organization IDs created');

  // 1.4 Login Org A
  const loginA = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: orgAEmail, password }),
  });
  assert(loginA.status === 200, 'Login Org A succeeds (200)');
  assert(!!loginA.data.token, 'Login Org A returns JWT token');

  // 1.5 Verify password hashes are NEVER exposed in login response
  const loginStrA = JSON.stringify(loginA.data);
  assert(
    !loginStrA.includes('passwordHash') && !loginStrA.includes('$2a$') && !loginStrA.includes('$2b$'),
    'Password hash is NOT exposed in login response'
  );

  // 1.6 Verify password hashes are NEVER exposed in /api/auth/me response
  const meA = await request('/auth/me', {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(meA.status === 200, 'GET /api/auth/me succeeds (200)');
  const meStrA = JSON.stringify(meA.data);
  assert(
    !meStrA.includes('passwordHash') && !meStrA.includes('$2a$') && !meStrA.includes('$2b$'),
    'Password hash is NOT exposed in /auth/me response'
  );

  // 1.7 Expired JWT Token Rejection
  const expiredToken = jwt.sign(
    { userId: authA.user.id, email: authA.user.email, organizationId: authA.user.organizationId, organizationName: 'Alpha' },
    JWT_SECRET,
    { expiresIn: '-5s' }
  );
  const expiredRes = await request('/products', {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert(expiredRes.status === 401, 'Expired JWT token rejected with 401 Unauthorized');

  // 1.8 Tampered JWT Token Rejection
  const tamperedToken = authA.token.substring(0, authA.token.length - 8) + 'ABCDEFGH';
  const tamperedRes = await request('/products', {
    headers: { Authorization: `Bearer ${tamperedToken}` },
  });
  assert(tamperedRes.status === 401, 'Tampered JWT token rejected with 401 Unauthorized');

  // 1.9 Malformed Token (Missing Bearer prefix)
  const malformedRes = await request('/products', {
    headers: { Authorization: authA.token },
  });
  assert(malformedRes.status === 401, 'Token without Bearer prefix rejected with 401');

  // ============================================================================
  // SECTION 2: ACCESS CONTROL & UNAUTHORIZED REQUESTS
  // ============================================================================
  console.log('\n--- Section 2: Access Control for Protected APIs ---');

  const unauthProducts = await request('/products');
  assert(unauthProducts.status === 401, 'GET /products without token rejected (401)');

  const unauthCreate = await request('/products', {
    method: 'POST',
    body: JSON.stringify({ name: 'Sneaky', sku: 'SNK-01', quantityOnHand: 5 }),
  });
  assert(unauthCreate.status === 401, 'POST /products without token rejected (401)');

  const unauthStats = await request('/dashboard/stats');
  assert(unauthStats.status === 401, 'GET /dashboard/stats without token rejected (401)');

  const unauthSettings = await request('/settings');
  assert(unauthSettings.status === 401, 'GET /settings without token rejected (401)');

  const unauthPutSettings = await request('/settings', {
    method: 'PUT',
    body: JSON.stringify({ defaultLowStockThreshold: 10 }),
  });
  assert(unauthPutSettings.status === 401, 'PUT /settings without token rejected (401)');

  // ============================================================================
  // SECTION 3: PRODUCT MANAGEMENT, SKU UNIQUENESS & TENANT ISOLATION
  // ============================================================================
  console.log('\n--- Section 3: Product Management & Multi-Tenant Isolation ---');

  // 3.1 Create Product A1 (In stock)
  const prodA1Res = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({
      name: 'Sony WH-1000XM5',
      sku: 'SONY-XM5',
      description: 'Noise Cancelling Headphones',
      quantityOnHand: 25,
      costPrice: 280.0,
      sellingPrice: 399.99,
      lowStockThreshold: 8,
    }),
  });
  assert(prodA1Res.status === 201, 'Org A creates Product A1 (SONY-XM5)');
  const prodA1 = prodA1Res.data.product;

  // 3.2 Create Product A2 (Low stock using org default 5)
  const prodA2Res = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({
      name: 'USB-C Cable 2M',
      sku: 'CABLE-USBC',
      quantityOnHand: 3, // 3 <= default 5 -> low stock!
      sellingPrice: 19.99,
      lowStockThreshold: null,
    }),
  });
  assert(prodA2Res.status === 201, 'Org A creates Product A2 (CABLE-USBC)');
  const prodA2 = prodA2Res.data.product;
  assert(prodA2Res.data.product.isLowStock === true, 'Product A2 correctly marked isLowStock=true (3 <= 5)');

  // 3.3 Create Product B1 in Org B with IDENTICAL SKU ('SONY-XM5')
  const prodB1Res = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({
      name: "Beta's Sony Headphones",
      sku: 'SONY-XM5', // Exact same SKU, different tenant
      quantityOnHand: 12,
      sellingPrice: 389.99,
    }),
  });
  assert(prodB1Res.status === 201, 'Same SKU allowed in Org B (tenant-scoped SKU uniqueness)');
  const prodB1 = prodB1Res.data.product;

  // 3.4 Duplicate SKU in SAME Org A must be rejected
  const dupSkuRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({
      name: 'Duplicate SKU Attempt',
      sku: 'SONY-XM5', // Duplicate in Org A
      quantityOnHand: 1,
    }),
  });
  assert(dupSkuRes.status === 409, 'Duplicate SKU in same org rejected with 409 Conflict');

  // ============================================================================
  // SECTION 4: ANTI-TAMPERING & PARAMETER INJECTION PREVENTION
  // ============================================================================
  console.log('\n--- Section 4: Anti-Tampering & OrganizationId Injection ---');

  // 4.1 Request Body Injection: Org B sends organizationId of Org A during product creation
  const injectedCreateRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({
      name: 'Injected Org Product',
      sku: 'INJECT-01',
      quantityOnHand: 5,
      organizationId: authA.user.organizationId, // Attempted spoof of Org A
    }),
  });
  assert(injectedCreateRes.status === 201, 'Product created successfully');
  assert(
    injectedCreateRes.data.product.organizationId === authB.user.organizationId,
    'Client-supplied organizationId ignored; assigned to authenticated Org B'
  );

  // 4.2 Cross-Tenant Read: Org B attempts to get Org A's product by ID
  const crossGet = await request(`/products/${prodA1.id}`, {
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(crossGet.status === 404, 'Org B cannot view Org A product by ID (returns 404)');

  // 4.3 Cross-Tenant Update: Org B attempts to update Org A's product
  const crossPut = await request(`/products/${prodA1.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({ name: 'Tampered Product Name' }),
  });
  assert(crossPut.status === 404, 'Org B cannot update Org A product (returns 404)');

  // 4.4 Cross-Tenant Stock Adjust: Org B attempts to adjust Org A's stock
  const crossAdjust = await request(`/products/${prodA1.id}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authB.token}` },
    body: JSON.stringify({ adjustment: -10 }),
  });
  assert(crossAdjust.status === 404, 'Org B cannot adjust stock of Org A product (returns 404)');

  // 4.5 Cross-Tenant Delete: Org B attempts to delete Org A's product
  const crossDelete = await request(`/products/${prodA1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(crossDelete.status === 404, 'Org B cannot delete Org A product (returns 404)');

  // 4.6 Verify Org A's product was not altered or deleted
  const verifyProdA1 = await request(`/products/${prodA1.id}`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(
    verifyProdA1.status === 200 && verifyProdA1.data.product.name === 'Sony WH-1000XM5',
    "Org A product remains untouched after Org B's unauthorized attempts"
  );

  // ============================================================================
  // SECTION 5: INPUT VALIDATION & BOUNDARY CONDITIONS (Zod)
  // ============================================================================
  console.log('\n--- Section 5: Input Validation & Boundary Checks ---');

  // 5.1 Invalid email format on signup
  const badEmailRes = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email', password: 'Password123!', organizationName: 'Bad Email Org' }),
  });
  assert(badEmailRes.status === 400, 'Invalid email rejected (400)');

  // 5.2 Short password on signup
  const shortPassRes = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: 'valid@example.com', password: '123', organizationName: 'Short Pass Org' }),
  });
  assert(shortPassRes.status === 400, 'Password < 6 characters rejected (400)');

  // 5.3 Empty product name
  const emptyNameRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ name: '   ', sku: 'EMPTY-NAME', quantityOnHand: 5 }),
  });
  assert(emptyNameRes.status === 400, 'Empty product name rejected (400)');

  // 5.4 Negative quantity on hand
  const negQtyRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ name: 'Negative Qty', sku: 'NEG-QTY', quantityOnHand: -5 }),
  });
  assert(negQtyRes.status === 400, 'Negative quantityOnHand rejected (400)');

  // 5.5 Negative prices
  const negPriceRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ name: 'Negative Price', sku: 'NEG-PRICE', quantityOnHand: 5, costPrice: -10 }),
  });
  assert(negPriceRes.status === 400, 'Negative costPrice rejected (400)');

  // 5.6 Stock adjustment dropping below zero
  const negStockAdjust = await request(`/products/${prodA1.id}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ adjustment: -100 }), // Current stock is 25
  });
  assert(negStockAdjust.status === 400, 'Stock adjustment reducing stock below 0 rejected (400)');

  // 5.7 Valid stock adjustment (+10)
  const validStockAdjust = await request(`/products/${prodA1.id}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ adjustment: 10, note: 'Restock' }),
  });
  assert(
    validStockAdjust.status === 200 && validStockAdjust.data.product.quantityOnHand === 35,
    'Stock successfully increased to 35'
  );

  // ============================================================================
  // SECTION 6: DASHBOARD AGGREGATIONS & LOW STOCK ACCURACY
  // ============================================================================
  console.log('\n--- Section 6: Dashboard Statistics & Low-Stock Calculations ---');

  const dashA = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(dashA.status === 200, 'GET /dashboard/stats succeeds (200)');
  assert(dashA.data.stats.totalProducts === 2, 'Total products count equals 2');
  assert(dashA.data.stats.totalInventory === 38, 'Total inventory equals 38 (35 + 3)');
  assert(dashA.data.stats.lowStockCount === 1, 'Low stock count equals 1');
  assert(dashA.data.lowStockItems[0].sku === 'CABLE-USBC', 'Low stock items list contains CABLE-USBC');

  // Verify Org B has independent stats
  const dashB = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(dashB.data.stats.totalProducts === 2, 'Org B has 2 products (SONY-XM5 and INJECT-01)');
  assert(dashB.data.stats.totalInventory === 17, 'Org B total inventory is 17 (12 + 5)');

  // ============================================================================
  // SECTION 7: ORGANIZATION SETTINGS ISOLATION & DYNAMIC RECALCULATION
  // ============================================================================
  console.log('\n--- Section 7: Organization Settings Isolation ---');

  // 7.1 Org A updates threshold from 5 to 40
  const updateSettingsA = await request('/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ defaultLowStockThreshold: 40 }),
  });
  assert(updateSettingsA.status === 200, 'Org A updates default threshold to 40');
  assert(updateSettingsA.data.settings.defaultLowStockThreshold === 40, 'Default threshold saved as 40');

  // 7.2 Verify Org B settings remained unchanged
  const settingsB = await request('/settings', {
    headers: { Authorization: `Bearer ${authB.token}` },
  });
  assert(settingsB.data.settings.defaultLowStockThreshold === 5, 'Org B default threshold remains unchanged at 5');

  // 7.3 Negative default threshold rejection
  const badSettings = await request('/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authA.token}` },
    body: JSON.stringify({ defaultLowStockThreshold: -5 }),
  });
  assert(badSettings.status === 400, 'Negative defaultLowStockThreshold rejected (400)');

  // 7.4 Delete product in Org A
  const deleteA = await request(`/products/${prodA2.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(deleteA.status === 200, 'Product deleted successfully by owner');

  const verifyDeleteA = await request(`/products/${prodA2.id}`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  assert(verifyDeleteA.status === 404, 'Deleted product returns 404');

  // ============================================================================
  // SECTION 8: DEMO ACCOUNT, SEEDING ISOLATION & EMPTY NEW TENANT STATE
  // ============================================================================
  console.log('\n--- Section 8: Demo Account & New Tenant Isolation ---');

  // 8.1 Demo Login endpoint
  const demoLoginRes = await request('/auth/demo', { method: 'POST' });
  assert(demoLoginRes.status === 200, 'POST /auth/demo succeeds (200)');
  const demoAuth = demoLoginRes.data;
  assert(demoAuth.user.email === 'demo@stockflow.com', 'Demo user email is demo@stockflow.com');
  assert(demoAuth.user.organization.name === 'StockFlow Demo Retail', 'Demo organization is StockFlow Demo Retail');

  // 8.2 Demo products exist with realistic catalog and low stock alerts
  const demoProductsRes = await request('/products', {
    headers: { Authorization: `Bearer ${demoAuth.token}` },
  });
  assert(demoProductsRes.status === 200, 'GET /products for demo account succeeds');
  assert(demoProductsRes.data.products.length >= 5, 'Demo organization has >= 5 realistic products');
  const demoLowStockItems = demoProductsRes.data.products.filter((p: any) => p.isLowStock);
  assert(demoLowStockItems.length > 0, 'Demo organization includes low-stock products');

  // 8.3 Demo dashboard statistics
  const demoDashRes = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${demoAuth.token}` },
  });
  assert(demoDashRes.status === 200, 'GET /dashboard/stats for demo account succeeds');
  assert(demoDashRes.data.stats.totalProducts >= 5, 'Demo dashboard totalProducts reflects DB count');
  assert(demoDashRes.data.stats.lowStockCount > 0, 'Demo dashboard has active lowStockCount');

  // 8.4 Normal login with demo credentials
  const demoNormalLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'demo@stockflow.com', password: 'DemoUser123!' }),
  });
  assert(demoNormalLogin.status === 200, 'Standard login works with demo credentials');

  // 8.5 Fresh normal signup has 0 products
  const freshOrgEmail = `fresh_tenant_${ts}@example.com`;
  const freshSignup = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: freshOrgEmail,
      password: 'SecurePassword123!',
      organizationName: `Fresh Org ${ts}`,
    }),
  });
  assert(freshSignup.status === 201, 'Fresh normal tenant signup succeeds');
  const freshAuth = freshSignup.data;

  const freshProducts = await request('/products', {
    headers: { Authorization: `Bearer ${freshAuth.token}` },
  });
  assert(freshProducts.data.products.length === 0, 'Fresh normal organization starts with 0 products (empty catalog)');

  const freshDash = await request('/dashboard/stats', {
    headers: { Authorization: `Bearer ${freshAuth.token}` },
  });
  assert(
    freshDash.data.stats.totalProducts === 0 && freshDash.data.stats.totalInventory === 0,
    'Fresh normal organization dashboard has 0 products and 0 inventory units'
  );

  // 8.6 Demo products are isolated from new normal organization
  const demoProdId = demoProductsRes.data.products[0].id;
  const crossDemoAccess = await request(`/products/${demoProdId}`, {
    headers: { Authorization: `Bearer ${freshAuth.token}` },
  });
  assert(crossDemoAccess.status === 404, 'Normal user cannot access demo products (404)');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`  Test Run Complete: ${passedTests} / ${totalTests} Passed`);
  console.log('================================================================\n');

  if (activeServer) {
    await new Promise<void>((resolve) => activeServer!.close(() => resolve()));
  }

  if (passedTests === totalTests) {
    console.log(' ALL SECURITY & INTEGRATION CHECKS PASSED!\n');
    process.exit(0);
  } else {
    console.error(' SOME TESTS FAILED.\n');
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
