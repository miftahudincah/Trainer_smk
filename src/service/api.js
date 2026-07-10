// service/api.js
// ============================================================
// BASE URL - Backend API (Vercel Production)
// ============================================================
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-trainer.vercel.app';

// ============================================================
// HELPER: API Fetch dengan Error Handling
// ============================================================
const apiFetch = async (endpoint, options = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ API Error (${endpoint}):`, error);
    throw error;
  }
};

// ============================================================
// HELPER: Upload File via FormData
// ============================================================
const uploadFile = async (url, formData) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Upload Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

// ============================================================
// HELPER: Get Avatar URL
// ============================================================
export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return avatarUrl;
};

// ============================================================
// HELPER: Check if string is Email
// ============================================================
const isEmail = (str) => {
  if (!str) return false;
  return str.includes('@') && str.includes('.');
};

// ============================================================
// PRODUCTS API
// ============================================================
export const productAPI = {
  // Get all products
  getAll: async () => {
    const response = await apiFetch('/api/products');
    return response.data || [];
  },

  // Get single product by ID
  getById: async (id) => {
    const response = await apiFetch(`/api/products/${id}`);
    return response.data;
  },

  // Create new product
  create: async (productData) => {
    const response = await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response.data;
  },

  // Update product
  update: async (id, productData) => {
    const response = await apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await apiFetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Upload product images (via FormData)
  uploadImages: async (productId, formData) => {
    const url = `${BACKEND_URL}/api/products/${productId}/images`;
    const data = await uploadFile(url, formData);
    return data.data || { images: [] };
  },

  // Delete product image
  deleteImage: async (productId, imageIndex) => {
    const response = await apiFetch(`/api/products/${productId}/images/${imageIndex}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  // Get main image for product
  getMainImage: (product) => {
    if (!product) return 'https://via.placeholder.com/300x200/ff9100/fff?text=No+Image';
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    if (product.image_url) {
      return product.image_url;
    }
    return 'https://via.placeholder.com/300x200/ff9100/fff?text=No+Image';
  },

  // Get all product images
  getImages: (product) => {
    if (!product) return [];
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls;
    }
    if (product.image_url) {
      return [product.image_url];
    }
    return [];
  },
};

// ============================================================
// COMMENTS / RATINGS API
// ============================================================
export const commentsAPI = {
  /**
   * Get comments for a product
   * @param {string} productId - Product ID
   * @param {object} options - { page, limit, sort }
   * @returns {Promise<object>} - { data, count, total }
   */
  getByProduct: async (productId, options = {}) => {
    if (!productId) throw new Error('Product ID wajib diisi!');
    
    const { page = 1, limit = 10, sort = 'newest' } = options;
    const queryParams = new URLSearchParams({
      page,
      limit,
      sort
    });
    
    const response = await apiFetch(`/api/comments/product/${productId}?${queryParams}`);
    return response.data || { data: [], count: 0, total: 0 };
  },

  /**
   * Get comment statistics for a product
   * @param {string} productId - Product ID
   * @returns {Promise<object>} - { total, average, distribution }
   */
  getStats: async (productId) => {
    if (!productId) throw new Error('Product ID wajib diisi!');
    
    const response = await apiFetch(`/api/comments/product/${productId}/stats`);
    return response.data || { total: 0, average: 0, distribution: {} };
  },

  /**
   * Create a new comment
   * @param {object} commentData - { product_id, user_id, user_email, rating, comment, images }
   * @returns {Promise<object>} - Created comment
   */
  create: async (commentData) => {
    if (!commentData.product_id) throw new Error('Product ID wajib diisi!');
    if (!commentData.user_id) throw new Error('User ID wajib diisi!');
    if (!commentData.rating) throw new Error('Rating wajib diisi!');
    if (!commentData.comment) throw new Error('Komentar wajib diisi!');
    
    const response = await apiFetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return response.data;
  },

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {object} commentData - { rating, comment, images }
   * @returns {Promise<object>} - Updated comment
   */
  update: async (commentId, commentData) => {
    if (!commentId) throw new Error('Comment ID wajib diisi!');
    
    const response = await apiFetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
    return response.data;
  },

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<object>} - Response
   */
  delete: async (commentId) => {
    if (!commentId) throw new Error('Comment ID wajib diisi!');
    
    const response = await apiFetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    return response;
  },

  /**
   * Like a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Response
   */
  like: async (commentId, userId) => {
    if (!commentId) throw new Error('Comment ID wajib diisi!');
    if (!userId) throw new Error('User ID wajib diisi!');
    
    const response = await apiFetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    return response.data;
  },

  /**
   * Unlike a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Response
   */
  unlike: async (commentId, userId) => {
    if (!commentId) throw new Error('Comment ID wajib diisi!');
    if (!userId) throw new Error('User ID wajib diisi!');
    
    const response = await apiFetch(`/api/comments/${commentId}/unlike`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    return response.data;
  },

  /**
   * Report a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @param {string} reason - Report reason
   * @returns {Promise<object>} - Response
   */
  report: async (commentId, userId, reason) => {
    if (!commentId) throw new Error('Comment ID wajib diisi!');
    if (!userId) throw new Error('User ID wajib diisi!');
    if (!reason) throw new Error('Alasan report wajib diisi!');
    
    const response = await apiFetch(`/api/comments/${commentId}/report`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, reason }),
    });
    return response.data;
  },
};

