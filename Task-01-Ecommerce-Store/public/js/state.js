// Central State Store for Lumina E-Commerce

class Store {
  constructor() {
    this.cart = this.loadCart();
    this.token = localStorage.getItem('lumina_token') || null;
    this.user = this.loadUser();
    this.appliedCoupon = this.loadCoupon();
    this.filters = {
      category: 'All',
      search: '',
      maxPrice: 350,
      sort: 'default'
    };
    this.products = [];
    this.categories = [];
    this.listeners = [];
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('lumina_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCart() {
    localStorage.setItem('lumina_cart', JSON.stringify(this.cart));
    this.notify('cart');
  }

  loadUser() {
    try {
      const saved = localStorage.getItem('lumina_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  loadCoupon() {
    try {
      const saved = localStorage.getItem('lumina_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  setCoupon(coupon) {
    this.appliedCoupon = coupon;
    if (coupon) {
      localStorage.setItem('lumina_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('lumina_coupon');
    }
    this.notify('cart');
  }

  setAuth(user, token) {
    this.user = user;
    this.token = token;
    if (token) {
      localStorage.setItem('lumina_token', token);
      localStorage.setItem('lumina_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lumina_token');
      localStorage.removeItem('lumina_user');
    }
    this.notify('auth');
  }

  addToCart(product, quantity = 1) {
    const existingIndex = this.cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: quantity,
        stock: product.stock
      });
    }
    this.saveCart();
  }

  updateCartQuantity(productId, quantity) {
    const item = this.cart.find(i => i.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.setCoupon(null);
    this.saveCart();
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartTotals() {
    const subtotal = this.getCartSubtotal();
    let discount = 0;
    let freeShippingBonus = false;

    if (this.appliedCoupon) {
      if (this.appliedCoupon.code === 'WELCOME10') {
        discount = Number((subtotal * 0.10).toFixed(2));
      } else if (this.appliedCoupon.code === 'SAVE20' && subtotal >= 75) {
        discount = 20.00;
      } else if (this.appliedCoupon.code === 'FREESHIP') {
        freeShippingBonus = true;
      }
    }

    const shipping = (subtotal >= 50 || freeShippingBonus || subtotal === 0) ? 0 : 9.99;
    const total = Math.max(0, subtotal - discount + shipping);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(total.toFixed(2)),
      freeShippingBonus
    };
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify(eventType) {
    this.listeners.forEach(fn => fn(eventType, this));
  }
}

window.appState = new Store();
