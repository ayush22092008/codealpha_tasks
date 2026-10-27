// Authentication & Customer Dashboard Flow

const AuthModule = {
  dialogEl: null,
  dashboardDialogEl: null,
  userBtn: null,
  activeTab: 'login',

  init() {
    this.dialogEl = document.getElementById('auth-dialog');
    this.dashboardDialogEl = document.getElementById('user-dashboard-dialog');
    this.userBtn = document.getElementById('btn-user-account');

    this.bindEvents();

    // Subscribe to auth changes
    window.appState.subscribe((event) => {
      if (event === 'auth') {
        this.updateUserButton();
      }
    });

    this.updateUserButton();
  },

  bindEvents() {
    // Header user button click
    if (this.userBtn) {
      this.userBtn.addEventListener('click', () => {
        if (window.appState.user) {
          this.openDashboard();
        } else {
          this.openAuthModal('login');
        }
      });
    }

    // Close Auth dialog button
    const closeAuthBtn = document.getElementById('btn-close-auth');
    if (closeAuthBtn) {
      closeAuthBtn.addEventListener('click', () => {
        window.UI.closeDialog('auth-dialog');
      });
    }

    // Close Dashboard dialog button
    const closeDashBtn = document.getElementById('btn-close-dashboard');
    if (closeDashBtn) {
      closeDashBtn.addEventListener('click', () => {
        window.UI.closeDialog('user-dashboard-dialog');
      });
    }

    // Tab switching in Auth dialog
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Fill demo credentials button
    const fillDemoBtn = document.getElementById('btn-fill-demo');
    if (fillDemoBtn) {
      fillDemoBtn.addEventListener('click', () => {
        this.switchTab('login');
        document.getElementById('login-email').value = 'customer@lumina.com';
        document.getElementById('login-password').value = 'password123';
      });
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.auth-tab-btn').forEach(b => {
      if (b.getAttribute('data-tab') === tab) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorBanner = document.getElementById('auth-error-banner');

    if (errorBanner) errorBanner.style.display = 'none';

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

  showAuthError(message) {
    const banner = document.getElementById('auth-error-banner');
    if (banner) {
      banner.textContent = message;
      banner.style.display = 'block';
    }
  },

  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const data = await window.API.login(email, password);
      window.appState.setAuth(data.user, data.token);
      window.UI.closeDialog('auth-dialog');
      window.UI.showToast(`Welcome back, ${data.user.name}!`, 'success');
    } catch (err) {
      this.showAuthError(err.message || 'Login failed. Please verify credentials.');
    }
  },

  async handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
      const data = await window.API.register(name, email, password);
      window.appState.setAuth(data.user, data.token);
      window.UI.closeDialog('auth-dialog');
      window.UI.showToast(`Account created! Welcome to Lumina, ${data.user.name}.`, 'success');
    } catch (err) {
      this.showAuthError(err.message || 'Registration failed.');
    }
  },

  handleLogout() {
    window.appState.setAuth(null, null);
    window.UI.closeDialog('user-dashboard-dialog');
    window.UI.showToast('You have signed out.', 'info');
  },

  updateUserButton() {
    if (!this.userBtn) return;
    const user = window.appState.user;

    if (user) {
      this.userBtn.innerHTML = `
        <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name.split(' ')[0]}</span>
      `;
    } else {
      this.userBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Sign In</span>
      `;
    }
  },

  async openDashboard() {
    const user = window.appState.user;
    if (!user) return;

    window.UI.openDialog('user-dashboard-dialog');

    // Populate user profile info
    const avatarEl = document.getElementById('dashboard-avatar');
    const nameEl = document.getElementById('dashboard-name');
    const emailEl = document.getElementById('dashboard-email');

    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;

    // Fetch live user profile stats and orders
    try {
      const [profileData, ordersData] = await Promise.all([
        window.API.getProfile(),
        window.API.getMyOrders()
      ]);

      const statOrders = document.getElementById('stat-orders-count');
      const statSpent = document.getElementById('stat-total-spent');
      if (statOrders) statOrders.textContent = profileData.stats.orderCount;
      if (statSpent) statSpent.textContent = window.UI.formatCurrency(profileData.stats.totalSpent);

      this.renderOrdersHistory(ordersData.orders);
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    }
  },

  renderOrdersHistory(orders) {
    const listEl = document.getElementById('dashboard-orders-list');
    if (!listEl) return;

    if (!orders || orders.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--color-text-muted); font-size: 0.875rem;">
          You haven't placed any orders yet.
        </div>
      `;
      return;
    }

    listEl.innerHTML = orders.map(order => {
      const itemsPreviewHtml = (order.items || []).map(item => `
        <img src="${item.image_url}" alt="${item.product_name}" title="${item.product_name} (${item.quantity}x)" />
      `).join('');

      return `
        <div class="order-history-card">
          <div class="order-card-header">
            <div>
              <span class="order-card-number">${order.order_number}</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: 0.5rem;">${window.UI.formatDate(order.created_at)}</span>
            </div>
            <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
          </div>

          <div class="order-card-items-preview">
            ${itemsPreviewHtml}
          </div>

          <div class="order-card-footer">
            <span>Payment: <strong>${order.payment_method}</strong></span>
            <span>Total: <strong style="color: var(--color-secondary); font-size: 0.95rem;">${window.UI.formatCurrency(order.total)}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.AuthModule = AuthModule;
