
import axios from 'axios';

// ============================================================
// AXIOS INSTANCE
// ============================================================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'https://api.roseaman.in/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      const pathname = window.location.pathname;

      const isGuestRoute =
        pathname.startsWith('/guest/') ||
        pathname.startsWith('/room/') ||
        pathname.startsWith('/order/');

      if (!isGuestRoute && pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================

export async function loginAdmin(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export async function getCurrentAdmin() {
  const response = await api.get('/auth/me');
  return response.data;
}

// ============================================================
// ORDERS
// ============================================================

export async function getOrders({
  hotelId,
  status = '',
  limit = 100,
} = {}) {
  const response = await api.get('/orders', {
    params: {
      ...(hotelId ? { hotelId } : {}),
      ...(status ? { status } : {}),
      limit,
    },
  });

  return response.data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await api.patch(
    `/orders/${orderId}/status`,
    { status }
  );

  return response.data;
}

// ============================================================
// FOOD ITEMS
// ============================================================

export async function getFoodItems({
  hotelId,
  categoryId = '',
} = {}) {
  const response = await api.get('/food-items', {
    params: {
      ...(hotelId ? { hotelId } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
  });

  return response.data;
}

export async function createFoodItem(foodData) {
  const response = await api.post('/food-items', foodData);
  return response.data;
}

export async function updateFoodItem(foodId, foodData) {
  const response = await api.patch(
    `/food-items/${foodId}`,
    foodData
  );

  return response.data;
}

export async function deleteFoodItem(foodId) {
  const response = await api.delete(`/food-items/${foodId}`);
  return response.data;
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories({ hotelId } = {}) {
  const response = await api.get('/categories', {
    params: {
      ...(hotelId ? { hotelId } : {}),
    },
  });

  return response.data;
}

export async function createCategory(categoryData) {
  const response = await api.post('/categories', categoryData);
  return response.data;
}

export async function updateCategory(categoryId, categoryData) {
  const response = await api.patch(
    `/categories/${categoryId}`,
    categoryData
  );

  return response.data;
}

export async function deleteCategory(categoryId) {
  const response = await api.delete(
    `/categories/${categoryId}`
  );

  return response.data;
}

// ============================================================
// ROOMS
// ============================================================

export async function getRooms({ hotelId } = {}) {
  const response = await api.get('/rooms', {
    params: {
      ...(hotelId ? { hotelId } : {}),
    },
  });

  return response.data;
}

export async function createRoom(roomData) {
  const response = await api.post('/rooms', roomData);
  return response.data;
}

// ============================================================
// VIEW EXISTING QR
// ============================================================

// Does not regenerate or invalidate the existing token.
// The backend may return qr: null for rooms whose raw token
// is not available to reconstruct the original QR.
export async function getRoomQR(roomId) {
  const response = await api.get(`/rooms/${roomId}/qr`);
  return response.data;
}

// ============================================================
// EXPLICITLY REGENERATE QR
// ============================================================

// Generates a new token and invalidates the previous QR.
// Call only when the user explicitly chooses to regenerate.
export async function regenerateRoomQR(roomId) {
  const response = await api.post(
    `/rooms/${roomId}/qr/regenerate`
  );

  return response.data;
}

// ============================================================
// ROOM ORDERS
// ============================================================

export async function getRoomOrders(
  roomId,
  { status = '', limit = 100 } = {}
) {
  const response = await api.get(
    `/rooms/${roomId}/orders`,
    {
      params: {
        ...(status ? { status } : {}),
        limit,
      },
    }
  );

  return response.data;
}

// ============================================================
// PUBLIC GUEST MENU
// ============================================================

export async function getRoomMenu(roomToken) {
  if (!roomToken || typeof roomToken !== 'string') {
    throw new Error('A valid room QR token is required.');
  }

  const response = await api.get(
    `/public/rooms/${encodeURIComponent(roomToken)}`
  );

  return response.data;
}

// ============================================================
// PUBLIC ORDERING
// ============================================================

export async function createOrder(orderData) {
  const response = await api.post(
    '/public/orders',
    orderData
  );

  return response.data;
}

export async function getPublicOrder(
  orderId,
  trackingToken
) {
  const response = await api.get(
    `/public/orders/${orderId}`,
    {
      params: {
        token: trackingToken,
      },
    }
  );

  return response.data;
}

// ============================================================
// EVENTS
// ============================================================

export async function getEvents({ hotelId } = {}) {
  const response = await api.get('/events', {
    params: {
      ...(hotelId ? { hotelId } : {}),
    },
  });

  return response.data;
}

export async function getEvent(eventId) {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
}

export async function createEvent(eventData) {
  const response = await api.post('/events', eventData);
  return response.data;
}

export async function updateEvent(eventId, eventData) {
  const response = await api.patch(
    `/events/${eventId}`,
    eventData
  );

  return response.data;
}

export async function deleteEvent(eventId) {
  const response = await api.delete(`/events/${eventId}`);
  return response.data;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================


/* ============================================================
   HOTELS
============================================================ */

export async function getHotels() {
  const response = await api.get('/hotels');
  return response.data;
}

export async function getHotel(hotelId) {
  const response = await api.get(`/hotels/${hotelId}`);
  return response.data;
}

export async function createHotel(hotelData) {
  const response = await api.post('/hotels', hotelData);
  return response.data;
}

export async function updateHotel(hotelId, hotelData) {
  const response = await api.patch(
    `/hotels/${hotelId}`,
    hotelData
  );

  return response.data;
}

export async function deleteHotel(hotelId) {
  const response = await api.delete(`/hotels/${hotelId}`);
  return response.data;
}



export async function getUsers({ search = '', role = '', status = '' } = {}) {
  const response = await api.get('/users', {
    params: {
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    },
  });

  return response.data;
}

export async function getUser(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

export async function createUser(userData) {
  const response = await api.post('/users', userData);
  return response.data;
}

export async function updateUser(userId, userData) {
  const response = await api.patch(`/users/${userId}`, userData);
  return response.data;
}

export async function deactivateUser(userId) {
  const response = await api.patch(`/users/${userId}/deactivate`);
  return response.data;
}


export default api;
