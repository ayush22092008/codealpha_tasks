const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET feed of posts
router.get('/', optionalAuth, (req, res) => {
  try {
    const { feed, user, likedBy } = req.query;
    const currentUserId = req.user ? req.user.id : 0;

    let sql = `
      SELECT 
        p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
        u.id as author_id, u.username, u.name, u.avatar_url,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = ?
    `;

    const params = [currentUserId];

    if (user) {
      sql += ' WHERE LOWER(u.username) = LOWER(?)';
      params.push(user);
    } else if (likedBy) {
      sql += `
        JOIN likes user_like ON user_like.post_id = p.id
        JOIN users liker ON user_like.user_id = liker.id
        WHERE LOWER(liker.username) = LOWER(?)
      `;
      params.push(likedBy);
    } else if (feed === 'following') {
      if (!req.user) {
        return res.json({ posts: [] });
      }
      sql += `
        WHERE p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ?
        ) OR p.user_id = ?
      `;
      params.push(currentUserId, currentUserId);
    }

    sql += ' ORDER BY p.id DESC LIMIT 50';

    const posts = db.prepare(sql).all(...params);

    const formattedPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      image_url: p.image_url,
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      created_at: p.created_at,
      is_liked: !!p.is_liked,
      is_own: req.user ? req.user.id === p.author_id : false,
      author: {
        id: p.author_id,
        username: p.username,
        name: p.name,
        avatar_url: p.avatar_url
      }
    }));

    return res.json({ posts: formattedPosts });
  } catch (err) {
    console.error('Feed error:', err);
    return res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
});

// GET single post with comments
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = Number(req.params.id);
    const currentUserId = req.user ? req.user.id : 0;

    const post = db.prepare(`
      SELECT 
        p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
        u.id as author_id, u.username, u.name, u.avatar_url,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = ?
      WHERE p.id = ?
    `).get(currentUserId, postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Fetch comments
    const comments = db.prepare(`
      SELECT 
        c.id, c.content, c.created_at,
        u.id as author_id, u.username, u.name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.id ASC
    `).all(postId);

    return res.json({
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
        is_liked: !!post.is_liked,
        is_own: req.user ? req.user.id === post.author_id : false,
        author: {
          id: post.author_id,
          username: post.username,
          name: post.name,
          avatar_url: post.avatar_url
        },
        comments
      }
    });
  } catch (err) {
    console.error('Single post error:', err);
    return res.status(500).json({ error: 'Failed to load post.' });
  }
});

// POST create post
router.post('/', requireAuth, (req, res) => {
  try {
    const { content, image_url } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const insert = db.prepare(`
      INSERT INTO posts (user_id, content, image_url, likes_count, comments_count)
      VALUES (?, ?, ?, 0, 0)
    `);

    const result = insert.run(
      req.user.id,
      content.trim(),
      image_url && image_url.trim() ? image_url.trim() : null
    );

    const postId = Number(result.lastInsertRowid);
    const author = db.prepare('SELECT id, username, name, avatar_url FROM users WHERE id = ?').get(req.user.id);

    return res.status(201).json({
      message: 'Post created!',
      post: {
        id: postId,
        content: content.trim(),
        image_url: image_url && image_url.trim() ? image_url.trim() : null,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        is_liked: false,
        is_own: true,
        author
      }
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

// DELETE post
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    return res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// Toggle Like on Post
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = db.prepare('SELECT id, likes_count FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, postId);

    let isLiked = false;
    if (existing) {
      // Unlike
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId);
      isLiked = false;
    } else {
      // Like
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, postId);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
      isLiked = true;
    }

    const updated = db.prepare('SELECT likes_count FROM posts WHERE id = ?').get(postId);

    return res.json({
      success: true,
      is_liked: isLiked,
      likes_count: updated.likes_count
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    return res.status(500).json({ error: 'Failed to update like status.' });
  }
});

// GET comments for post
router.get('/:id/comments', (req, res) => {
  try {
    const postId = Number(req.params.id);
    const comments = db.prepare(`
      SELECT 
        c.id, c.content, c.created_at,
        u.id as author_id, u.username, u.name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.id ASC
    `).all(postId);

    return res.json({ comments });
  } catch (err) {
    console.error('Comments fetch error:', err);
    return res.status(500).json({ error: 'Failed to load comments.' });
  }
});

// POST add comment to post
router.post('/:id/comments', requireAuth, (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const insert = db.prepare(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `);
    const result = insert.run(postId, req.user.id, content.trim());
    const commentId = Number(result.lastInsertRowid);

    // Increment comments_count
    db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);

    const author = db.prepare('SELECT id, username, name, avatar_url FROM users WHERE id = ?').get(req.user.id);
    const updatedPost = db.prepare('SELECT comments_count FROM posts WHERE id = ?').get(postId);

    return res.status(201).json({
      message: 'Comment added!',
      comment: {
        id: commentId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        author
      },
      comments_count: updatedPost.comments_count
    });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
});

module.exports = router;
