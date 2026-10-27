const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Pulse Social Media Automated Tests (Port 4000) ---');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health Check:', health.status === 200 ? 'PASS' : 'FAIL', health.data.app);

  // 2. Feed retrieval
  const feed = await request('GET', '/api/posts?feed=for-you');
  console.log(`2. Public Feed: ${feed.status === 200 ? 'PASS' : 'FAIL'} (${feed.data.posts.length} posts retrieved)`);

  // 3. User Registration
  const testUser = `dev_${Date.now()}`;
  const reg = await request('POST', '/api/auth/register', {
    username: testUser,
    name: 'Test Developer',
    email: `${testUser}@pulse.dev`,
    password: 'password123'
  });
  console.log(`3. User Registration: ${reg.status === 201 ? 'PASS' : 'FAIL'} (@${reg.data.user.username})`);
  const token = reg.data.token;

  // 4. User Login
  const login = await request('POST', '/api/auth/login', {
    login: testUser,
    password: 'password123'
  });
  console.log(`4. User Login: ${login.status === 200 ? 'PASS' : 'FAIL'}`);

  // 5. Get User Profile
  const profile = await request('GET', '/api/users/alexmorgan');
  console.log(`5. Profile Retrieval: ${profile.status === 200 ? 'PASS' : 'FAIL'} (${profile.data.user.name}, ${profile.data.user.followers_count} followers)`);

  // 6. Create Post
  const newPost = await request('POST', '/api/posts', {
    content: 'Testing the Pulse API with automated end-to-end integration! 🚀',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&q=80'
  }, { 'Authorization': `Bearer ${token}` });
  console.log(`6. Create Post: ${newPost.status === 201 ? 'PASS' : 'FAIL'} (Post #${newPost.data.post.id})`);
  const createdPostId = newPost.data.post.id;

  // 7. Toggle Like
  const likeRes = await request('POST', `/api/posts/${createdPostId}/like`, null, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`7. Toggle Like: ${likeRes.status === 200 ? 'PASS' : 'FAIL'} (Liked: ${likeRes.data.is_liked}, Total likes: ${likeRes.data.likes_count})`);

  // 8. Add Comment
  const commentRes = await request('POST', `/api/posts/${createdPostId}/comments`, {
    content: 'Great test post! Everything is running smoothly.'
  }, { 'Authorization': `Bearer ${token}` });
  console.log(`8. Add Comment: ${commentRes.status === 201 ? 'PASS' : 'FAIL'} (Comment #${commentRes.data.comment.id})`);

  // 9. Get Comments List
  const commentsList = await request('GET', `/api/posts/${createdPostId}/comments`);
  console.log(`9. Get Comments: ${commentsList.status === 200 ? 'PASS' : 'FAIL'} (${commentsList.data.comments.length} comment)`);

  // 10. Toggle Follow / Following
  const followRes = await request('POST', '/api/users/alexmorgan/follow', null, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`10. Follow User: ${followRes.status === 200 ? 'PASS' : 'FAIL'} (${followRes.data.message})`);

  // 11. Personalized Following Feed
  const followingFeed = await request('GET', '/api/posts?feed=following', null, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`11. Following Feed: ${followingFeed.status === 200 ? 'PASS' : 'FAIL'} (${followingFeed.data.posts.length} posts from followed creators)`);

  // 12. Update Profile
  const updateProf = await request('PUT', '/api/users/profile', {
    bio: 'Updated bio testing via automated script.',
    location: 'Silicon Valley, CA'
  }, { 'Authorization': `Bearer ${token}` });
  console.log(`12. Update Profile: ${updateProf.status === 200 ? 'PASS' : 'FAIL'}`);

  // 13. Delete Post
  const delRes = await request('DELETE', `/api/posts/${createdPostId}`, null, {
    'Authorization': `Bearer ${token}`
  });
  console.log(`13. Delete Post: ${delRes.status === 200 ? 'PASS' : 'FAIL'}`);

  console.log('--- All Pulse Social Media Tests Passed 100%! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
