const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Suggested users to follow
router.get('/suggestions/who-to-follow', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.bio
      FROM users u
      WHERE u.id != ?
        AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
      ORDER BY u.id DESC
      LIMIT 4
    `);
    const suggestions = stmt.all(currentUserId, currentUserId);
    return res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    return res.status(500).json({ error: 'Failed to fetch suggestions.' });
  }
});

// Update own profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, bio, location, website, avatar_url, cover_url } = req.body;

    const update = db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          bio = COALESCE(?, bio),
          location = COALESCE(?, location),
          website = COALESCE(?, website),
          avatar_url = COALESCE(?, avatar_url),
          cover_url = COALESCE(?, cover_url)
      WHERE id = ?
    `);

    update.run(
      name ? name.trim() : null,
      bio !== undefined ? bio.trim() : null,
      location !== undefined ? location.trim() : null,
      website !== undefined ? website.trim() : null,
      avatar_url || null,
      cover_url || null,
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, username, name, email, avatar_url, cover_url, bio, location, website, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    return res.json({ message: 'Profile updated!', user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Get user profile by username
router.get('/:username', optionalAuth, (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = db.prepare(`
      SELECT id, username, name, avatar_url, cover_url, bio, location, website, created_at
      FROM users
      WHERE LOWER(username) = ?
    `).get(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;

    let isFollowing = false;
    if (req.user) {
      const checkFollow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, user.id);
      isFollowing = !!checkFollow;
    }

    return res.json({
      user: {
        ...user,
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount,
        is_following: isFollowing,
        is_self: req.user ? req.user.id === user.id : false
      }
    });
  } catch (err) {
    console.error('User fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// Toggle Follow / Unfollow
router.post('/:username/follow', requireAuth, (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const targetUser = db.prepare('SELECT id, username FROM users WHERE LOWER(username) = ?').get(username);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const existingFollow = db.prepare(`
      SELECT id FROM follows
      WHERE follower_id = ? AND following_id = ?
    `).get(req.user.id, targetUser.id);

    let isFollowing = false;
    if (existingFollow) {
      // Unfollow
      db.prepare('DELETE FROM follows WHERE id = ?').run(existingFollow.id);
      isFollowing = false;
    } else {
      // Follow
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, targetUser.id);
      isFollowing = true;
    }

    const updatedFollowers = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(targetUser.id).count;

    return res.json({
      success: true,
      is_following: isFollowing,
      followers_count: updatedFollowers,
      message: isFollowing ? `You are now following @${targetUser.username}` : `Unfollowed @${targetUser.username}`
    });
  } catch (err) {
    console.error('Follow toggle error:', err);
    return res.status(500).json({ error: 'Failed to update follow status.' });
  }
});

// Get followers list
router.get('/:username/followers', (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const followers = db.prepare(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.bio
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.id DESC
    `).all(user.id);

    return res.json({ followers });
  } catch (err) {
    console.error('Followers fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch followers.' });
  }
});

// Get following list
router.get('/:username/following', (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const following = db.prepare(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.bio
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.id DESC
    `).all(user.id);

    return res.json({ following });
  } catch (err) {
    console.error('Following fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch following.' });
  }
});

module.exports = router;
