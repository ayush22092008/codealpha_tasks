const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize database & seed initial users/posts/comments
const db = require('./src/database');
const seedDatabase = require('./src/seed');
seedDatabase();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const postRoutes = require('./src/routes/posts');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', app: 'Pulse Social Media Platform', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  PULSE Social Media Platform is running!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});

module.exports = app;
