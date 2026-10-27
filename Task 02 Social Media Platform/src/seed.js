const db = require('./database');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (count > 0) {
    console.log(`Database already has ${count} users. Skipping seeding.`);
    return;
  }

  console.log('Seeding initial social network users, posts, comments, likes, and follows...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  const users = [
    {
      username: 'alexmorgan',
      name: 'Alex Morgan',
      email: 'alex@pulse.dev',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
      bio: 'Full-stack engineer, coffee aficionado & UI minimalist. Building modern web experiences with Node & SQLite. ⚡',
      location: 'San Francisco, CA',
      website: 'https://alexmorgan.dev'
    },
    {
      username: 'sarah_codes',
      name: 'Sarah Chen',
      email: 'sarah@pulse.dev',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
      bio: 'AI researcher & open source contributor. Exploring modern neural architectures and spatial computing. 🤖✨',
      location: 'Seattle, WA',
      website: 'https://sarahchen.ai'
    },
    {
      username: 'marcus_v',
      name: 'Marcus Vance',
      email: 'marcus@pulse.dev',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      bio: 'Adventure photographer, mountaineer, and digital nomad. Documenting untamed peaks and alpine sunrises. 🏔️📷',
      location: 'Denver, CO',
      website: 'https://vancephotos.com'
    },
    {
      username: 'elena_r',
      name: 'Elena Rostova',
      email: 'elena@pulse.dev',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
      cover_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80',
      bio: 'Design systems lead & typography nerd. Obsessed with micro-animations, glassmorphism, and clean aesthetics.',
      location: 'New York, NY',
      website: 'https://elenarostova.design'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, name, email, password_hash, avatar_url, cover_url, bio, location, website)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const userIds = {};
  for (const u of users) {
    const res = insertUser.run(
      u.username,
      u.name,
      u.email,
      passwordHash,
      u.avatar_url,
      u.cover_url,
      u.bio,
      u.location,
      u.website
    );
    userIds[u.username] = Number(res.lastInsertRowid);
  }

  // Follows relationships
  const insertFollow = db.prepare(`
    INSERT INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `);

  // Alex follows Sarah, Marcus, Elena
  insertFollow.run(userIds['alexmorgan'], userIds['sarah_codes']);
  insertFollow.run(userIds['alexmorgan'], userIds['marcus_v']);
  insertFollow.run(userIds['alexmorgan'], userIds['elena_r']);

  // Sarah follows Alex and Elena
  insertFollow.run(userIds['sarah_codes'], userIds['alexmorgan']);
  insertFollow.run(userIds['sarah_codes'], userIds['elena_r']);

  // Marcus follows Alex and Sarah
  insertFollow.run(userIds['marcus_v'], userIds['alexmorgan']);
  insertFollow.run(userIds['marcus_v'], userIds['sarah_codes']);

  // Elena follows Alex
  insertFollow.run(userIds['elena_r'], userIds['alexmorgan']);

  // Seed posts
  const posts = [
    {
      user: 'alexmorgan',
      content: 'Just deployed our new full-stack architecture using Node.js and SQLite with zero external daemons. The performance is mindblowing — queries execute in sub-millisecond response times! ⚡💻',
      image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&q=80',
      likes: ['sarah_codes', 'elena_r', 'marcus_v'],
      comments: [
        { user: 'sarah_codes', text: 'Built-in node:sqlite is truly a game changer for modern lightweight microservices!' },
        { user: 'elena_r', text: 'And the developer velocity must be so satisfying!' }
      ]
    },
    {
      user: 'marcus_v',
      content: 'Caught the first morning light peaking over the Canadian Rockies at 11,000 feet. Absolutely freezing, but moments like this make every single step worth it. What do you all think? 🏔️✨',
      image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&q=80',
      likes: ['alexmorgan', 'sarah_codes', 'elena_r'],
      comments: [
        { user: 'alexmorgan', text: 'Stunning colors Marcus! What camera lens did you use for this?' }
      ]
    },
    {
      user: 'sarah_codes',
      content: 'Working on attention mechanism visualization in interactive canvas today. It is fascinating to watch token weights highlight context across long sentences in real-time. 🧠✨',
      image_url: null,
      likes: ['alexmorgan', 'elena_r'],
      comments: [
        { user: 'alexmorgan', text: 'Would love to see a live demo of this once ready!' }
      ]
    },
    {
      user: 'elena_r',
      content: 'Reminder for all designers and front-end devs: micro-interactions should feel discovered, never forced. Smooth bezier curves and subtle tactile feedback turn good software into memorable software. 🎨📐',
      image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&q=80',
      likes: ['alexmorgan', 'marcus_v', 'sarah_codes'],
      comments: [
        { user: 'sarah_codes', text: '100% agreed. Subtlety is the hallmark of great craft.' }
      ]
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, image_url, likes_count, comments_count)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertLike = db.prepare(`
    INSERT INTO likes (user_id, post_id)
    VALUES (?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content)
    VALUES (?, ?, ?)
  `);

  for (const p of posts) {
    const postUser = userIds[p.user];
    const likesCount = p.likes.length;
    const commentsCount = p.comments.length;

    const postRes = insertPost.run(postUser, p.content, p.image_url, likesCount, commentsCount);
    const postId = Number(postRes.lastInsertRowid);

    // Insert likes
    for (const likeUser of p.likes) {
      insertLike.run(userIds[likeUser], postId);
    }

    // Insert comments
    for (const c of p.comments) {
      insertComment.run(postId, userIds[c.user], c.text);
    }
  }

  console.log('Successfully seeded Pulse Social Network initial data!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
