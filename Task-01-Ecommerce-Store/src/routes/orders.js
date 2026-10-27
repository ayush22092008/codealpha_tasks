const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Validate coupon helper
function calculateCouponDiscount(couponCode, subtotal) {
  if (!couponCode) return { valid: false, discount: 0, message: '' };
  const code = couponCode.trim().toUpperCase();

  if (code === 'WELCOME10') {
    const discount = Number((subtotal * 0.10).toFixed(2));
    return { valid: true, code, discount, message: '10% Welcome discount applied!' };
  } else if (code === 'SAVE20') {
    if (subtotal >= 75) {
      return { valid: true, code, discount: 20.00, message: '$20 discount applied!' };
    } else {
      return { valid: false, discount: 0, message: 'SAVE20 requires a minimum order of $75.00' };
    }
  } else if (code === 'FREESHIP') {
    return { valid: true, code, discount: 0, freeShipping: true, message: 'Free shipping applied!' };
  }
  return { valid: false, discount: 0, message: 'Invalid promo code.' };
}

// POST validate coupon endpoint
router.post('/validate-coupon', (req, res) => {
  const { code, subtotal } = req.body;
  const result = calculateCouponDiscount(code, Number(subtotal) || 0);
  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }
  return res.json(result);
});

// POST create order (handles guest or authenticated users)
router.post('/', optionalAuth, (req, res) => {
  try {
    const { customer, items, payment, couponCode } = req.body;

    if (!customer || !customer.name || !customer.email || !customer.address || !customer.city || !customer.zip) {
      return res.status(400).json({ error: 'Please provide all required shipping and contact details.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your shopping cart is empty.' });
    }

    // Validate items and compute server-verified subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      const product = db.prepare('SELECT id, name, price, stock, image_url FROM products WHERE id = ?').get(cartItem.id);
      if (!product) {
        return res.status(400).json({ error: `Product ID #${cartItem.id} was not found.` });
      }

      const qty = parseInt(cartItem.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${product.name}.` });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Only ${product.stock} available.`
        });
      }

      const itemTotal = Number((product.price * qty).toFixed(2));
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        subtotal: itemTotal,
        imageUrl: product.image_url
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // Calculate coupon discount
    let discount = 0;
    let freeShippingBonus = false;
    if (couponCode) {
      const couponRes = calculateCouponDiscount(couponCode, subtotal);
      if (couponRes.valid) {
        discount = couponRes.discount;
        if (couponRes.freeShipping) freeShippingBonus = true;
      }
    }

    // Shipping cost: free over $50 or with coupon, else $9.99
    let shippingCost = (subtotal >= 50 || freeShippingBonus) ? 0.00 : 9.99;
    let total = Number((subtotal - discount + shippingCost).toFixed(2));
    if (total < 0) total = 0;

    // Generate readable order number e.g. LUM-2026-73914
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `LUM-${new Date().getFullYear()}-${randomSuffix}`;

    // Determine user ID if authenticated
    const userId = req.user ? req.user.id : null;
    const paymentMethod = payment && payment.method ? payment.method : 'Credit Card';

    // Begin database transaction by executing inserts
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_zip, payment_method, payment_status,
        subtotal, shipping_cost, discount, total, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?, ?, 'Processing')
    `);

    const orderResult = insertOrder.run(
      orderNumber,
      userId,
      customer.name.trim(),
      customer.email.trim().toLowerCase(),
      customer.phone ? customer.phone.trim() : '',
      customer.address.trim(),
      customer.city.trim(),
      customer.zip.trim(),
      paymentMethod,
      subtotal,
      shippingCost,
      discount,
      total
    );

    const orderId = Number(orderResult.lastInsertRowid);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const decrementStock = db.prepare(`
      UPDATE products
      SET stock = stock - ?
      WHERE id = ?
    `);

    for (const item of validatedItems) {
      insertItem.run(
        orderId,
        item.productId,
        item.name,
        item.price,
        item.quantity,
        item.subtotal,
        item.imageUrl
      );
      decrementStock.run(item.quantity, item.productId);
    }

    return res.status(201).json({
      message: 'Order placed successfully!',
      order: {
        id: orderId,
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        shippingAddress: `${customer.address}, ${customer.city} ${customer.zip}`,
        paymentMethod,
        subtotal,
        shippingCost,
        discount,
        total,
        status: 'Processing',
        items: validatedItems,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
});

// GET order by orderNumber (Receipt / Tracking)
router.get('/:orderNumber', (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = db.prepare(`
      SELECT id, product_id, product_name, price, quantity, subtotal, image_url
      FROM order_items
      WHERE order_id = ?
    `).all(order.id);

    return res.json({
      order: {
        ...order,
        items
      }
    });
  } catch (err) {
    console.error('Order lookup error:', err);
    return res.status(500).json({ error: 'Failed to find order.' });
  }
});

// GET orders for logged in user
router.get('/user/my-orders', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(req.user.id);

    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT id, product_id, product_name, price, quantity, subtotal, image_url
        FROM order_items
        WHERE order_id = ?
      `).all(order.id);
      return {
        ...order,
        items
      };
    });

    return res.json({ orders: ordersWithItems });
  } catch (err) {
    console.error('Fetch user orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
});

module.exports = router;
