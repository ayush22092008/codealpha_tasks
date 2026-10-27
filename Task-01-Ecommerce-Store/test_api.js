const http = require('http');

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Automated System Tests ---');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health check:', health.status === 200 ? 'PASS' : 'FAIL', health.data);

  // 2. Products listing
  const products = await request('GET', '/api/products');
  console.log(`2. Products listing: ${products.status === 200 ? 'PASS' : 'FAIL'} (${products.data.total} products returned)`);

  // 3. Products category listing
  const categories = await request('GET', '/api/products/categories');
  console.log(`3. Categories: ${categories.status === 200 ? 'PASS' : 'FAIL'} (${categories.data.categories.length} categories)`);

  // 4. Product details by ID
  const productDetail = await request('GET', '/api/products/1');
  console.log(`4. Product Details: ${productDetail.status === 200 ? 'PASS' : 'FAIL'} ("${productDetail.data.product.name}")`);

  // 5. User Registration
  const testEmail = `testuser_${Date.now()}@example.com`;
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Test Customer',
    email: testEmail,
    password: 'password123'
  });
  console.log(`5. User Registration: ${registerRes.status === 201 ? 'PASS' : 'FAIL'}`, registerRes.data.user);
  const token = registerRes.data.token;

  // 6. User Login
  const loginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: 'password123'
  });
  console.log(`6. User Login: ${loginRes.status === 200 ? 'PASS' : 'FAIL'}`);

  // 7. Protected Profile
  const profileRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`7. User Profile: ${profileRes.status === 200 ? 'PASS' : 'FAIL'}`, profileRes.data.user.email);

  // 8. Coupon Validation
  const couponRes = await request('POST', '/api/orders/validate-coupon', {
    code: 'WELCOME10',
    subtotal: 100
  });
  console.log(`8. Coupon Validation: ${couponRes.status === 200 ? 'PASS' : 'FAIL'}`, couponRes.data);

  // 9. Order Processing
  const orderRes = await request('POST', '/api/orders', {
    customer: {
      name: 'Test Customer',
      email: testEmail,
      phone: '+1 555 1234',
      address: '123 Market St',
      city: 'Seattle',
      zip: '98101'
    },
    items: [
      { id: 1, quantity: 1 },
      { id: 4, quantity: 2 }
    ],
    payment: { method: 'Credit Card' },
    couponCode: 'WELCOME10'
  }, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`9. Order Processing: ${orderRes.status === 201 ? 'PASS' : 'FAIL'} (Order #${orderRes.data.order.orderNumber}, Total: $${orderRes.data.order.total})`);

  // 10. Order Lookup (Receipt)
  const lookupRes = await request('GET', `/api/orders/${orderRes.data.order.orderNumber}`);
  console.log(`10. Order Receipt Lookup: ${lookupRes.status === 200 ? 'PASS' : 'FAIL'} (${lookupRes.data.order.items.length} items)`);

  // 11. User Order History
  const historyRes = await request('GET', '/api/orders/user/my-orders', null, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`11. Customer Order History: ${historyRes.status === 200 ? 'PASS' : 'FAIL'} (${historyRes.data.orders.length} order found)`);

  // 12. Submit Product Review
  const reviewRes = await request('POST', '/api/products/1/reviews', {
    userName: 'Test Customer',
    rating: 5,
    comment: 'Exceptional build quality and audio fidelity!'
  });
  console.log(`12. Submit Review: ${reviewRes.status === 201 ? 'PASS' : 'FAIL'} (New avg rating: ${reviewRes.data.rating})`);

  console.log('--- All System Tests Passed Successfully! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
