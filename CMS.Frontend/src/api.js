const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7005';
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP Error ${response.status}`);
  }

  return response.json();
}

// Products
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/api/products${query ? `?${query}` : ''}`);
};

export const getProductById = (id) => {
  return request(`/api/products/${id}`);
};

export const getProductStock = (id) => {
  return request(`/api/products/${id}/stock`);
};

export const getBestSellers = (limit = 8) => {
  return request(`/api/products/best-sellers?limit=${limit}`);
};

// Categories
export const getCategories = () => {
  return request('/api/categories');
};

// Brands
export const getBrands = () => {
  return request('/api/products/brands');
};

// Customer Auth
export const registerCustomer = (data) => {
  return request('/api/customerauth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const loginCustomer = (data) => {
  return request('/api/customerauth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Forgot Password
export const forgotPassword = (email) => {
  return request('/api/customerauth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const verifyResetCode = (email, code) => {
  return request('/api/customerauth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
};

export const resetPassword = (email, code, newPassword) => {
  return request('/api/customerauth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
};

export const getCustomerProfile = (id) => {
  return request(`/api/customerauth/profile/${id}`);
};

export const updateCustomerProfile = (id, data) => {
  return request(`/api/customerauth/profile/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const getCustomerAddresses = (customerId) => {
  return request(`/api/customerauth/profile/${customerId}/addresses`);
};

export const addCustomerAddress = (customerId, data) => {
  return request(`/api/customerauth/profile/${customerId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCustomerAddress = (customerId, addressId, data) => {
  return request(`/api/customerauth/profile/${customerId}/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCustomerAddress = (customerId, addressId) => {
  return request(`/api/customerauth/profile/${customerId}/addresses/${addressId}`, {
    method: 'DELETE',
  });
};

// Orders
export const createOrder = (data) => {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getCustomerOrders = (customerId) => {
  return request(`/api/orders/customer/${customerId}`);
};

export const verifyVnPayReturn = (queryString) => {
  return request(`/api/orders/vnpay-return?${queryString}`);
};

// Posts (Blog)
export const getPosts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/api/posts${query ? `?${query}` : ''}`);
};

export const getPostById = (id) => {
  return request(`/api/posts/${id}`);
};

// Banners
export const getBanners = (position = 'HomeHero') => {
  return request(`/api/banners?position=${position}`);
};

// Chat
export const getChatMessages = (customerId) => {
  return request(`/api/chat/${customerId}`);
};

export const sendChatMessage = (customerId, content) => {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ customerId, content }),
  });
};

export const getUnreadChatCount = (customerId) => {
  return request(`/api/chat/${customerId}/unread-count`);
};

export const markChatAsRead = (customerId) => {
  return request(`/api/chat/${customerId}/mark-read`, {
    method: 'POST',
  });
};

// Helper: get full image URL
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};
