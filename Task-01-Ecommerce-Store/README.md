# LUMINA — Modern Full-Stack E-Commerce Store

A sleek, production-grade e-commerce application built with modern vanilla HTML5, CSS3, JavaScript on the frontend, Express.js (Node.js) on the backend, and persistent storage powered by SQLite (`node:sqlite`).

![Lumina E-Commerce](https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80)

---

## 🌟 Key Features

- **Product Catalog & Dynamic Discovery**:
  - 12+ pre-seeded realistic consumer tech & lifestyle products with high-resolution imagery
  - Real-time instant search with debounce
  - Category pill filter tabs (Electronics, Accessories, Footwear, Lifestyle)
  - Interactive price range slider ($20 - $350)
  - Multi-attribute sorting (Featured, Price Low-High, Price High-Low, Customer Rated, Newest)
  - Badges for *Bestseller*, *Sale -15%*, *New Arrival*, *Top Rated*
  - Low stock indicators ("Only 3 left!")

- **Product Details Page & Modal**:
  - Full-resolution showcase gallery
  - Detailed product description and key specifications table (e.g. Battery life, Materials, Dimensions)
  - Interactive quantity selector (+ / -)
  - Customer review list with star breakdown
  - Live "Write a Review" form with star selector and dynamic rating recalculation
  - One-click "Add to Cart" and "Buy Now"

- **Slide-Out Shopping Cart Drawer**:
  - Seamless slide-out drawer accessible from anywhere
  - Free shipping progress bar (dynamic meter towards $50 threshold)
  - Quantity steppers and item deletion
  - Promo code discounts system (e.g. `WELCOME10` for 10% off, `SAVE20` for $20 off, `FREESHIP`)
  - Subtotal, shipping, discount, and total computation
  - Cart persistence via `localStorage`

- **Checkout & Order Processing**:
  - Customer contact & shipping address validation
  - Multiple payment methods: Credit Card (with simulated card form), Cash on Delivery (COD), Digital Wallet
  - Server-verified inventory validation and stock decrementing
  - Generation of unique order tracking references (e.g. `LUM-2026-XXXXX`)
  - Order confirmation screen with printable receipt

- **User Authentication & Dashboard**:
  - Customer registration and secure login with bcrypt password hashing & JWT token sessions
  - Pre-seeded demo account for instant testing
  - Customer dashboard displaying lifetime orders placed and total spend
  - "My Orders" history view with item thumbnails and order status badges (`Processing`, `Shipped`, `Delivered`)

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5 Semantic, Modern CSS (Custom Properties, Flexbox, Grid), Modular Vanilla JavaScript |
| **Backend** | Node.js (v24), Express.js |
| **Database** | SQLite via Node.js built-in `node:sqlite` (`DatabaseSync`) |
| **Security** | `bcryptjs` for password hashing, `jsonwebtoken` for secure stateless sessions |

---

## 🚀 Getting Started

### 1. Installation

Ensure Node.js is installed. In PowerShell:

```powershell
# Install project dependencies
npm.cmd install
```

### 2. Seed Database (Optional - runs automatically on first start)

```powershell
npm.cmd run seed
```

### 3. Start the Server

```powershell
npm.cmd start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Demo Customer** | `customer@lumina.com` | `password123` |
| **Self-Registration** | Any valid email | Minimum 6 characters |

*(You can also click the "Click to Auto-fill" button in the sign-in modal)*

---

## 🏷️ Available Promo Coupons

- `WELCOME10` — 10% off entire order
- `SAVE20` — $20 off orders over $75
- `FREESHIP` — Free shipping regardless of cart total

---

## 🧪 Running System Tests

To run the automated 12-point end-to-end API test suite:

```powershell
node test_api.js
```
