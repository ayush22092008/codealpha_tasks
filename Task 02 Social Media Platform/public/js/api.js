// API Client for Pulse Social Platform

const API = {
  baseUrl: window.location.protocol === 'file:' ? 'http://localhost:4000/api' : '/api',


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
      const res = await fetch(url, config);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  async login(login, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    });
  },

  async register(username, name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, name, email, password })
    });
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Posts
  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.feed) query.append('feed', params.feed);
    if (params.user) query.append('user', params.user);
    if (params.likedBy) query.append('likedBy', params.likedBy);

    return this.request(`/posts?${query.toString()}`);
  },

  async createPost(content, image_url) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, image_url })
    });
  },

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  async toggleLike(postId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST'
    });
  },

  async getComments(postId) {
    return this.request(`/posts/${postId}/comments`);
  },

  async addComment(postId, content) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  // Users & Follows
  async getUser(username) {
    return this.request(`/users/${username}`);
  },

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async toggleFollow(username) {
    return this.request(`/users/${username}/follow`, {
      method: 'POST'
    });
  },

  async getWhoToFollow() {
    return this.request('/users/suggestions/who-to-follow');
  }
};

window.API = API;
