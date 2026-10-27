// Posts Feed, Compose, Like, and Comments Module

const PostsModule = {
  feedContainer: null,
  composerText: null,
  charCounter: null,
  imageInputRow: null,
  imageUrlInput: null,
  imagePreviewContainer: null,
  imagePreview: null,
  btnPost: null,

  init() {
    this.feedContainer = document.getElementById('posts-stream');
    this.composerText = document.getElementById('composer-textarea');
    this.charCounter = document.getElementById('char-counter');
    this.imageInputRow = document.getElementById('composer-image-input-row');
    this.imageUrlInput = document.getElementById('composer-image-url');
    this.imagePreviewContainer = document.getElementById('composer-image-preview-container');
    this.imagePreview = document.getElementById('composer-image-preview');
    this.btnPost = document.getElementById('btn-submit-post');

    this.bindEvents();
    this.loadFeed();
  },

  bindEvents() {
    // Character counter
    if (this.composerText) {
      this.composerText.addEventListener('input', () => {
        const len = this.composerText.value.length;
        if (this.charCounter) this.charCounter.textContent = `${len}/280`;
        if (this.btnPost) this.btnPost.disabled = len === 0 || len > 280;
      });
    }

    // Toggle Image URL input
    const btnToggleImg = document.getElementById('btn-toggle-image-input');
    if (btnToggleImg) {
      btnToggleImg.addEventListener('click', () => {
        const isVisible = this.imageInputRow.style.display === 'flex';
        this.imageInputRow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible && this.imageUrlInput) this.imageUrlInput.focus();
      });
    }

    // Image URL preview update
    if (this.imageUrlInput) {
      this.imageUrlInput.addEventListener('input', () => {
        const url = this.imageUrlInput.value.trim();
        if (url) {
          this.imagePreview.src = url;
          this.imagePreviewContainer.style.display = 'block';
        } else {
          this.imagePreviewContainer.style.display = 'none';
        }
      });
    }

    // Remove preview
    const btnRemovePreview = document.getElementById('btn-remove-preview');
    if (btnRemovePreview) {
      btnRemovePreview.addEventListener('click', () => {
        this.imageUrlInput.value = '';
        this.imagePreviewContainer.style.display = 'none';
      });
    }

    // Post Submit
    if (this.btnPost) {
      this.btnPost.addEventListener('click', () => this.handleCreatePost());
    }

    // Feed tabs (For You vs Following)
    document.querySelectorAll('.feed-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const feedType = tab.getAttribute('data-feed');
        window.appState.activeFeedTab = feedType;
        document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadFeed();
      });
    });
  },

  async loadFeed() {
    if (window.appState.currentView !== 'home') return;
    try {
      this.feedContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--color-text-muted);">
          <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;

      const data = await window.API.getPosts({ feed: window.appState.activeFeedTab });
      window.appState.posts = data.posts;
      this.renderPosts(data.posts);
    } catch (err) {
      console.error('Failed to load feed:', err);
      this.feedContainer.innerHTML = `
        <div class="empty-feed">
          <p>Failed to load feed. Please try again.</p>
        </div>
      `;
    }
  },

  renderPosts(posts) {
    if (!posts || posts.length === 0) {
      const msg = window.appState.activeFeedTab === 'following'
        ? 'No posts from people you follow yet. Follow creators to see their updates here!'
        : 'No posts available. Be the first to start a conversation!';
      this.feedContainer.innerHTML = `
        <div class="empty-feed">
          <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">Welcome to Pulse</p>
          <p style="font-size: 0.9rem;">${msg}</p>
        </div>
      `;
      return;
    }

    this.feedContainer.innerHTML = posts.map(post => this.generatePostHtml(post)).join('');
  },

  generatePostHtml(post) {
    const isLikedClass = post.is_liked ? 'liked' : '';
    const imgHtml = post.image_url
      ? `<img class="post-image-attachment" src="${post.image_url}" alt="Attachment" loading="lazy" />`
      : '';

    const deleteBtn = post.is_own
      ? `<button class="btn-delete-post" onclick="PostsModule.deletePost(${post.id})" title="Delete post">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>`
      : '';

    return `
      <article class="post-card" id="post-${post.id}">
        <img 
          class="post-avatar" 
          src="${post.author.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + post.author.username}" 
          alt="${post.author.name}" 
          onclick="ProfileModule.viewProfile('${post.author.username}')"
        />
        <div class="post-body">
          <div class="post-header">
            <div class="post-author-row">
              <span class="post-name" onclick="ProfileModule.viewProfile('${post.author.username}')">${post.author.name}</span>
              <span class="post-handle" onclick="ProfileModule.viewProfile('${post.author.username}')">@${post.author.username}</span>
              <span class="post-dot">·</span>
              <span class="post-time">${window.UI.formatTimeAgo(post.created_at)}</span>
            </div>
            ${deleteBtn}
          </div>

          <p class="post-text">${this.formatContent(post.content)}</p>
          ${imgHtml}

          <div class="post-actions">
            <!-- Comment Action -->
            <button class="post-action-btn comment-btn" onclick="PostsModule.toggleComments(${post.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span id="post-comments-count-${post.id}">${post.comments_count}</span>
            </button>

            <!-- Like Action -->
            <button class="post-action-btn like-btn ${isLikedClass}" id="like-btn-${post.id}" onclick="PostsModule.toggleLike(${post.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span id="post-likes-count-${post.id}">${post.likes_count}</span>
            </button>

            <!-- Share Action -->
            <button class="post-action-btn" onclick="navigator.clipboard.writeText(window.location.origin + '/#post-' + ${post.id}); UI.showToast('Post link copied to clipboard!');">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </div>

          <!-- Collapsible Comments Section -->
          <div class="comments-section" id="comments-section-${post.id}">
            <div class="comment-input-row">
              <input type="text" class="comment-input" id="comment-input-${post.id}" placeholder="Post your reply..." onkeydown="if(event.key==='Enter') PostsModule.addComment(${post.id})" />
              <button class="btn-submit-comment" onclick="PostsModule.addComment(${post.id})">Reply</button>
            </div>
            <div id="comments-list-${post.id}"></div>
          </div>
        </div>
      </article>
    `;
  },

  formatContent(text) {
    if (!text) return '';
    // Highlight hashtags and mentions
    return text
      .replace(/#(\w+)/g, '<span style="color: var(--color-primary); font-weight: 600;">#$1</span>')
      .replace(/@(\w+)/g, '<span style="color: var(--color-primary); font-weight: 600;">@$1</span>');
  },

  async handleCreatePost() {
    if (!window.appState.user) {
      window.AuthModule.openAuthModal('login');
      return;
    }

    const content = this.composerText.value.trim();
    const imageUrl = this.imageUrlInput ? this.imageUrlInput.value.trim() : null;

    if (!content) return;

    try {
      this.btnPost.disabled = true;
      const data = await window.API.createPost(content, imageUrl);
      window.UI.showToast('Post shared to Pulse!');

      // Reset composer
      this.composerText.value = '';
      if (this.imageUrlInput) this.imageUrlInput.value = '';
      if (this.imagePreviewContainer) this.imagePreviewContainer.style.display = 'none';
      if (this.charCounter) this.charCounter.textContent = '0/280';
      this.btnPost.disabled = true;

      // Prepend to current feed
      this.loadFeed();
    } catch (err) {
      window.UI.showToast(err.message || 'Failed to post.');
    } finally {
      this.btnPost.disabled = false;
    }
  },

  async toggleLike(postId) {
    if (!window.appState.user) {
      window.AuthModule.openAuthModal('login');
      return;
    }

    const btn = document.getElementById(`like-btn-${postId}`);
    const countSpan = document.getElementById(`post-likes-count-${postId}`);

    try {
      const res = await window.API.toggleLike(postId);
      btn.classList.toggle('liked', res.is_liked);
      countSpan.textContent = res.likes_count;
    } catch (err) {
      window.UI.showToast('Failed to update like: ' + err.message);
    }
  },

  async toggleComments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    const list = document.getElementById(`comments-list-${postId}`);
    const isOpen = section.classList.contains('open');

    if (isOpen) {
      section.classList.remove('open');
      return;
    }

    section.classList.add('open');
    list.innerHTML = `<div style="font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem 0;">Loading replies...</div>`;

    try {
      const data = await window.API.getComments(postId);
      if (!data.comments || data.comments.length === 0) {
        list.innerHTML = `<div style="font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem 0;">No replies yet. Be the first!</div>`;
        return;
      }

      list.innerHTML = data.comments.map(c => `
        <div class="comment-item">
          <img class="comment-avatar" src="${c.author.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + c.author.username}" alt="${c.author.name}" />
          <div class="comment-bubble">
            <span class="comment-author" onclick="ProfileModule.viewProfile('${c.author.username}')">${c.author.name}</span>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: 4px;">${window.UI.formatTimeAgo(c.created_at)}</span>
            <p style="margin-top: 2px;">${c.content}</p>
          </div>
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = `<div style="color: var(--color-danger); font-size: 0.8rem;">Failed to load replies.</div>`;
    }
  },

  async addComment(postId) {
    if (!window.appState.user) {
      window.AuthModule.openAuthModal('login');
      return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    try {
      const res = await window.API.addComment(postId, content);
      input.value = '';
      document.getElementById(`post-comments-count-${postId}`).textContent = res.comments_count;

      // Append new comment to list
      const list = document.getElementById(`comments-list-${postId}`);
      const newCommentHtml = `
        <div class="comment-item">
          <img class="comment-avatar" src="${res.comment.author.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + res.comment.author.username}" alt="${res.comment.author.name}" />
          <div class="comment-bubble">
            <span class="comment-author">${res.comment.author.name}</span>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: 4px;">just now</span>
            <p style="margin-top: 2px;">${res.comment.content}</p>
          </div>
        </div>
      `;

      if (list.innerHTML.includes('No replies yet')) {
        list.innerHTML = newCommentHtml;
      } else {
        list.insertAdjacentHTML('beforeend', newCommentHtml);
      }
    } catch (err) {
      window.UI.showToast(err.message || 'Failed to post reply.');
    }
  },

  async deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await window.API.deletePost(postId);
      const el = document.getElementById(`post-${postId}`);
      if (el) el.remove();
      window.UI.showToast('Post deleted.');
    } catch (err) {
      window.UI.showToast(err.message || 'Failed to delete post.');
    }
  }
};

window.PostsModule = PostsModule;
