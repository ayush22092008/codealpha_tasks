const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all products with filtering, search, and sorting
router.get('/', (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
      const queryParam = `%${search.trim().toLowerCase()}%`;
      params.push(queryParam, queryParam);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      sql += ' AND price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      sql += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    // Sort order
    switch (sort) {
      case 'price-asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price-desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'rating':
        sql += ' ORDER BY rating DESC, review_count DESC';
        break;
      case 'newest':
        sql += ' ORDER BY id DESC';
        break;
      default:
        sql += ' ORDER BY id ASC';
        break;
    }

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);

    const products = rows.map(p => {
      let specsObj = {};
      try {
        specsObj = p.specs ? JSON.parse(p.specs) : {};
      } catch (e) {
        specsObj = {};
      }
      return {
        ...p,
        specs: specsObj
      };
    });

    return res.json({ products, total: products.length });
  } catch (err) {
    console.error('Products fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// GET all categories with count
router.get('/categories', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);
    const categories = stmt.all();
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM products');
    const { count: totalProducts } = totalStmt.get();

    return res.json({
      categories,
      totalProducts
    });
  } catch (err) {
    console.error('Categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// GET single product by ID or slug
router.get('/:id', (req, res) => {
  try {
    const idParam = req.params.id;
    let product;

    if (!isNaN(Number(idParam))) {
      product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(idParam));
    } else {
      product = db.prepare('SELECT * FROM products WHERE slug = ?').get(idParam);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Parse specs JSON
    let specsObj = {};
    try {
      specsObj = product.specs ? JSON.parse(product.specs) : {};
    } catch (e) {
      specsObj = {};
    }

    // Fetch reviews for this product
    const reviewStmt = db.prepare(`
      SELECT id, user_name, rating, comment, created_at
      FROM reviews
      WHERE product_id = ?
      ORDER BY id DESC
    `);
    const reviews = reviewStmt.all(product.id);

    // Also get 3 related products in same category
    const relatedStmt = db.prepare(`
      SELECT id, name, slug, price, original_price, image_url, rating, badge
      FROM products
      WHERE category = ? AND id != ?
      LIMIT 4
    `);
    const relatedProducts = relatedStmt.all(product.category, product.id);

    return res.json({
      product: {
        ...product,
        specs: specsObj,
        reviews,
        relatedProducts
      }
    });
  } catch (err) {
    console.error('Product details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// POST review for a product
router.post('/:id/reviews', (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { userName, rating, comment } = req.body;

    if (!rating || !comment || !userName) {
      return res.status(400).json({ error: 'Please provide your name, star rating, and a review comment.' });
    }

    const ratingNum = Math.max(1, Math.min(5, Math.round(Number(rating))));

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Insert review
    const insert = db.prepare(`
      INSERT INTO reviews (product_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(productId, userName.trim(), ratingNum, comment.trim());

    // Update product rating and review count
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews
      WHERE product_id = ?
    `).get(productId);

    const updateProduct = db.prepare(`
      UPDATE products
      SET rating = ?, review_count = ?
      WHERE id = ?
    `);
    updateProduct.run(
      Number(stats.avg_rating.toFixed(1)),
      stats.count,
      productId
    );

    return res.status(201).json({
      message: 'Review posted successfully!',
      rating: Number(stats.avg_rating.toFixed(1)),
      reviewCount: stats.count
    });
  } catch (err) {
    console.error('Add review error:', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});

module.exports = router;
