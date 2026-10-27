// Checkout & Order Processing Flow

const CheckoutModule = {
  dialogEl: null,
  successDialogEl: null,
  formEl: null,
  selectedPayment: 'Credit Card',
  isSubmitting: false,

  init() {
    this.dialogEl = document.getElementById('checkout-dialog');
    this.successDialogEl = document.getElementById('order-success-dialog');
    this.formEl = document.getElementById('checkout-form');

    this.bindEvents();
  },

  bindEvents() {
    // Close checkout dialog button
    const closeBtn = document.getElementById('btn-close-checkout');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.UI.closeDialog('checkout-dialog');
      });
    }

    // Close success dialog button
    const closeSuccessBtn = document.getElementById('btn-close-success');
    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener('click', () => {
        window.UI.closeDialog('order-success-dialog');
      });
    }

    // Payment method tabs
    const paymentTabs = document.querySelectorAll('.payment-tab-btn');
    paymentTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        paymentTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedPayment = tab.getAttribute('data-method');

        const cardFields = document.getElementById('card-fields-box');
        if (cardFields) {
          cardFields.style.display = this.selectedPayment === 'Credit Card' ? 'block' : 'none';
        }
      });
    });

    // Form submission
    if (this.formEl) {
      this.formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processOrder();
      });
    }
  },

  openCheckout() {
    if (window.appState.cart.length === 0) {
      window.UI.showToast('Please add items to your cart before proceeding to checkout.', 'error');
      return;
    }

    // Prefill form if user is signed in
    if (window.appState.user) {
      const u = window.appState.user;
      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      if (nameInput) nameInput.value = u.name || '';
      if (emailInput) emailInput.value = u.email || '';
    }

    this.renderSummary();
    window.UI.openDialog('checkout-dialog');
  },

  renderSummary() {
    const items = window.appState.cart;
    const totals = window.appState.getCartTotals();
    const listEl = document.getElementById('checkout-summary-items');

    if (listEl) {
      listEl.innerHTML = items.map(item => `
        <div class="summary-item-row">
          <img src="${item.image_url}" alt="${item.name}" />
          <div class="summary-item-name">
            <div>${item.name}</div>
            <div style="color: var(--color-text-muted); font-size: 0.75rem;">Qty: ${item.quantity}</div>
          </div>
          <div class="summary-item-price">${window.UI.formatCurrency(item.price * item.quantity)}</div>
        </div>
      `).join('');
    }

    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountEl = document.getElementById('checkout-discount');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = window.UI.formatCurrency(totals.subtotal);
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : window.UI.formatCurrency(totals.shipping);

    if (discountRow && discountEl) {
      if (totals.discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${window.UI.formatCurrency(totals.discount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (totalEl) totalEl.textContent = window.UI.formatCurrency(totals.total);
  },

  async processOrder() {
    if (this.isSubmitting) return;

    const name = document.getElementById('checkout-name').value;
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const zip = document.getElementById('checkout-zip').value;

    const submitBtn = document.getElementById('btn-submit-order');
    const originalText = submitBtn.innerHTML;

    try {
      this.isSubmitting = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div style="display: inline-block; width: 18px; height: 18px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        Processing Secure Payment...
      `;

      const couponCode = window.appState.appliedCoupon ? window.appState.appliedCoupon.code : null;

      const orderPayload = {
        customer: { name, email, phone, address, city, zip },
        items: window.appState.cart.map(item => ({ id: item.id, quantity: item.quantity })),
        payment: { method: this.selectedPayment },
        couponCode
      };

      const res = await window.API.createOrder(orderPayload);

      // Order created successfully!
      window.appState.clearCart();
      window.UI.closeDialog('checkout-dialog');
      this.renderOrderSuccess(res.order);
      window.UI.showToast('Order confirmed! Receipt generated.', 'success');
    } catch (err) {
      console.error('Order placement error:', err);
      window.UI.showToast(err.message || 'Payment failed. Please check your card information.', 'error');
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  },

  renderOrderSuccess(order) {
    const successBody = document.querySelector('.order-success-body');
    if (!successBody) return;

    successBody.innerHTML = `
      <div class="success-badge-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem;">Payment Confirmed!</h2>
      <p style="color: var(--color-text-muted); font-size: 0.875rem;">
        Thank you, <strong>${order.customerName}</strong>! We've sent a confirmation receipt to <strong>${order.customerEmail}</strong>.
      </p>

      <div class="order-receipt-box">
        <div class="receipt-row">
          <span>Order Reference:</span>
          <span class="order-number-display">${order.orderNumber}</span>
        </div>
        <div class="receipt-row">
          <span>Estimated Delivery:</span>
          <strong>2 - 4 Business Days</strong>
        </div>
        <div class="receipt-row">
          <span>Shipping Address:</span>
          <span>${order.shippingAddress}</span>
        </div>
        <div class="receipt-row">
          <span>Payment Method:</span>
          <span>${order.paymentMethod}</span>
        </div>
        <div class="receipt-total-row">
          <span>Total Paid:</span>
          <span style="color: var(--color-success);">${window.UI.formatCurrency(order.total)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem; width: 100%;">
        <button class="btn-secondary" style="flex: 1;" onclick="window.print()">
          Print Receipt
        </button>
        <button class="btn-primary" style="flex: 1;" onclick="UI.closeDialog('order-success-dialog')">
          Continue Shopping
        </button>
      </div>
    `;

    window.UI.openDialog('order-success-dialog');
  }
};

window.CheckoutModule = CheckoutModule;
