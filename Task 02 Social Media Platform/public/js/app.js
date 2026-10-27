// App Controller & Main Navigation

const AppModule = {
  init() {
    window.UI.init();
    window.AuthModule.init();
    window.PostsModule.init();
    window.ProfileModule.init();

    this.bindNavEvents();
    this.loadWhoToFollow();
  },

  bindNavEvents() {
    // Nav Home
    const navHome = document.getElementById('nav-home');
    if (navHome) {
      navHome.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHomeFeed();
      });
    }

    // Nav Profile
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) {
      navProfile.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.appState.user) {
          window.ProfileModule.viewProfile(window.appState.user.username);
        } else {
          window.AuthModule.openAuthModal('login');
        }
      });
    }

    // Nav Post CTA
    const navPostBtn = document.getElementById('btn-nav-compose');
    if (navPostBtn) {
      navPostBtn.addEventListener('click', () => {
        this.showHomeFeed();
        const textarea = document.getElementById('composer-textarea');
        if (textarea) textarea.focus();
      });
    }

    // Right Sidebar Search Box
    const searchInput = document.getElementById('sidebar-search-input');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          const query = e.target.value.trim().toLowerCase();
          if (query.startsWith('@')) {
            window.ProfileModule.viewProfile(query.replace('@', ''));
          }
        }, 500);
      });
    }
  },

  showHomeFeed() {
    window.appState.currentView = 'home';
    window.appState.viewingProfile = null;

    document.getElementById('home-feed-view').style.display = 'block';
    document.getElementById('profile-view-container').style.display = 'none';

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navHome = document.getElementById('nav-home');
    if (navHome) navHome.classList.add('active');

    window.PostsModule.loadFeed();
  },

  async loadWhoToFollow() {
    const listEl = document.getElementById('who-to-follow-list');
    if (!listEl) return;

    try {
      const data = await window.API.getWhoToFollow();
      if (!data.suggestions || data.suggestions.length === 0) {
        listEl.innerHTML = `<div style="font-size: 0.8rem; color: var(--color-text-muted);">No suggestions right now.</div>`;
        return;
      }

      listEl.innerHTML = data.suggestions.map(u => `
        <div class="suggestion-item">
          <div class="suggestion-user-info" onclick="ProfileModule.viewProfile('${u.username}')">
            <img class="suggestion-avatar" src="${u.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + u.username}" alt="${u.name}" />
            <div style="line-height: 1.2;">
              <div style="font-weight: 700; font-size: 0.85rem;">${u.name}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">@${u.username}</div>
            </div>
          </div>
          <button class="btn-follow-sm" onclick="AppModule.quickFollow('${u.username}')">Follow</button>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  },

  async quickFollow(username) {
    if (!window.appState.user) {
      window.AuthModule.openAuthModal('login');
      return;
    }

    try {
      await window.API.toggleFollow(username);
      window.UI.showToast(`Following @${username}!`);
      this.loadWhoToFollow();
      if (window.appState.activeFeedTab === 'following') {
        window.PostsModule.loadFeed();
      }
    } catch (err) {
      window.UI.showToast(err.message || 'Follow failed.');
    }
  }
};

window.AppModule = AppModule;
document.addEventListener('DOMContentLoaded', () => AppModule.init());
