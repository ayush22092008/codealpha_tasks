// Central State for Pulse Social Media Platform

class SocialStore {
  constructor() {
    this.token = localStorage.getItem('pulse_token') || null;
    this.user = this.loadUser();
    this.activeFeedTab = 'for-you'; // 'for-you' | 'following'
    this.currentView = 'home'; // 'home' | 'profile'
    this.viewingProfile = null; // username string when in profile view
    this.profileTab = 'posts'; // 'posts' | 'likes'
    this.posts = [];
    this.listeners = [];
  }

  loadUser() {
    try {
      const data = localStorage.getItem('pulse_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  setAuth(user, token) {
    this.user = user;
    this.token = token;
    if (token) {
      localStorage.setItem('pulse_token', token);
      localStorage.setItem('pulse_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pulse_token');
      localStorage.removeItem('pulse_user');
    }
    this.notify('auth');
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify(event) {
    this.listeners.forEach(fn => fn(event, this));
  }
}

window.appState = new SocialStore();
