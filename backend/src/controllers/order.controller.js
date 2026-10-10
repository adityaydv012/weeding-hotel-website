import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const transitions = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function access(user, hotelId) { if (user.role !== 'SUPER_ADMIN' && String(user.hotelId) !== String(hotelId)) throw new ApiError(403, 'Hotel access denied'); }

export const listOrders = asyncHandler(async (req, res) => {
  const hotelId = req.user.role === 'SUPER_ADMIN' ? req.query.hotelId : req.user.hotelId; if (!hotelId) throw new ApiError(400, 'hotelId is required'); access(req.user, hotelId);
  const filter = { hotelId }; if (req.query.status) filter.orderStatus = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 100, 200)).lean();
  res.json({ success: true, orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id); if (!order) throw new ApiError(404, 'Order not found'); access(req.user, order.hotelId);
  const next = req.body.status; if (!transitions[order.orderStatus]?.includes(next)) throw new ApiError(400, `Invalid transition: ${order.orderStatus} -> ${next}`);
  order.orderStatus = next; if (next === 'DELIVERED') order.paymentStatus = 'PAID'; await order.save();
  res.json({ success: true, order });
});