// ============================================================
// MESSAGES / CHAT API
// ============================================================
export const messagesAPI = {
  // Get all conversations for user
  getConversations: async (userId) => {
    const response = await apiFetch(`/api/messages/conversations/${userId}`);
    return response.data || [];
  },

  // Get messages between two users
  getMessages: async (userId, partnerId) => {
    const response = await apiFetch(`/api/messages/${userId}/${partnerId}`);
    return response.data || [];
  },

  // Send message
  send: async (messageData) => {
    const response = await apiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (userId, partnerId) => {
    const response = await apiFetch('/api/messages/read', {
      method: 'PUT',
      body: JSON.stringify({ userId, partnerId }),
    });
    return response.data;
  },

  // Delete message
  delete: async (messageId) => {
    const response = await apiFetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Get unread count
  getUnreadCount: async (userId) => {
    const response = await apiFetch(`/api/messages/unread/${userId}`);
    return response.data?.unreadCount || 0;
  },

  // Get unread count with specific partner
  getUnreadWithPartner: async (userId, partnerId) => {
    const response = await apiFetch(`/api/messages/unread/${userId}/${partnerId}`);
    return response.data?.unreadCount || 0;
  },
};

// ============================================================
// ORDERS API
// ============================================================
export const ordersAPI = {
  // Get orders by user ID (pembeli)
  getByUser: async (userId) => {
    const response = await apiFetch(`/api/orders/user/${userId}`);
    return response.data || [];
  },

  // Get orders by seller ID (penjual)
  getBySeller: async (sellerId) => {
    const response = await apiFetch(`/api/orders/seller/${sellerId}`);
    return response.data || [];
  },

  // Get single order
  getById: async (orderId) => {
    const response = await apiFetch(`/api/orders/${orderId}`);
    return response.data;
  },

  // Get orders by status
  getByStatus: async (status) => {
    const response = await apiFetch(`/api/orders/status/${status}`);
    return response.data || [];
  },

  // Create order
  create: async (orderData) => {
    const response = await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response.data;
  },

  // Update order status
  updateStatus: async (orderId, status) => {
    const response = await apiFetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data;
  },

  // Update order (full)
  update: async (orderId, orderData) => {
    const response = await apiFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
    return response.data;
  },

  // Delete order
  delete: async (orderId) => {
    const response = await apiFetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Upload payment proof
  uploadPaymentProof: async (orderId, formData) => {
    const url = `${BACKEND_URL}/api/orders/${orderId}/payment`;
    const data = await uploadFile(url, formData);
    return data.data;
  },
};

// ============================================================
// USERS API (LENGKAP DENGAN AVATAR - SUPPORT EMAIL)
// ============================================================
export const usersAPI = {
  // Get all users (hanya untuk developer)
  getAll: async () => {
    const response = await apiFetch('/api/users');
    return response.data || [];
  },

  // Get user by ID or UID (support email juga)
  getById: async (id) => {
    if (!id) throw new Error('User ID wajib diisi!');
    const response = await apiFetch(`/api/users/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Get user by email
  getByEmail: async (email) => {
    if (!email) throw new Error('Email wajib diisi!');
    const response = await apiFetch(`/api/users/email/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Create user
  create: async (userData) => {
    const response = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  // Update user role (hanya untuk developer)
  updateRole: async (userId, role) => {
    if (!userId) throw new Error('User ID wajib diisi!');
    const response = await apiFetch(`/api/users/${encodeURIComponent(userId)}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    return response.data;
  },

  // Update user profile - SUPPORT EMAIL
  update: async (userId, userData) => {
    if (!userId) throw new Error('User ID wajib diisi!');
    
    // Jika userId mengandung @, itu adalah email
    const identifier = isEmail(userId) ? userId : userId;
    
    const response = await apiFetch(`/api/users/${encodeURIComponent(identifier)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  // Delete user (hanya untuk developer)
  delete: async (userId) => {
    if (!userId) throw new Error('User ID wajib diisi!');
    const response = await apiFetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return response;
  },

  // ============================================================
  // AVATAR FUNCTIONS (VIA BACKEND API - SUPPORT EMAIL)
  // ============================================================

  /**
   * Upload avatar via backend API
   * @param {File} file - File avatar
   * @param {string} email - Email user
   * @returns {Promise<string>} - Avatar URL
   */
  uploadAvatar: async (file, email) => {
    if (!file) throw new Error('File tidak ditemukan!');
    if (!email) throw new Error('Email wajib diisi!');

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('email', email);

    const url = `${BACKEND_URL}/api/users/avatar/email`;
    const data = await uploadFile(url, formData);
    return data.data?.avatar_url || null;
  },

  /**
   * Delete avatar via backend API
   * @param {string} email - Email user
   * @returns {Promise<object>} - Response data
   */
  deleteAvatar: async (email) => {
    if (!email) throw new Error('Email wajib diisi!');
    const response = await apiFetch(`/api/users/${encodeURIComponent(email)}/avatar`, {
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Get avatar URL via backend API
   * @param {string} email - Email user
   * @returns {Promise<string>} - Avatar URL
   */
  getAvatar: async (email) => {
    if (!email) throw new Error('Email wajib diisi!');
    const response = await apiFetch(`/api/users/${encodeURIComponent(email)}/avatar`);
    return response.data?.avatar_url || null;
  },
};

// ============================================================
// SETTINGS API
// ============================================================
export const settingsAPI = {
  // Get settings
  get: async () => {
    const response = await apiFetch('/api/settings');
    return response.data;
  },

  // Update settings (hanya untuk developer)
  update: async (settingsData) => {
    const response = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
    return response.data;
  },

  // Upload store logo
  uploadLogo: async (formData) => {
    const url = `${BACKEND_URL}/api/settings/logo`;
    const data = await uploadFile(url, formData);
    return data.data;
  },
};

// ============================================================
// HEALTH API
// ============================================================
export const healthAPI = {
  // Check API health
  check: async () => {
    const response = await apiFetch('/api/health');
    return response;
  },

  // Get API status
  getStatus: async () => {
    const response = await apiFetch('/');
    return response;
  },
};

// ============================================================
// FORMATTING HELPERS
// ============================================================
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  const now = new Date();
  const msgDate = new Date(date);
  const diff = now - msgDate;

  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari lalu`;
  return formatDate(date);
};

// ============================================================
// WISHLIST HELPERS (Local Storage)
// ============================================================
export const wishlistAPI = {
  get: () => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  },

  save: (wishlist) => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  },

  add: (product) => {
    const wishlist = wishlistAPI.get();
    const exists = wishlist.some(item => item.id === product.id);
    if (!exists) {
      wishlist.push(product);
      wishlistAPI.save(wishlist);
    }
    return wishlist;
  },

  remove: (productId) => {
    const wishlist = wishlistAPI.get();
    const filtered = wishlist.filter(item => item.id !== productId);
    wishlistAPI.save(filtered);
    return filtered;
  },

  isWishlisted: (productId) => {
    const wishlist = wishlistAPI.get();
    return wishlist.some(item => item.id === productId);
  },

  toggle: (product) => {
    const wishlist = wishlistAPI.get();
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      return wishlistAPI.remove(product.id);
    } else {
      return wishlistAPI.add(product);
    }
  },
};

// ============================================================
// CART HELPERS (Local Storage)
// ============================================================
export const cartAPI = {
  get: () => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  },

  save: (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    return cart;
  },

  add: (product, quantity = 1) => {
    const cart = cartAPI.get();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    cartAPI.save(cart);
    return cart;
  },

  remove: (productId) => {
    const cart = cartAPI.get();
    const filtered = cart.filter(item => item.id !== productId);
    cartAPI.save(filtered);
    return filtered;
  },

  updateQuantity: (productId, quantity) => {
    const cart = cartAPI.get();
    const item = cart.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        return cartAPI.remove(productId);
      }
      item.quantity = quantity;
      cartAPI.save(cart);
    }
    return cart;
  },

  clear: () => {
    cartAPI.save([]);
    return [];
  },

  getTotalItems: () => {
    const cart = cartAPI.get();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    const cart = cartAPI.get();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getSelectedTotal: (selectedIds) => {
    const cart = cartAPI.get();
    return cart
      .filter(item => selectedIds.includes(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getSelectedCount: (selectedIds) => {
    const cart = cartAPI.get();
    return cart
      .filter(item => selectedIds.includes(item.id))
      .reduce((total, item) => total + item.quantity, 0);
  },
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
  productAPI,
  commentsAPI,
  messagesAPI,
  ordersAPI,
  usersAPI,
  settingsAPI,
  healthAPI,
  wishlistAPI,
  cartAPI,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  BACKEND_URL,
  getAvatarUrl,
};