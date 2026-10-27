// API Client for Lumina E-Commerce

const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (window.appState && window.appState.token) {
      headers['Authorization'] = `Bearer ${window.appState.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Network request failed');
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params.sort && params.sort !== 'default') query.append('sort', params.sort);

    return this.request(`/products?${query.toString()}`);
  },

  async getCategories() {
    return this.request('/products/categories');
  },

  async getProduct(idOrSlug) {
    return this.request(`/products/${idOrSlug}`);
  },

  async submitReview(productId, reviewData) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Orders
  async createOrder(orderPayload) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
  },

  async getOrder(orderNumber) {
    return this.request(`/orders/${orderNumber}`);
  },

  async getMyOrders() {
    return this.request('/orders/user/my-orders');
  },

  async validateCoupon(code, subtotal) {
    return this.request('/orders/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  async getProfile() {
    return this.request('/auth/me');
  }
};

window.API = API;
