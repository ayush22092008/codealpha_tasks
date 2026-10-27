// User Profile, Follow/Unfollow, and Edit Profile Module

const ProfileModule = {
  containerEl: null,
  activeProfileTab: 'posts',

  init() {
    this.containerEl = document.getElementById('profile-view-container');
    this.bindEvents();
  },

  bindEvents() {
    // Edit profile dialog close
    const closeBtn = document.getElementById('btn-close-edit-profile');
    if (closeBtn) closeBtn.addEventListener('click', () => window.UI.closeDialog('edit-profile-dialog'));

    // Edit profile form
    const form = document.getElementById('edit-profile-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveProfile();
      });
    }
  },

  async viewProfile(username) {
    window.appState.currentView = 'profile';
    window.appState.viewingProfile = username;

    // Toggle view elements
    document.getElementById('home-feed-view').style.display = 'none';
    document.getElementById('profile-view-container').style.display = 'block';

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (window.appState.user && window.appState.user.username.toLowerCase() === username.toLowerCase()) {
      const pLink = document.getElementById('nav-profile');
      if (pLink) pLink.classList.add('active');
    }

    this.containerEl.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: var(--color-text-muted);">
        <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      </div>
    `;

    try {
      const data = await window.API.getUser(username);
      this.renderProfile(data.user);
    } catch (err) {
      this.containerEl.innerHTML = `
        <div style="text-align: center; padding: 4rem; color: var(--color-text-muted);">
          <h3>User not found</h3>
          <p>@${username} does not exist on Pulse.</p>
        </div>
      `;
    }
  },

  renderProfile(user) {
    let actionBtnHtml = '';
    if (user.is_self) {
      actionBtnHtml = `<button class="btn-profile-action edit" onclick="ProfileModule.openEditModal()">Edit Profile</button>`;
    } else {
      const isFollowing = user.is_following;
      const btnClass = isFollowing ? 'btn-profile-action following' : 'btn-profile-action follow';
      const btnText = isFollowing ? 'Following' : 'Follow';
      actionBtnHtml = `
        <button class="${btnClass}" id="profile-follow-btn" onclick="ProfileModule.toggleFollow('${user.username}')">
          ${btnText}
        </button>
      `;
    }

    const locationHtml = user.location
      ? `<span class="profile-meta-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${user.location}
        </span>`
      : '';

    const websiteHtml = user.website
      ? `<a href="${user.website}" target="_blank" class="profile-meta-item" style="color: var(--color-primary);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          ${user.website.replace(/^https?:\/\//, '')}
        </a>`
      : '';

    this.containerEl.innerHTML = `
      <!-- Cover Image -->
      <img class="profile-cover" src="${user.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'}" alt="Cover" />

      <!-- Profile Details -->
      <div class="profile-details-box">
        <div class="profile-avatar-row">
          <img class="profile-avatar-lg" src="${user.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + user.username}" alt="${user.name}" />
          ${actionBtnHtml}
        </div>

        <h2 class="profile-name">${user.name}</h2>
        <div class="profile-handle">@${user.username}</div>
        <p class="profile-bio">${user.bio || 'No bio yet.'}</p>

        <div class="profile-meta-row">
          ${locationHtml}
          ${websiteHtml}
          <span class="profile-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div class="profile-stats-row">
          <span class="stat-link"><strong>${user.following_count}</strong> Following</span>
          <span class="stat-link"><strong id="profile-followers-count">${user.followers_count}</strong> Followers</span>
        </div>
      </div>

      <!-- Profile Tabs -->
      <div class="profile-tabs">
        <button class="profile-tab-btn active" data-tab="posts" onclick="ProfileModule.switchProfileTab('posts', '${user.username}')">Posts</button>
        <button class="profile-tab-btn" data-tab="likes" onclick="ProfileModule.switchProfileTab('likes', '${user.username}')">Likes</button>
      </div>

      <!-- Profile Posts Stream -->
      <div id="profile-posts-stream" class="post-list"></div>
    `;

    this.loadProfilePosts('posts', user.username);
  },

  async switchProfileTab(tab, username) {
    this.activeProfileTab = tab;
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    this.loadProfilePosts(tab, username);
  },

  async loadProfilePosts(tab, username) {
    const stream = document.getElementById('profile-posts-stream');
    if (!stream) return;

    stream.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Loading posts...</div>
    `;

    try {
      const params = tab === 'posts' ? { user: username } : { likedBy: username };
      const data = await window.API.getPosts(params);

      if (!data.posts || data.posts.length === 0) {
        stream.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: var(--color-text-muted); font-size: 0.9rem;">
            ${tab === 'posts' ? '@' + username + ' hasn\'t posted yet.' : '@' + username + ' hasn\'t liked any posts yet.'}
          </div>
        `;
        return;
      }

      stream.innerHTML = data.posts.map(post => window.PostsModule.generatePostHtml(post)).join('');
    } catch (err) {
      stream.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--color-danger);">Failed to load posts.</div>`;
    }
  },

  async toggleFollow(username) {
    if (!window.appState.user) {
      window.AuthModule.openAuthModal('login');
      return;
    }

    const btn = document.getElementById('profile-follow-btn');
    const countEl = document.getElementById('profile-followers-count');

    try {
      const res = await window.API.toggleFollow(username);
      if (btn) {
        btn.textContent = res.is_following ? 'Following' : 'Follow';
        btn.className = res.is_following ? 'btn-profile-action following' : 'btn-profile-action follow';
      }
      if (countEl) countEl.textContent = res.followers_count;

      window.UI.showToast(res.message);
      window.AppModule.loadWhoToFollow();
    } catch (err) {
      window.UI.showToast(err.message || 'Follow action failed.');
    }
  },

  openEditModal() {
    const user = window.appState.user;
    if (!user) return;

    document.getElementById('edit-name').value = user.name || '';
    document.getElementById('edit-bio').value = user.bio || '';
    document.getElementById('edit-location').value = user.location || '';
    document.getElementById('edit-website').value = user.website || '';
    document.getElementById('edit-avatar').value = user.avatar_url || '';
    document.getElementById('edit-cover').value = user.cover_url || '';

    window.UI.openDialog('edit-profile-dialog');
  },

  async handleSaveProfile() {
    const name = document.getElementById('edit-name').value;
    const bio = document.getElementById('edit-bio').value;
    const location = document.getElementById('edit-location').value;
    const website = document.getElementById('edit-website').value;
    const avatar_url = document.getElementById('edit-avatar').value;
    const cover_url = document.getElementById('edit-cover').value;

    try {
      const res = await window.API.updateProfile({ name, bio, location, website, avatar_url, cover_url });
      window.appState.setAuth(res.user, window.appState.token);
      window.UI.closeDialog('edit-profile-dialog');
      window.UI.showToast('Profile updated!');
      this.viewProfile(res.user.username);
    } catch (err) {
      window.UI.showToast(err.message || 'Failed to update profile.');
    }
  }
};

window.ProfileModule = ProfileModule;
