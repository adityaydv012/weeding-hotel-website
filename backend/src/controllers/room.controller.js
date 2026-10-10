
import QRCode from 'qrcode';
import { z } from 'zod';

import { Room } from '../models/Room.js';
import { Hotel } from '../models/Hotel.js';
import { Order } from '../models/Order.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { randomToken, sha256 } from '../utils/hash.js';

// ============================================================
// VALIDATION
// ============================================================

const createSchema = z.object({
  hotelId: z.string().min(1),
  roomNumber: z.string().trim().min(1),
  floor: z.string().optional().default(''),
});

// ============================================================
// HELPERS
// ============================================================

function assertHotelAccess(user, hotelId) {
  if (
    user.role !== 'SUPER_ADMIN' &&
    String(user.hotelId) !== String(hotelId)
  ) {
    throw new ApiError(403, 'Hotel access denied');
  }
}

function getCustomerAppUrl() {
  const url = process.env.CUSTOMER_APP_URL;

  if (!url) {
    throw new ApiError(
      500,
      'CUSTOMER_APP_URL is not configured'
    );
  }

  return url.replace(/\/+$/, '');
}

function buildGuestQrUrl(rawToken) {
  return `${getCustomerAppUrl()}/order/${rawToken}`;
}

async function generateQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 600,
    errorCorrectionLevel: 'H',
  });
}

// ============================================================
// CREATE ROOM
// ============================================================

export const createRoom = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);

  assertHotelAccess(req.user, data.hotelId);

  const hotel = await Hotel.findById(data.hotelId);

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }

  const existingRoom = await Room.findOne({
    hotelId: data.hotelId,
    roomNumber: data.roomNumber,
  });

  if (existingRoom) {
    throw new ApiError(
      409,
      'A room with this number already exists'
    );
  }

  // Generate one token and store its hash.
  const rawToken = randomToken(24);
  const tokenHash = sha256(rawToken);

  const room = await Room.create({
    ...data,
    qrTokenHash: tokenHash,
  });

  const qrUrl = buildGuestQrUrl(rawToken);
  const qrDataUrl = await generateQrDataUrl(qrUrl);

  return res.status(201).json({
    success: true,
    room,
    qr: {
      url: qrUrl,
      dataUrl: qrDataUrl,
    },
  });
});

// ============================================================
// LIST ROOMS
// ============================================================

export const listRooms = asyncHandler(async (req, res) => {
  const hotelId =
    req.user.role === 'SUPER_ADMIN'
      ? req.query.hotelId
      : req.user.hotelId;

  if (!hotelId) {
    throw new ApiError(400, 'hotelId is required');
  }

  assertHotelAccess(req.user, String(hotelId));

  const rooms = await Room.find({ hotelId })
    .sort({ roomNumber: 1 })
    .lean();

  return res.json({
    success: true,
    rooms,
  });
});

// ============================================================
// LIST ORDERS FOR ONE ROOM
// ============================================================

export const listRoomOrders = asyncHandler(
  async (req, res) => {
    const { roomId } = req.params;

    const room = await Room.findById(roomId).lean();

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    assertHotelAccess(req.user, String(room.hotelId));

    const filter = {
      hotelId: room.hotelId,
      roomId: room._id,
    };

    if (req.query.status) {
      const allowedStatuses = [
        'NEW',
        'ACCEPTED',
        'PREPARING',
        'READY',
        'DELIVERED',
        'CANCELLED',
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        throw new ApiError(400, 'Invalid order status');
      }

      filter.orderStatus = req.query.status;
    }

    const requestedLimit = Number(req.query.limit) || 100;
    const limit = Math.min(
      Math.max(requestedLimit, 1),
      200
    );

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      room: {
        _id: room._id,
        roomNumber: room.roomNumber,
        floor: room.floor,
      },
      orders,
    });
  }
);

// ============================================================
// GENERATE / VIEW QR FOR AN EXISTING ROOM
// ============================================================

export const viewRoomQR = asyncHandler(
  async (req, res) => {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    assertHotelAccess(req.user, String(room.hotelId));

    if (!room.isActive) {
      throw new ApiError(
        400,
        'Cannot generate a QR for an inactive room'
      );
    }

    // Generate a fresh raw token.
    const rawToken = randomToken(24);

    // Hash and persist that exact token on this room.
    room.qrTokenHash = sha256(rawToken);
    await room.save();

    // Build the URL from the same raw token.
    const qrUrl = buildGuestQrUrl(rawToken);
    const qrDataUrl = await generateQrDataUrl(qrUrl);

    return res.status(200).json({
      success: true,
      room: {
        _id: room._id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        isActive: room.isActive,
      },
      qr: {
        url: qrUrl,
        dataUrl: qrDataUrl,
      },
      message:
        'QR code generated. Previously printed QR codes for this room are now invalid.',
    });
  }
);

// ============================================================
// REGENERATE QR
// ============================================================

export const regenerateRoomQR = viewRoomQR;
