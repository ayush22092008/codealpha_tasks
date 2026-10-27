// Product Details Modal, Specs, and Customer Reviews

const DetailsModule = {
  dialogEl: null,
  currentProduct: null,
  selectedQty: 1,
  selectedRating: 5,

  init() {
    this.dialogEl = document.getElementById('product-detail-dialog');
    this.bindEvents();
  },

  bindEvents() {
    // Close button
    const closeBtn = document.getElementById('btn-close-details');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.UI.closeDialog('product-detail-dialog');
      });
    }

    // Star rating picker in review form
    const starPicker = document.getElementById('review-star-picker');
    if (starPicker) {
      starPicker.addEventListener('click', (e) => {
        const star = e.target.closest('.star');
        if (star) {
          const val = parseInt(star.getAttribute('data-value'), 10);
          this.setReviewRating(val);
        }
      });
    }

    // Submit review form
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReview();
      });
    }
  },

  setReviewRating(rating) {
    this.selectedRating = rating;
    const stars = document.querySelectorAll('#review-star-picker .star');
    stars.forEach(s => {
      const val = parseInt(s.getAttribute('data-value'), 10);
      if (val <= rating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  },

  async openProduct(productId) {
    try {
      this.selectedQty = 1;
      window.UI.openDialog('product-detail-dialog');

      const modalBody = document.querySelector('.details-modal-body');
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; color: var(--color-text-muted);">
          <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p style="margin-top: 1rem;">Loading product details...</p>
        </div>
      `;

      const data = await window.API.getProduct(productId);
      this.currentProduct = data.product;
      this.renderProductDetails(data.product);
    } catch (err) {
      console.error('Failed to load product details:', err);
      window.UI.showToast('Failed to load product details.', 'error');
      window.UI.closeDialog('product-detail-dialog');
    }
  },

  renderProductDetails(product) {
    const modalBody = document.querySelector('.details-modal-body');

    // Specs rendering
    let specsHtml = '';
    const specsEntries = Object.entries(product.specs || {});
    if (specsEntries.length > 0) {
      specsHtml = `
        <div class="specs-container">
          <div class="specs-title">Key Specifications</div>
          <div class="specs-grid">
            ${specsEntries.map(([k, v]) => `
              <div class="spec-item">
                <span class="spec-key">${k}</span>
                <span class="spec-val">${v}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Reviews rendering
    let reviewsListHtml = '';
    if (product.reviews && product.reviews.length > 0) {
      reviewsListHtml = product.reviews.map(rev => `
        <div class="review-card">
          <div class="review-card-top">
            <span class="review-author">${rev.user_name}</span>
            <span class="review-date">${window.UI.formatDate(rev.created_at)}</span>
          </div>
          <div class="stars-gold" style="margin-bottom: 6px;">
            ${window.UI.renderStars(rev.rating)}
          </div>
          <p class="review-comment">${rev.comment}</p>
        </div>
      `).join('');
    } else {
      reviewsListHtml = `
        <div style="grid-column: 1 / -1; color: var(--color-text-muted); font-size: 0.875rem; font-style: italic;">
          No customer reviews yet. Be the first to share your thoughts!
        </div>
      `;
    }

    const discountTagHtml = product.original_price
      ? `<span class="details-discount-tag">Save ${(100 - (product.price / product.original_price * 100)).toFixed(0)}%</span>`
      : '';

    const originalPriceHtml = product.original_price
      ? `<span class="details-original-price">${window.UI.formatCurrency(product.original_price)}</span>`
      : '';

    modalBody.innerHTML = `
      <div class="details-layout">
        <!-- Gallery -->
        <div class="details-gallery">
          ${product.badge ? `<span class="details-badge">${product.badge}</span>` : ''}
          <img class="details-main-image" src="${product.image_url}" alt="${product.name}" />
        </div>

        <!-- Info -->
        <div class="details-info">
          <span class="details-category">${product.category}</span>
          <h2 class="details-title">${product.name}</h2>
          
          <div class="details-rating-row">
            <div class="stars-gold">
              ${window.UI.renderStars(product.rating)}
            </div>
            <span style="font-weight: 700;">${product.rating}</span>
            <span style="color: var(--color-text-light);">•</span>
            <span style="color: var(--color-text-muted);">${product.review_count} Customer Ratings</span>
          </div>

          <div class="details-price-row">
            <span class="details-price">${window.UI.formatCurrency(product.price)}</span>
            ${originalPriceHtml}
            ${discountTagHtml}
          </div>

          <div class="stock-indicator ${product.stock <= 5 ? 'low' : ''}">
            <span class="stock-dot"></span>
            <span>${product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}</span>
          </div>

          <p class="details-description">${product.description}</p>

          ${specsHtml}

          <!-- Quantity Stepper & Add to Cart -->
          <div class="details-actions-row">
            <div class="qty-stepper">
              <button class="qty-btn" onclick="DetailsModule.changeQty(-1)">−</button>
              <span class="qty-display" id="detail-qty-val">1</span>
              <button class="qty-btn" onclick="DetailsModule.changeQty(1)">+</button>
            </div>
            <button class="btn-add-main" onclick="DetailsModule.addToCartFromDetails()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Add to Cart
            </button>
            <button class="btn-buy-now" onclick="DetailsModule.buyNowFromDetails()">
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <!-- Customer Reviews Section -->
      <section class="reviews-section">
        <div class="reviews-header">
          <h3 class="reviews-title">Customer Feedback & Reviews</h3>
          <span style="font-size: 0.875rem; color: var(--color-text-muted);">${product.reviews ? product.reviews.length : 0} Total Reviews</span>
        </div>

        <div class="reviews-grid">
          ${reviewsListHtml}
        </div>

        <!-- Add Review Form -->
        <div class="review-form-card">
          <h4>Write a Review</h4>
          <form id="review-form">
            <div class="form-group">
              <label class="form-label">Your Rating</label>
              <div class="star-rating-picker" id="review-star-picker">
                <span class="star active" data-value="1">★</span>
                <span class="star active" data-value="2">★</span>
                <span class="star active" data-value="3">★</span>
                <span class="star active" data-value="4">★</span>
                <span class="star active" data-value="5">★</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Your Name</label>
              <input type="text" id="review-user-name" class="form-control" required placeholder="e.g. Jordan Smith" />
            </div>

            <div class="form-group">
              <label class="form-label">Your Review</label>
              <textarea id="review-comment" class="form-control" rows="3" required placeholder="What did you like or dislike about this product?"></textarea>
            </div>

            <button type="submit" class="btn-primary" style="font-size: 0.875rem; padding: 0.6rem 1.5rem;">
              Submit Review
            </button>
          </form>
        </div>
      </section>
    `;

    // Re-bind review events for freshly rendered form
    this.bindEvents();
    if (window.appState && window.appState.user) {
      const nameInput = document.getElementById('review-user-name');
      if (nameInput) nameInput.value = window.appState.user.name;
    }
  },

  changeQty(delta) {
    const nextVal = this.selectedQty + delta;
    if (nextVal >= 1 && nextVal <= (this.currentProduct ? this.currentProduct.stock : 99)) {
      this.selectedQty = nextVal;
      const display = document.getElementById('detail-qty-val');
      if (display) display.textContent = this.selectedQty;
    }
  },

  addToCartFromDetails() {
    if (!this.currentProduct) return;
    window.appState.addToCart(this.currentProduct, this.selectedQty);
    window.UI.showToast(`Added ${this.selectedQty}x "${this.currentProduct.name}" to your cart!`, 'success');
    window.UI.closeDialog('product-detail-dialog');
    window.CartModule.openCartDrawer();
  },

  buyNowFromDetails() {
    if (!this.currentProduct) return;
    window.appState.addToCart(this.currentProduct, this.selectedQty);
    window.UI.closeDialog('product-detail-dialog');
    window.CheckoutModule.openCheckout();
  },

  async submitReview() {
    if (!this.currentProduct) return;
    const nameInput = document.getElementById('review-user-name');
    const commentInput = document.getElementById('review-comment');

    if (!nameInput.value || !commentInput.value) {
      window.UI.showToast('Please provide your name and review comment.', 'error');
      return;
    }

    try {
      await window.API.submitReview(this.currentProduct.id, {
        userName: nameInput.value,
        rating: this.selectedRating,
        comment: commentInput.value
      });

      window.UI.showToast('Thank you! Your review was posted.', 'success');
      // Refresh the product details modal
      this.openProduct(this.currentProduct.id);
    } catch (err) {
      window.UI.showToast(err.message || 'Failed to submit review.', 'error');
    }
  }
};

window.DetailsModule = DetailsModule;
