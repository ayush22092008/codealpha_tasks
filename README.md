# CodeAlpha Web Development Internship Tasks

This repository contains all assigned full-stack web development projects completed for the **CodeAlpha Web Development Internship**.

---

## 📌 Projects Summary

| Task | Project Name | Tech Stack | Status | Folder Link |
|:---:|---|---|:---:|:---:|
| **Task 1** | **Simple E-Commerce Store (Lumina)** | HTML5, CSS3, JavaScript, Express.js (Node.js), SQLite | ✅ Completed | [View Task 1 Folder](https://github.com/ayush22092008/codealpha_tasks/tree/main/Task-01-Ecommerce-Store) |
| **Task 2** | **Social Media Platform (Pulse)** | HTML5, CSS3, JavaScript, Express.js (Node.js), SQLite | ✅ Completed | [View Task 2 Folder](https://github.com/ayush22092008/codealpha_tasks/tree/main/Task%2002%20Social%20Media%20Platform) |

---

## 🛍️ Task 1: Simple E-Commerce Store (Lumina)

A production-grade, full-stack e-commerce web application featuring:
- **Product Catalog & Discovery**: 12+ curated tech & lifestyle items, real-time debounced search, category filter pills, price range slider ($20–$350), and multi-attribute sorting.
- **Product Details View**: High-resolution gallery, key specifications table, stock indicators, and customer review submission system.
- **Slide-Out Shopping Cart Drawer**: Dynamic Free Shipping meter (threshold progress towards $50), item quantity adjustments, and promo coupon discount engine (`WELCOME10`, `SAVE20`, `FREESHIP`).
- **Checkout & Order Processing**: Customer address validation, multiple payment options (Card, COD, Digital Wallet), server-side stock decrementing, and order tracking receipts.
- **User Authentication & Dashboard**: Secure registration & login with password hashing, customer order history, and lifetime spending stats.
- **Database**: SQLite database storing products, users, orders, order items, and reviews.

📂 **Folder**: [Task-01-Ecommerce-Store](https://github.com/ayush22092008/codealpha_tasks/tree/main/Task-01-Ecommerce-Store)  
🌐 **Local Port**: `http://localhost:3000`

---

## 💬 Task 2: Social Media Platform (Pulse)

A Twitter/Threads-inspired responsive mini social media platform featuring:
- **User Profiles**: Custom cover banners, profile avatars, editable bio, location, website link, joined date, and live **Followers** and **Following** counters.
- **Post Feeds & Composer**: Post composer supporting text (up to 280 characters) and image attachments; dual feeds with **"For You"** (global network stream) and **"Following"** (curated followed creators stream).
- **Interactive Likes System**: Instant animated heart button with real-time like counter updates.
- **Comments System**: Inline expandable comment threads under each post with instant replies.
- **Follow / Unfollow System**: One-click follow toggle on user profiles and the *"Who to Follow"* recommendation sidebar.
- **Fast Demo Account Switcher**: 1-click login between 4 developer accounts (`@alexmorgan`, `@sarah_codes`, `@marcus_v`, `@elena_r`) to easily test interactions.
- **Database**: SQLite database storing users, posts, comments, likes, and follower relationships.

📂 **Folder**: [Task 02 Social Media Platform](https://github.com/ayush22092008/codealpha_tasks/tree/main/Task%2002%20Social%20Media%20Platform)  
🌐 **Local Port**: `http://localhost:4000`

---

## 🛠️ Technology Stack Across All Projects

* **Frontend**: HTML5 Semantic, Modern CSS (Custom Properties, Flexbox, Grid), Modular Vanilla JavaScript
* **Backend**: Node.js (v24), Express.js REST APIs
* **Database**: SQLite via Node.js native `node:sqlite` (`DatabaseSync`)
* **Security**: `bcryptjs` for password hashing, `jsonwebtoken` for secure stateless sessions

---

## 👨‍💻 Intern Details

* **Intern**: Ayush Varma
* **Program**: CodeAlpha Web Development Internship
* **Repository**: [codealpha_tasks](https://github.com/ayush22092008/codealpha_tasks)
