import { z } from 'zod';

import { Room } from '../models/Room.js';
import { Category } from '../models/Category.js';
import { FoodItem } from '../models/FoodItem.js';
import { Order } from '../models/Order.js';
import { Event } from '../models/Event.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { sha256 } from '../utils/hash.js';

import { buildOrder } from '../services/order.service.js';

const orderSchema = z.object({
  roomToken: z.string().min(20),

  guestName: z
    .string()
    .min(2)
    .max(100),

  phone: z
    .string()
    .min(7)
    .max(20),

  specialInstructions: z
    .string()
    .max(500)
    .optional()
    .default(''),

  items: z
    .array(
      z.object({
        foodItemId: z
          .string()
          .min(1),

        quantity: z
          .number()
          .int()
          .min(1)
          .max(50),

        customizations: z
          .array(
            z.object({
              groupId: z.string(),
              optionId: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .min(1),
});

function getEventStatus(
  startAt,
  endAt,
  now = new Date()
) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now < start) {
    return 'UPCOMING';
  }

  if (now >= start && now < end) {
    return 'LIVE';
  }

  return 'COMPLETED';
}

function serializeEvent(event) {
  return {
    _id: event._id,
    hotelId: event.hotelId,

    title: event.title,

    description:
      event.description || '',

    venue:
      event.venue || '',

    coverImageUrl:
      event.coverImageUrl || '',

    startAt: event.startAt,

    endAt: event.endAt,

    isPublished:
      event.isPublished,

    status: getEventStatus(
      event.startAt,
      event.endAt
    ),

    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export const resolveRoom = asyncHandler(
  async (req, res) => {
    const room = await Room.findOne({
      qrTokenHash: sha256(
        req.params.token
      ),
      isActive: true,
    })
      .populate(
        'hotelId',
        'name slug logoUrl taxPercent currency isActive'
      )
      .lean();

    if (
      !room ||
      !room.hotelId?.isActive
    ) {
      throw new ApiError(
        404,
        'QR code is invalid or inactive'
      );
    }

    const hotelId =
      room.hotelId._id;

    const now = new Date();

    const [
      categories,
      foods,
      events,
    ] = await Promise.all([
      Category.find({
        hotelId,
        isActive: true,
      })
        .sort({
          displayOrder: 1,
          name: 1,
        })
        .lean(),

      FoodItem.find({
        hotelId,
        isAvailable: true,
      })
        .sort({
          displayOrder: 1,
          name: 1,
        })
        .lean(),

      Event.find({
        hotelId,
        isPublished: true,

        // Only return events that
        // are currently live or
        // haven't happened yet.
        endAt: {
          $gte: now,
        },
      })
        .sort({
          startAt: 1,
        })
        .lean(),
    ]);

    res.json({
      success: true,

      context: {
        hotel: room.hotelId,

        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          floor: room.floor,
        },

        categories,

        foods,

        events:
          events.map(
            serializeEvent
          ),
      },
    });
  }
);

export const createOrder = asyncHandler(
  async (req, res) => {
    const data =
      orderSchema.parse(
        req.body
      );

    const room =
      await Room.findOne({
        qrTokenHash: sha256(
          data.roomToken
        ),
        isActive: true,
      });

    if (!room) {
      throw new ApiError(
        404,
        'QR code is invalid or inactive'
      );
    }

    const built =
      await buildOrder({
        hotelId: room.hotelId,
        room,
        items: data.items,
      });

    const count =
      await Order.countDocuments({
        hotelId: room.hotelId,
      });

    const orderNumber =
      `${new Date().getFullYear()}${String(
        count + 1
      ).padStart(6, '0')}`;

    const order =
      await Order.create({
        orderNumber,

        hotelId:
          room.hotelId,

        roomId:
          room._id,

        roomNumber:
          room.roomNumber,

        guestName:
          data.guestName,

        phone:
          data.phone,

        specialInstructions:
          data.specialInstructions,

        items:
          built.orderItems,

        subtotal:
          built.subtotal,

        taxAmount:
          built.taxAmount,

        total:
          built.total,

        paymentMethod:
          'COD',

        paymentStatus:
          'PENDING',

        orderStatus:
          'NEW',

        trackingTokenHash:
          built.trackingTokenHash,
      });

    res.status(201).json({
      success: true,

      order: {
        id: order._id,
        orderNumber:
          order.orderNumber,

        status:
          order.orderStatus,

        total:
          order.total,

        roomNumber:
          order.roomNumber,
      },

      trackingToken:
        built.trackingToken,
    });
  }
);

export const getOrder = asyncHandler(
  async (req, res) => {
    const order =
      await Order.findOne({
        _id: req.params.id,

        trackingTokenHash:
          sha256(
            req.query.token || ''
          ),
      }).lean();

    if (!order) {
      throw new ApiError(
        404,
        'Order not found'
      );
    }

    res.json({
      success: true,
      order,
    });
  }
);