const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// Register user
router.post('/register', (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, full name, email, and password.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Username or email is already registered.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`;
    const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80';

    const insert = db.prepare(`
      INSERT INTO users (username, name, email, password_hash, avatar_url, cover_url, bio)
      VALUES (?, ?, ?, ?, ?, ?, 'Hey there! I just joined Pulse.')
    `);
    const result = insert.run(cleanUsername, name.trim(), cleanEmail, hash, defaultAvatar, defaultCover);
    const userId = Number(result.lastInsertRowid);

    const token = jwt.sign(
      { id: userId, username: cleanUsername, name: name.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        name: name.trim(),
        email: cleanEmail,
        avatar_url: defaultAvatar,
        cover_url: defaultCover,
        bio: 'Hey there! I just joined Pulse.'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login user
router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Please enter your username/email and password.' });
    }

    const cleanLogin = login.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = ? OR LOWER(email) = ?
    `).get(cleanLogin, cleanLogin);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get followers and following count
    const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        cover_url: user.cover_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Current user profile
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, name, email, avatar_url, cover_url, bio, location, website, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;

    return res.json({
      user: {
        ...user,
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

module.exports = router;
