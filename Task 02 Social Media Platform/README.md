# PULSE — Modern Mini Social Media Platform

A responsive full-stack social media application inspired by modern platforms like Twitter / Threads, built for the **CodeAlpha Web Development Internship (Task 2)**.

![Pulse Social Media Platform](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80)

---

## 🌟 Features Implemented

- **User Profiles**:
  - Detailed profiles with cover photo, avatar, display name, `@username` handle, bio, location, website, and join date.
  - Live **Followers** and **Following** counters.
  - Interactive profile tabs: **Posts** (posts authored by the user) and **Likes** (posts favorited by the user).
  - Modal to **Edit Profile** (change display name, bio, location, website, avatar, and cover image in real-time).

- **Posts & Feeds**:
  - Clean compose box supporting text posts (up to 280 characters) and image attachments.
  - Two feed tabs:
    - **For You**: Explore all posts across the platform in reverse-chronological order.
    - **Following**: Curated feed showing only posts from creators you follow.
  - Humanized relative timestamps (*"just now"*, *"12m"*, *"2h"*).
  - Authors can delete their own posts.

- **Like System**:
  - Instant interactive like/heart button with animated feedback.
  - Optimistic live counter updates without full page reloads.

- **Comments System**:
  - Expandable inline comment threads under each post.
  - Real-time comment submission updating the comment counter.

- **Follow / Unfollow System**:
  - One-click Follow / Unfollow toggle on profile headers and the *"Who to Follow"* recommendation sidebar.
  - Dynamically updates follower counts and personalizes the user's *"Following"* feed.

- **Fast One-Click Demo Switcher**:
  - Pre-seeded with 4 active developer accounts to easily test following, liking, and commenting between different users:
    - `@alexmorgan` (Alex Morgan)
    - `@sarah_codes` (Sarah Chen)
    - `@marcus_v` (Marcus Vance)
    - `@elena_r` (Elena Rostova)
    - Password for all demo accounts: `password123`

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5 Semantic, Modern CSS (CSS Grid, Flexbox, Variables), Vanilla JavaScript |
| **Backend** | Node.js (v24), Express.js |
| **Database** | SQLite via Node.js native `node:sqlite` (`DatabaseSync`) |
| **Auth** | `bcryptjs` for secure password hashing, `jsonwebtoken` for stateless sessions |

---

## 🚀 Getting Started

### 1. Installation

```powershell
npm install
```

### 2. Start the Application

```powershell
npm start
```

Open your browser at **[http://localhost:4000](http://localhost:4000)**.

---

## 🧪 Run Automated Verification

To run the automated 13-point test suite:

```powershell
node test_social_api.js
```
