import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
'https://api.roseaman.in/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getRoomMenu(roomToken) {
  const response = await api.get(
    `/public/rooms/${roomToken}`
  );

  return response.data;
}

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

export default api;