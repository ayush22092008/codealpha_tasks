// Auth & User Session Module

const AuthModule = {
  dialogEl: null,
  activeTab: 'login',

  init() {
    this.dialogEl = document.getElementById('auth-dialog');
    this.bindEvents();

    window.appState.subscribe((event) => {
      if (event === 'auth') {
        this.renderUserPill();
      }
    });

    this.renderUserPill();
  },

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-auth');
    if (closeBtn) closeBtn.addEventListener('click', () => window.UI.closeDialog('auth-dialog'));

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    // Sidebar user pill click
    const pill = document.getElementById('sidebar-user-pill');
    if (pill) {
      pill.addEventListener('click', () => {
        if (window.appState.user) {
          window.ProfileModule.viewProfile(window.appState.user.username);
        } else {
          this.openAuthModal('login');
        }
      });
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.auth-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorEl = document.getElementById('auth-error-banner');
    if (errorEl) errorEl.style.display = 'none';

    if (tab === 'login') {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
    }
  },

  openAuthModal(tab = 'login') {
    this.switchTab(tab);
    window.UI.openDialog('auth-dialog');
  },

  showError(msg) {
    const errorEl = document.getElementById('auth-error-banner');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  },

  async handleLogin() {
    const login = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;

    try {
      const data = await window.API.login(login, pass);
      window.appState.setAuth(data.user, data.token);
      window.UI.closeDialog('auth-dialog');
      window.UI.showToast(`Welcome back, @${data.user.username}!`);
      window.PostsModule.loadFeed();
      window.AppModule.loadWhoToFollow();
    } catch (err) {
      this.showError(err.message || 'Login failed.');
    }
  },

  async handleRegister() {
    const username = document.getElementById('register-username').value;
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const pass = document.getElementById('register-password').value;

    try {
      const data = await window.API.register(username, name, email, pass);
      window.appState.setAuth(data.user, data.token);
      window.UI.closeDialog('auth-dialog');
      window.UI.showToast(`Account created! Welcome to Pulse, @${data.user.username}.`);
      window.PostsModule.loadFeed();
      window.AppModule.loadWhoToFollow();
    } catch (err) {
      this.showError(err.message || 'Registration failed.');
    }
  },

  async quickDemoLogin(username) {
    try {
      const data = await window.API.login(username, 'password123');
      window.appState.setAuth(data.user, data.token);
      window.UI.closeDialog('auth-dialog');
      window.UI.showToast(`Switched account to @${data.user.username}!`);
      window.PostsModule.loadFeed();
      window.AppModule.loadWhoToFollow();
    } catch (err) {
      window.UI.showToast('Demo login error: ' + err.message);
    }
  },

  handleLogout() {
    window.appState.setAuth(null, null);
    window.UI.showToast('You have signed out.');
    window.PostsModule.loadFeed();
    window.AppModule.loadWhoToFollow();
  },

  renderUserPill() {
    const pill = document.getElementById('sidebar-user-pill');
    if (!pill) return;

    const user = window.appState.user;
    if (user) {
      pill.innerHTML = `
        <div class="user-pill-info">
          <img class="user-pill-avatar" src="${user.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + user.username}" alt="${user.name}" />
          <div class="user-pill-text">
            <span class="user-pill-name">${user.name}</span>
            <span class="user-pill-handle">@${user.username}</span>
          </div>
        </div>
        <button onclick="event.stopPropagation(); AuthModule.handleLogout()" title="Sign out" style="color: var(--color-text-muted); font-size: 0.8rem; padding: 4px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      `;
    } else {
      pill.innerHTML = `
        <div class="user-pill-info" style="width: 100%; justify-content: center;">
          <span style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">Sign In / Join</span>
        </div>
      `;
    }

    // Also update composer avatar
    const compAvatar = document.getElementById('composer-avatar');
    if (compAvatar) {
      compAvatar.src = user ? user.avatar_url : 'https://api.dicebear.com/7.x/identicon/svg?seed=guest';
    }
  }
};

window.AuthModule = AuthModule;
