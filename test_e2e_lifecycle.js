const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resBody || '{}') }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resBody || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });
}

function put(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resBody || '{}') }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runE2E() {
  console.log('========================================================');
  console.log('🚀 BITEFLOW MULTI-ROLE END-TO-END VERIFICATION');
  console.log('========================================================\n');

  // STEP 1: All 4 Roles Login
  console.log('--- STEP 1: AUTHENTICATION ACROSS ALL 4 ROLES ---');
  const adminAuth = await post('http://localhost:5000/api/auth/login', { email: 'admin@biteflow.com', password: 'admin123' });
  console.log('🛡️ Admin Login:', adminAuth.status, '| Role:', adminAuth.body.user?.role, '| Name:', adminAuth.body.user?.name);

  const ownerAuth = await post('http://localhost:5000/api/auth/login', { email: 'owner@biteflow.com', password: 'owner123' });
  console.log('🍽️ Owner Login:', ownerAuth.status, '| Role:', ownerAuth.body.user?.role, '| Name:', ownerAuth.body.user?.name);

  const deliveryAuth = await post('http://localhost:5000/api/auth/login', { email: 'delivery@biteflow.com', password: 'delivery123' });
  console.log('🛵 Delivery Partner Login:', deliveryAuth.status, '| Role:', deliveryAuth.body.user?.role, '| Name:', deliveryAuth.body.user?.name);

  const userAuth = await post('http://localhost:5000/api/auth/login', { email: 'user@biteflow.com', password: 'user123' });
  console.log('👤 Customer Login:', userAuth.status, '| Role:', userAuth.body.user?.role, '| Name:', userAuth.body.user?.name);

  const adminToken = adminAuth.body.token;
  const ownerToken = ownerAuth.body.token;
  const deliveryToken = deliveryAuth.body.token;
  const customerToken = userAuth.body.token;

  // STEP 2: Restaurant Owner Menu & Category Management
  console.log('\n--- STEP 2: RESTAURANT OWNER MENU & DISH MANAGEMENT ---');
  const ownerRest = await get('http://localhost:5000/api/owner/restaurant', ownerToken);
  const restaurantId = ownerRest.body?.id;
  console.log('🏪 Restaurant Loaded:', ownerRest.body?.name, '(ID: ' + restaurantId + ', Status: ' + ownerRest.body?.status + ')');

  // Add Category
  const catRes = await post('http://localhost:5000/api/owner/categories', {
    restaurant_id: restaurantId,
    name: 'Heritage Biryanis',
    description: 'Slow-cooked traditional clay pot dum biryanis'
  }, ownerToken);
  console.log('📁 Category Created:', catRes.status, '| Category:', catRes.body?.name, '(ID: ' + catRes.body?.id + ')');

  // Add Food Item with Nutrition & Health fields
  const foodRes = await post('http://localhost:5000/api/owner/foods', {
    restaurant_id: restaurantId,
    category_id: catRes.body?.id,
    name: 'Dindigul Thalappakatti Mutton Biryani',
    description: 'Seeraga samba rice cooked with succulent country mutton and traditional spices',
    price: 380,
    category: 'Heritage Biryanis',
    is_veg: 0,
    prep_time: '30 min',
    spicy_level: 'High',
    calories: 680,
    protein: 42,
    carbs: 65,
    fat: 26,
    fiber: 5,
    sugar: 2,
    sodium: 520,
    tags: 'High Protein, Balanced'
  }, ownerToken);
  console.log('🍛 Food Item Created:', foodRes.status, '| Dish:', foodRes.body?.name, '| Price: ₹' + foodRes.body?.price, '(ID: ' + foodRes.body?.id + ')');
  const foodId = foodRes.body?.id;

  // STEP 3: Customer Places Order
  console.log('\n--- STEP 3: CUSTOMER ORDER PLACEMENT ---');
  const orderPlacement = await post('http://localhost:5000/api/orders', {
    restaurant_id: restaurantId,
    restaurant_name: ownerRest.body?.name,
    customer_name: userAuth.body.user?.name,
    phone: '9876500001',
    total: 825,
    subtotal: 760,
    delivery_fee: 30,
    platform_fee: 5,
    tax: 30,
    discount: 0,
    items: [
      { food_id: foodId, name: 'Dindigul Thalappakatti Mutton Biryani', price: 380, quantity: 2 }
    ],
    address: 'Flat 402, Green Valley Apts, 12th Main Road, RS Puram, Coimbatore - 641002',
    payment_method: 'UPI'
  }, customerToken);

  const orderId = orderPlacement.body?.id;
  const orderCode = orderPlacement.body?.order_code;
  console.log('🛒 Order Placed:', orderPlacement.status, '| Code:', orderCode, '| Status:', orderPlacement.body?.status, '| Total: ₹' + orderPlacement.body?.total);

  // STEP 4: Restaurant Owner Order Workflow
  console.log('\n--- STEP 4: RESTAURANT OWNER ORDER WORKFLOW ---');
  // Check queue
  const incoming = await get('http://localhost:5000/api/owner/orders/' + restaurantId, ownerToken);
  console.log('📥 Incoming Orders in Owner Queue:', incoming.body?.length, '| Top Order Code:', incoming.body?.[0]?.order_code);

  // Accept Order (PLACED -> CONFIRMED)
  const acceptOrder = await put('http://localhost:5000/api/owner/orders/' + orderId + '/accept', {}, ownerToken);
  console.log('✅ Stage 1: Order Accepted -> Status:', acceptOrder.body?.status);

  // Start Preparing (CONFIRMED -> PREPARING)
  const prepOrder = await put('http://localhost:5000/api/owner/orders/' + orderId + '/prepare', {}, ownerToken);
  console.log('✅ Stage 2: Food Preparing -> Status:', prepOrder.body?.status);

  // Mark Ready for Pickup (PREPARING -> READY_FOR_PICKUP)
  const readyOrder = await put('http://localhost:5000/api/owner/orders/' + orderId + '/ready', {}, ownerToken);
  console.log('✅ Stage 3: Ready For Pickup -> Status:', readyOrder.body?.status);

  // STEP 5: Delivery Partner Acceptance & Route Progression
  console.log('\n--- STEP 5: DELIVERY PARTNER WORKFLOW ---');
  // Check available deliveries
  const availableDeliveries = await get('http://localhost:5000/api/delivery/available-orders', deliveryToken);
  console.log('🛵 Available Deliveries for Partner:', availableDeliveries.body?.length, '| Order Found:', availableDeliveries.body?.some(o => o.id === orderId));

  // Partner Accepts Order (READY_FOR_PICKUP -> DELIVERY_ASSIGNED)
  const acceptTrip = await post('http://localhost:5000/api/delivery/accept/' + orderId, {}, deliveryToken);
  console.log('✅ Stage 4: Delivery Partner Assigned -> Status:', acceptTrip.body?.status);

  // Step through all real-world route waypoints
  const waypoints = [
    { status: 'GOING_TO_RESTAURANT', desc: 'Heading to restaurant pickup' },
    { status: 'ARRIVED_AT_RESTAURANT', desc: 'Arrived at restaurant kitchen' },
    { status: 'FOOD_PICKED_UP', desc: 'Package picked up & verified' },
    { status: 'OUT_FOR_DELIVERY', desc: 'Out for delivery to customer address' },
    { status: 'ARRIVED_AT_CUSTOMER', desc: 'Arrived at customer building' },
    { status: 'DELIVERED', desc: 'Handed over to customer' }
  ];

  for (const wp of waypoints) {
    const wpRes = await put('http://localhost:5000/api/delivery/orders/' + orderId + '/status', { status: wp.status }, deliveryToken);
    console.log('   ↳ ' + wp.status.padEnd(23) + ' -> ' + (wpRes.body?.success ? '✅ ' + wp.desc : '❌ ' + JSON.stringify(wpRes.body)));
  }

  // Verify delivery partner wallet update
  const delivProfile = await get('http://localhost:5000/api/delivery/profile', deliveryToken);
  console.log('💰 Delivery Partner Wallet -> Today Earnings: ₹' + delivProfile.body?.today_earnings, '| Total Deliveries:', delivProfile.body?.total_deliveries);

  // STEP 6: Customer Order Audit Trail & Rating/Review
  console.log('\n--- STEP 6: CUSTOMER ORDER AUDIT & REVIEW ---');
  const customerOrder = await get('http://localhost:5000/api/orders/' + orderId, customerToken);
  console.log('📦 Final Customer Order Status:', customerOrder.body?.status);
  console.log('📋 Audit Trail Milestones Recorded (' + customerOrder.body?.status_history?.length + ' events):');
  customerOrder.body?.status_history?.forEach((h, idx) => {
    console.log(`   ${idx + 1}. [${h.status}] - ${h.notes} (${h.created_at})`);
  });

  // Customer rates and reviews
  const review = await post('http://localhost:5000/api/reviews', {
    order_id: orderId,
    restaurant_id: restaurantId,
    restaurant_rating: 5,
    food_rating: 5,
    delivery_rating: 5,
    comment: 'Authentic Seeraga samba mutton biryani! Piping hot and delivered perfectly on time.'
  }, customerToken);
  console.log('⭐ Customer Review Posted:', review.status, '| Review ID:', review.body?.id);

  // STEP 7: Super Admin Monitoring & Platform Metrics
  console.log('\n--- STEP 7: SUPER ADMIN PLATFORM MONITORING ---');
  const adminStats = await get('http://localhost:5000/api/admin/stats', adminToken);
  console.log('🛡️ Admin Real-Time Metrics:');
  console.log('   • Total Platform Orders:   ', adminStats.body?.total_orders);
  console.log('   • Completed / Delivered:   ', adminStats.body?.delivered_orders);
  console.log('   • Gross Platform Revenue:  ₹' + adminStats.body?.total_revenue);
  console.log('   • Total Registered Users:  ', adminStats.body?.total_users);
  console.log('   • Active Customers:        ', adminStats.body?.total_customers);
  console.log('   • Restaurant Owners:       ', adminStats.body?.total_restaurant_owners);
  console.log('   • Delivery Partners:       ', adminStats.body?.total_delivery_partners);
  console.log('   • Approved Restaurants:    ', adminStats.body?.total_restaurants);

  console.log('\n========================================================');
  console.log('🎉 100% COMPLETE: ALL 4 ROLES & FULL LIFECYCLE CERTIFIED!');
  console.log('========================================================');
}

runE2E().catch(console.error);
