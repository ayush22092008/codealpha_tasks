const db = require('./database');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM products');
  const { count } = countStmt.get();

  if (count > 0) {
    console.log(`Database already contains ${count} products. Skipping seeding.`);
    return;
  }

  console.log('Seeding initial products, reviews, and test accounts...');

  // Seed default demo user
  const userCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@lumina.com');
  let demoUserId = userCheck ? userCheck.id : null;
  if (!userCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('password123', salt);
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const res = insertUser.run('Alex Morgan', 'customer@lumina.com', hash, 'customer');
    demoUserId = res.lastInsertRowid;
  }

  const products = [
    {
      name: 'SonicPro Wireless ANC Headphones',
      slug: 'sonicpro-wireless-anc-headphones',
      category: 'Electronics',
      description: 'Engineered with hybrid active noise cancellation, 40mm beryllium drivers, and up to 45 hours of ultra-crisp audio playback on a single charge. Features plush memory foam earcups and instant multi-device Bluetooth 5.3 pairing.',
      price: 199.99,
      original_price: 249.99,
      stock: 18,
      rating: 4.9,
      review_count: 124,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      badge: 'Bestseller',
      specs: JSON.stringify({
        'Driver Size': '40mm High-Res',
        'Battery Life': '45 Hours (ANC On)',
        'Connectivity': 'Bluetooth 5.3 & 3.5mm Aux',
        'Noise Cancellation': 'Hybrid Active Noise Cancelling (-38dB)',
        'Weight': '250g'
      }),
      reviews: [
        { user: 'Sarah Jenkins', rating: 5, comment: 'Phenomenal noise cancellation! Commuting on the subway is dead quiet now. Soundstage is wide and punchy.' },
        { user: 'David Kim', rating: 5, comment: 'Comfortable enough to wear all day during work meetings. The battery lasts over a week easily.' }
      ]
    },
    {
      name: 'Vanguard Ultra GPS Smartwatch',
      slug: 'vanguard-ultra-gps-smartwatch',
      category: 'Electronics',
      description: 'Aerospace-grade titanium chassis with an ultra-bright sapphire crystal AMOLED display. Features dual-frequency GNSS navigation, 100m water resistance, continuous ECG health monitoring, and 14-day battery reserve.',
      price: 299.99,
      original_price: 349.99,
      stock: 12,
      rating: 4.8,
      review_count: 89,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      badge: 'New Arrival',
      specs: JSON.stringify({
        'Case Material': 'Grade 5 Aerospace Titanium',
        'Display': '1.43" AMOLED, 1000 nits',
        'Water Resistance': '10 ATM (100 Meters)',
        'Battery Life': 'Up to 14 Days Typical',
        'Sensors': 'ECG, SpO2, Optical Heart Rate, Altimeter'
      }),
      reviews: [
        { user: 'Marcus Vance', rating: 5, comment: 'Rugged yet elegant. Looks great at the office and survived rigorous mountain hiking without a scratch.' }
      ]
    },
    {
      name: 'Nova Custom Mechanical Keyboard',
      slug: 'nova-custom-mechanical-keyboard',
      category: 'Electronics',
      description: 'Compact 75% hot-swappable gasket-mounted keyboard with pre-lubed linear switches, south-facing per-key RGB backlighting, durable PBT dye-sub keycaps, and multi-mode wireless connection.',
      price: 129.50,
      original_price: 159.00,
      stock: 25,
      rating: 4.9,
      review_count: 67,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      badge: 'Popular',
      specs: JSON.stringify({
        'Layout': '75% Compact (82 Keys)',
        'Switches': 'Gateron Pro Yellow (Hot-Swappable)',
        'Keycaps': 'Double-shot PBT Cherry Profile',
        'Plate & Mount': 'FR4 Gasket Mount',
        'Connectivity': '2.4GHz Wireless, Bluetooth 5.0, USB-C'
      }),
      reviews: [
        { user: 'Elena Rostova', rating: 5, comment: 'The typing sound profile is deep and creamy right out of the box! Zero key wobble.' }
      ]
    },
    {
      name: 'Aero Minimalist Commuter Backpack',
      slug: 'aero-minimalist-commuter-backpack',
      category: 'Accessories',
      description: 'Crafted from weatherproof 840D ballistic recycled nylon with clean architectural lines. Includes an engineered clamshell opening, padded 16-inch laptop compartment, and hidden RFID-blocking passport pocket.',
      price: 89.00,
      original_price: 110.00,
      stock: 30,
      rating: 4.7,
      review_count: 52,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      badge: 'Staff Pick',
      specs: JSON.stringify({
        'Capacity': '22 Liters',
        'Dimensions': '46cm x 30cm x 15cm',
        'Laptop Sleeve': 'Fits up to 16" MacBook Pro',
        'Fabric': 'Water-resistant 840D Recycled Nylon',
        'Zippers': 'YKK Weather-proof AquaGuard'
      }),
      reviews: [
        { user: 'Liam O’Connor', rating: 4, comment: 'Sleek, keeps its shape even when half-empty, and kept all my tech dry in heavy rain.' }
      ]
    },
    {
      name: 'Prism Polarized Designer Sunglasses',
      slug: 'prism-polarized-designer-sunglasses',
      category: 'Accessories',
      description: 'Handcrafted Italian acetate frames featuring polarized category-3 mineral glass lenses with anti-reflective inner coating and 100% UV400 defense.',
      price: 119.00,
      original_price: 145.00,
      stock: 15,
      rating: 4.6,
      review_count: 41,
      image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
      badge: null,
      specs: JSON.stringify({
        'Frame Material': 'Handcrafted Plant-based Acetate',
        'Lenses': 'Polarized Scratch-Resistant CR-39',
        'UV Protection': 'UV400 (100% UVA/UVB)',
        'Hinge': '5-barrel German OBE stainless steel'
      }),
      reviews: []
    },
    {
      name: 'Velocity Carbon Running Shoes',
      slug: 'velocity-carbon-running-shoes',
      category: 'Footwear',
      description: 'Propel your stride with a full-length curved carbon fiber propulsion plate sandwiched between dual layers of ultra-responsive supercritical foam. Breathable mono-mesh upper.',
      price: 159.99,
      original_price: 189.99,
      stock: 20,
      rating: 4.8,
      review_count: 94,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      badge: 'Sale -15%',
      specs: JSON.stringify({
        'Weight': '210g (Size 9)',
        'Heel-to-Toe Drop': '8mm',
        'Midsole Plate': 'Full-length 3K Carbon Fiber',
        'Upper': 'Seamless engineered mono-mesh',
        'Outsole': 'High-abrasion Continental rubber'
      }),
      reviews: [
        { user: 'Rachel Green', rating: 5, comment: 'Shaved 2 minutes off my half-marathon personal best! Outstanding bounce and energy return.' }
      ]
    },
    {
      name: 'Aura Studio Ambient Hi-Fi Speaker',
      slug: 'aura-studio-ambient-hi-fi-speaker',
      category: 'Electronics',
      description: '360-degree room-filling acoustic architecture featuring a 5-inch subwoofer and six neodymium mid-high transducers. Integrated responsive warm ambient lighting that pulses with acoustics.',
      price: 249.00,
      original_price: 299.00,
      stock: 14,
      rating: 4.9,
      review_count: 73,
      image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
      badge: 'Bestseller',
      specs: JSON.stringify({
        'Total Output': '130W RMS Power',
        'Audio Channels': '360° Omnidirectional Sound',
        'Frequency Response': '45Hz – 20kHz',
        'Streaming': 'AirPlay 2, Spotify Connect, Bluetooth 5.2'
      }),
      reviews: []
    },
    {
      name: 'Siena Full-Grain Leather Wallet',
      slug: 'siena-full-grain-leather-wallet',
      category: 'Accessories',
      description: 'Slim bifold handcrafted from vegetable-tanned Tuscan leather that develops a rich, personalized patina over time. Holds 8-10 cards plus flat bills with RFID shielding.',
      price: 49.99,
      original_price: 65.00,
      stock: 40,
      rating: 4.7,
      review_count: 38,
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
      badge: null,
      specs: JSON.stringify({
        'Leather': 'Full-Grain Vegetable Tanned Tuscan Cowhide',
        'Card Capacity': 'Up to 10 cards + bill slot',
        'Security': 'Built-in RFID blocking liner',
        'Dimensions': '10.5cm x 7.8cm x 1.1cm'
      }),
      reviews: []
    },
    {
      name: 'Lumina Ceramic Pour-Over Kettle',
      slug: 'lumina-ceramic-pour-over-kettle',
      category: 'Lifestyle',
      description: 'Precision gooseneck spout for optimal pour-over extraction control. Built-in digital PID temperature control base capable of holding water at your exact target degree for 60 minutes.',
      price: 99.00,
      original_price: 120.00,
      stock: 22,
      rating: 4.8,
      review_count: 61,
      image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
      badge: 'Top Rated',
      specs: JSON.stringify({
        'Capacity': '0.9 Liters (30 oz)',
        'Heating Power': '1200W Rapid Boil',
        'Temp Range': '104°F – 212°F (40°C – 100°C)',
        'Body': 'Food-grade 304 Stainless Steel & Matte Finish'
      }),
      reviews: []
    },
    {
      name: 'Artisan Ceramic Minimalist Mug Set',
      slug: 'artisan-ceramic-minimalist-mug-set',
      category: 'Lifestyle',
      description: 'Set of two wheel-thrown stoneware ceramic coffee mugs with comfortable ergonomic handles and raw speckled clay bottom. Microwave and dishwasher safe.',
      price: 38.00,
      original_price: 45.00,
      stock: 35,
      rating: 4.9,
      review_count: 29,
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
      badge: null,
      specs: JSON.stringify({
        'Set Count': '2 Mugs',
        'Volume': '350ml (12 oz) each',
        'Material': 'High-fire durable Stoneware',
        'Finish': 'Satin matte non-toxic glaze'
      }),
      reviews: []
    },
    {
      name: 'Heritage Low-Top Suede Sneakers',
      slug: 'heritage-low-top-suede-sneakers',
      category: 'Footwear',
      description: 'Timeless court-inspired low top crafted with supple buttery suede, natural vulcanized rubber cupsole, and an arch-supporting cork insole that shapes to your feet.',
      price: 135.00,
      original_price: 160.00,
      stock: 16,
      rating: 4.6,
      review_count: 48,
      image_url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
      badge: 'Sale -15%',
      specs: JSON.stringify({
        'Upper': '100% Premium Suede Leather',
        'Insole': 'Ergonomic Natural Cork & EVA',
        'Sole': 'Stitched Vulcanized Gum Rubber',
        'Fit': 'True to size'
      }),
      reviews: []
    },
    {
      name: 'Equinox 3-in-1 MagSafe Charging Stand',
      slug: 'equinox-3-in-1-magsafe-charging-stand',
      category: 'Electronics',
      description: 'Fast wireless charging station for iPhone, Apple Watch, and AirPods simultaneously. Weighted aluminum alloy base keeps the stand securely anchored when detaching your device.',
      price: 79.99,
      original_price: 99.00,
      stock: 28,
      rating: 4.8,
      review_count: 83,
      image_url: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&q=80',
      badge: 'Popular',
      specs: JSON.stringify({
        'Phone Output': '15W Fast Qi2 / MagSafe',
        'Watch Output': '5W Fast Watch Charger',
        'Earbuds Output': '5W Base Pad',
        'Material': 'Anodized CNC Aluminum & Soft Silicone'
      }),
      reviews: []
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, category, description, price, original_price, stock, rating, review_count, image_url, badge, specs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_name, rating, comment)
    VALUES (?, ?, ?, ?)
  `);

  for (const p of products) {
    const res = insertProduct.run(
      p.name,
      p.slug,
      p.category,
      p.description,
      p.price,
      p.original_price,
      p.stock,
      p.rating,
      p.review_count,
      p.image_url,
      p.badge,
      p.specs
    );

    const productId = res.lastInsertRowid;
    if (p.reviews && p.reviews.length > 0) {
      for (const rev of p.reviews) {
        insertReview.run(productId, rev.user, rev.rating, rev.comment);
      }
    }
  }

  // Seed sample order for demo user
  const orderCheck = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  if (orderCheck.count === 0 && demoUserId) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_zip, payment_method, payment_status, subtotal, shipping_cost, discount, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const orderRes = insertOrder.run(
      'LUM-2026-84920',
      demoUserId,
      'Alex Morgan',
      'customer@lumina.com',
      '+1 (555) 019-2834',
      '742 Evergreen Terrace',
      'Springfield',
      '97477',
      'Credit Card (ending 4242)',
      'Paid',
      199.99,
      0.00,
      10.00,
      189.99,
      'Delivered'
    );
    const orderId = orderRes.lastInsertRowid;

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertOrderItem.run(
      orderId,
      1,
      'SonicPro Wireless ANC Headphones',
      199.99,
      1,
      199.99,
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
    );
  }

  console.log(`Successfully seeded ${products.length} products and initial sample records!`);
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
