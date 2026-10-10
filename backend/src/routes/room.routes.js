
import { Router } from 'express';

import {
  createRoom,
  listRooms,
  listRoomOrders,
  viewRoomQR,
  regenerateRoomQR,
} from '../controllers/room.controller.js';

import {
  requireAuth,
  allowRoles,
} from '../middleware/auth.js';

const router = Router();

// All room routes require authentication.
router.use(requireAuth);

// List rooms.
router.get(
  '/',
  allowRoles('SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'),
  listRooms
);

// Create a room.
router.post(
  '/',
  allowRoles('SUPER_ADMIN', 'HOTEL_ADMIN'),
  createRoom
);

// List orders for a room.
router.get(
  '/:roomId/orders',
  allowRoles('SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'),
  listRoomOrders
);

// View QR.
// Generates a replacement because the original raw token
// is not recoverable from the stored hash.
router.get(
  '/:roomId/qr',
  allowRoles('SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'),
  viewRoomQR
);

// Explicit QR regeneration endpoint.
router.post(
  '/:roomId/qr/regenerate',
  allowRoles('SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'),
  regenerateRoomQR
);

export default router;
