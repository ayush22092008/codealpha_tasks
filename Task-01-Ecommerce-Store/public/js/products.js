// Products Catalog Rendering & Filtering

const ProductsModule = {
  gridEl: null,
  tabsEl: null,
  searchInput: null,
  priceSlider: null,
  priceValDisplay: null,
  sortSelect: null,
  itemCountBadge: null,

  init() {
    this.gridEl = document.getElementById('products-grid');
    this.tabsEl = document.getElementById('category-tabs');
    this.searchInput = document.getElementById('search-input');
    this.priceSlider = document.getElementById('price-slider');
    this.priceValDisplay = document.getElementById('price-val-display');
    this.sortSelect = document.getElementById('sort-select');
    this.itemCountBadge = document.getElementById('item-count-badge');

    this.bindEvents();
    this.loadCatalog();
  },

  bindEvents() {
    // Search input with debounce
    let debounceTimer;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.appState.filters.search = e.target.value;
        this.loadCatalog();
      }, 300);
    });

    // Price slider
    this.priceSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      this.priceValDisplay.textContent = `$${val}`;
      window.appState.filters.maxPrice = val;
    });

    this.priceSlider.addEventListener('change', () => {
      this.loadCatalog();
    });

    // Sort select
    this.sortSelect.addEventListener('change', (e) => {
      window.appState.filters.sort = e.target.value;
      this.loadCatalog();
    });

    // Clear filters button
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }
  },

  resetFilters() {
    window.appState.filters = {
      category: 'All',
      search: '',
      maxPrice: 350,
      sort: 'default'
    };
    this.searchInput.value = '';
    this.priceSlider.value = 350;
    this.priceValDisplay.textContent = '$350';
    this.sortSelect.value = 'default';
    this.loadCatalog();
  },

  async loadCatalog() {
    try {
      this.renderLoading();
      const [productsData, categoriesData] = await Promise.all([
        window.API.getProducts(window.appState.filters),
        window.API.getCategories()
      ]);

      window.appState.products = productsData.products;
      window.appState.categories = categoriesData.categories;

      this.renderCategoryTabs(categoriesData.categories, categoriesData.totalProducts);
      this.renderProducts(productsData.products);
    } catch (err) {
      console.error('Failed to load products:', err);
      this.gridEl.innerHTML = `
        <div class="catalog-empty">
          <h3>Failed to load products</h3>
          <p>Please check your connection and try again.</p>
          <button class="btn-primary" onclick="ProductsModule.loadCatalog()">Retry</button>
        </div>
      `;
    }
  },

  renderCategoryTabs(categories, totalCount) {
    if (!this.tabsEl) return;
    const currentCat = window.appState.filters.category;

    let html = `
      <button class="tab-btn ${currentCat === 'All' ? 'active' : ''}" data-category="All">
        All (${totalCount || 0})
      </button>
    `;

    categories.forEach(cat => {
      const isActive = currentCat.toLowerCase() === cat.category.toLowerCase();
      html += `
        <button class="tab-btn ${isActive ? 'active' : ''}" data-category="${cat.category}">
          ${cat.category} (${cat.count})
        </button>
      `;
    });

    this.tabsEl.innerHTML = html;

    // Attach click events to tabs
    this.tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        window.appState.filters.category = cat;
        this.tabsEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadCatalog();
      });
    });
  },

  renderLoading() {
    this.gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--color-text-muted);">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; font-size: 0.875rem;">Discovering items...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  },

  renderProducts(products) {
    if (this.itemCountBadge) {
      this.itemCountBadge.textContent = `${products.length} Products`;
    }

    if (!products || products.length === 0) {
      this.gridEl.innerHTML = `
        <div class="catalog-empty">
          <svg class="catalog-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3>No matching products found</h3>
          <p>Try modifying your search or clearing active filters.</p>
          <button class="btn-secondary" onclick="ProductsModule.resetFilters()">Clear All Filters</button>
        </div>
      `;
      return;
    }

    let html = '';
    products.forEach(p => {
      let badgeHtml = '';
      if (p.badge) {
        let badgeClass = 'product-badge';
        if (p.badge.toLowerCase().includes('sale')) badgeClass += ' sale';
        if (p.badge.toLowerCase().includes('best')) badgeClass += ' bestseller';
        badgeHtml = `<span class="${badgeClass}">${p.badge}</span>`;
      }

      const originalPriceHtml = p.original_price
        ? `<span class="original-price">${window.UI.formatCurrency(p.original_price)}</span>`
        : '';

      const isLowStock = p.stock <= 5;
      const stockText = isLowStock ? `Only ${p.stock} left!` : 'In Stock';
      const stockClass = isLowStock ? 'stock-indicator low' : 'stock-indicator';

      html += `
        <article class="product-card" data-id="${p.id}">
          <div class="product-media" onclick="DetailsModule.openProduct(${p.id})">
            ${badgeHtml}
            <img class="product-image" src="${p.image_url}" alt="${p.name}" loading="lazy" />
            <div class="quick-view-overlay">Quick Details</div>
          </div>
          <div class="product-content">
            <div class="product-category-row">
              <span>${p.category}</span>
              <div class="product-rating">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>${p.rating}</span>
                <span style="color: var(--color-text-light); font-weight: 400;">(${p.review_count})</span>
              </div>
            </div>
            
            <h3 class="product-title" onclick="DetailsModule.openProduct(${p.id})">${p.name}</h3>
            
            <div class="${stockClass}">
              <span class="stock-dot"></span>
              <span>${stockText}</span>
            </div>

            <p class="product-desc-snippet">${p.description}</p>
            
            <div class="product-footer">
              <div class="price-container">
                <span class="current-price">${window.UI.formatCurrency(p.price)}</span>
                ${originalPriceHtml}
              </div>
              <button class="btn-add-cart" onclick="ProductsModule.quickAddToCart(event, ${p.id})" title="Add to Cart" aria-label="Add ${p.name} to Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    this.gridEl.innerHTML = html;
  },

  quickAddToCart(e, productId) {
    e.stopPropagation();
    const product = window.appState.products.find(p => p.id === productId);
    if (product) {
      window.appState.addToCart(product, 1);
      window.UI.showToast(`Added "${product.name}" to cart!`, 'success');
    }
  }
};

window.ProductsModule = ProductsModule;
