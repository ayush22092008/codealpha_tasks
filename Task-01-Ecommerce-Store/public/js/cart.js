// Shopping Cart Drawer, Line Items, and Coupons

const CartModule = {
  drawerEl: null,
  backdropEl: null,
  itemsListEl: null,
  badgeEl: null,
  shippingMeterFillEl: null,
  shippingMeterTextEl: null,
  subtotalEl: null,
  discountRowEl: null,
  discountEl: null,
  shippingEl: null,
  totalEl: null,
  couponInput: null,
  couponTagContainer: null,

  init() {
    this.drawerEl = document.getElementById('cart-drawer');
    this.backdropEl = document.getElementById('cart-backdrop');
    this.itemsListEl = document.getElementById('cart-items-list');
    this.badgeEl = document.getElementById('cart-badge');
    this.shippingMeterFillEl = document.getElementById('shipping-meter-fill');
    this.shippingMeterTextEl = document.getElementById('shipping-meter-text');
    this.subtotalEl = document.getElementById('cart-subtotal');
    this.discountRowEl = document.getElementById('cart-discount-row');
    this.discountEl = document.getElementById('cart-discount');
    this.shippingEl = document.getElementById('cart-shipping');
    this.totalEl = document.getElementById('cart-total');
    this.couponInput = document.getElementById('coupon-input');
    this.couponTagContainer = document.getElementById('active-coupon-container');

    this.bindEvents();

    // Subscribe to state changes
    window.appState.subscribe((event) => {
      if (event === 'cart') {
        this.renderCart();
      }
    });

    this.renderCart();
  },

  bindEvents() {
    // Open cart drawer from header
    const cartBtn = document.getElementById('btn-open-cart');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => this.openCartDrawer());
    }

    // Close cart drawer
    const closeBtn = document.getElementById('btn-close-cart');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCartDrawer());
    }

    if (this.backdropEl) {
      this.backdropEl.addEventListener('click', () => this.closeCartDrawer());
    }

    // Coupon code apply
    const applyCouponBtn = document.getElementById('btn-apply-coupon');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => this.handleApplyCoupon());
    }

    if (this.couponInput) {
      this.couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleApplyCoupon();
        }
      });
    }

    // Checkout button inside drawer
    const checkoutBtn = document.getElementById('btn-drawer-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (window.appState.cart.length === 0) {
          window.UI.showToast('Your cart is empty. Add products before checking out!', 'info');
          return;
        }
        this.closeCartDrawer();
        window.CheckoutModule.openCheckout();
      });
    }
  },

  openCartDrawer() {
    if (this.drawerEl && this.backdropEl) {
      this.drawerEl.classList.add('open');
      this.backdropEl.classList.add('open');
    }
  },

  closeCartDrawer() {
    if (this.drawerEl && this.backdropEl) {
      this.drawerEl.classList.remove('open');
      this.backdropEl.classList.remove('open');
    }
  },

  async handleApplyCoupon() {
    const code = this.couponInput.value.trim();
    if (!code) return;

    const subtotal = window.appState.getCartSubtotal();
    try {
      const res = await window.API.validateCoupon(code, subtotal);
      window.appState.setCoupon(res);
      window.UI.showToast(res.message, 'success');
      this.couponInput.value = '';
    } catch (err) {
      window.UI.showToast(err.message || 'Invalid coupon code', 'error');
    }
  },

  removeCoupon() {
    window.appState.setCoupon(null);
    window.UI.showToast('Coupon removed.', 'info');
  },

  renderCart() {
    const items = window.appState.cart;
    const totals = window.appState.getCartTotals();
    const count = window.appState.getCartCount();

    // Update Header Badge
    if (this.badgeEl) {
      this.badgeEl.textContent = count;
      this.badgeEl.style.display = count > 0 ? 'flex' : 'none';
    }

    // Update Drawer Header Count
    const drawerCountEl = document.getElementById('cart-drawer-count');
    if (drawerCountEl) {
      drawerCountEl.textContent = `(${count})`;
    }

    // Update Free Shipping Progress Bar
    const threshold = 50.00;
    const remaining = Math.max(0, threshold - totals.subtotal);
    const progress = Math.min(100, (totals.subtotal / threshold) * 100);

    if (this.shippingMeterFillEl && this.shippingMeterTextEl) {
      this.shippingMeterFillEl.style.width = `${progress}%`;
      if (totals.subtotal === 0) {
        this.shippingMeterTextEl.innerHTML = `Add <strong>$${threshold.toFixed(2)}</strong> more for <strong>FREE Shipping</strong>`;
      } else if (remaining === 0 || totals.freeShippingBonus) {
        this.shippingMeterTextEl.innerHTML = `🎉 You unlocked <strong>FREE Standard Shipping</strong>!`;
        this.shippingMeterFillEl.style.width = '100%';
      } else {
        this.shippingMeterTextEl.innerHTML = `Add <strong>$${remaining.toFixed(2)}</strong> more for <strong>FREE Shipping</strong>`;
      }
    }

    // Render Line Items
    if (!items || items.length === 0) {
      this.itemsListEl.innerHTML = `
        <div class="cart-empty-state">
          <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h3>Your bag is empty</h3>
          <p>Explore our premium catalog and discover essentials made for you.</p>
          <button class="btn-primary" onclick="CartModule.closeCartDrawer()">Start Shopping</button>
        </div>
      `;
    } else {
      let html = '';
      items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        html += `
          <div class="cart-item">
            <img class="cart-item-img" src="${item.image_url}" alt="${item.name}" />
            <div class="cart-item-info">
              <span class="cart-item-title">${item.name}</span>
              <span class="cart-item-price">${window.UI.formatCurrency(item.price)} each</span>
              <div class="cart-item-stepper">
                <button class="cart-stepper-btn" onclick="CartModule.updateQty(${item.id}, ${item.quantity - 1})">−</button>
                <span class="cart-stepper-qty">${item.quantity}</span>
                <button class="cart-stepper-btn" onclick="CartModule.updateQty(${item.id}, ${item.quantity + 1})">+</button>
              </div>
            </div>
            <div class="cart-item-actions">
              <span class="cart-item-total">${window.UI.formatCurrency(itemTotal)}</span>
              <button class="btn-remove-item" onclick="CartModule.removeItem(${item.id})" title="Remove item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      });
      this.itemsListEl.innerHTML = html;
    }

    // Render Active Coupon Tag
    if (this.couponTagContainer) {
      if (window.appState.appliedCoupon) {
        const cp = window.appState.appliedCoupon;
        this.couponTagContainer.innerHTML = `
          <div class="active-coupon-tag">
            <span>🏷️ ${cp.code} (${cp.discount > 0 ? `-${window.UI.formatCurrency(cp.discount)}` : 'Free Shipping'})</span>
            <span class="btn-remove-coupon" onclick="CartModule.removeCoupon()">✕</span>
          </div>
        `;
      } else {
        this.couponTagContainer.innerHTML = '';
      }
    }

    // Update Totals
    if (this.subtotalEl) this.subtotalEl.textContent = window.UI.formatCurrency(totals.subtotal);

    if (this.discountRowEl && this.discountEl) {
      if (totals.discount > 0) {
        this.discountRowEl.style.display = 'flex';
        this.discountEl.textContent = `-${window.UI.formatCurrency(totals.discount)}`;
      } else {
        this.discountRowEl.style.display = 'none';
      }
    }

    if (this.shippingEl) {
      this.shippingEl.textContent = totals.shipping === 0 ? 'FREE' : window.UI.formatCurrency(totals.shipping);
    }

    if (this.totalEl) this.totalEl.textContent = window.UI.formatCurrency(totals.total);
  },

  updateQty(productId, newQty) {
    window.appState.updateCartQuantity(productId, newQty);
  },

  removeItem(productId) {
    window.appState.removeFromCart(productId);
    window.UI.showToast('Item removed from cart.', 'info');
  }
};

window.CartModule = CartModule;
