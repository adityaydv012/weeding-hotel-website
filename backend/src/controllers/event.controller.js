import { z } from 'zod';

import { Event } from '../models/Event.js';
import { Hotel } from '../models/Hotel.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const createEventSchema = z.object({
  hotelId: z.string().min(1),

  title: z
    .string()
    .min(2)
    .max(150),

  description: z
    .string()
    .max(1000)
    .optional()
    .default(''),

  venue: z
    .string()
    .max(200)
    .optional()
    .default(''),

  coverImageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),

  startAt: z
    .string()
    .datetime(),

  endAt: z
    .string()
    .datetime(),

  isPublished: z
    .boolean()
    .optional()
    .default(true),
});

const updateEventSchema =
  createEventSchema
    .omit({
      hotelId: true,
    })
    .partial();

function assertHotelAccess(
  user,
  hotelId
) {
  if (
    user.role !== 'SUPER_ADMIN' &&
    String(user.hotelId) !==
      String(hotelId)
  ) {
    throw new ApiError(
      403,
      'Hotel access denied'
    );
  }
}

function validateDates(
  startAt,
  endAt
) {
  const start =
    new Date(startAt);

  const end =
    new Date(endAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new ApiError(
      400,
      'Invalid event date/time'
    );
  }

  if (end <= start) {
    throw new ApiError(
      400,
      'endAt must be after startAt'
    );
  }

  return {
    start,
    end,
  };
}

function getEventStatus(
  startAt,
  endAt,
  now = new Date()
) {
  const start =
    new Date(startAt);

  const end =
    new Date(endAt);

  if (now < start) {
    return 'UPCOMING';
  }

  if (
    now >= start &&
    now < end
  ) {
    return 'LIVE';
  }

  return 'COMPLETED';
}

function serializeEvent(event) {
  return {
    ...event,
    status: getEventStatus(
      event.startAt,
      event.endAt
    ),
  };
}

export const createEvent =
  asyncHandler(
    async (req, res) => {
      const data =
        createEventSchema.parse(
          req.body
        );

      assertHotelAccess(
        req.user,
        data.hotelId
      );

      const hotel =
        await Hotel.findById(
          data.hotelId
        );

      if (!hotel) {
        throw new ApiError(
          404,
          'Hotel not found'
        );
      }

      const {
        start,
        end,
      } = validateDates(
        data.startAt,
        data.endAt
      );

      const event =
        await Event.create({
          hotelId: data.hotelId,
          title: data.title,
          description:
            data.description,
          venue: data.venue,
          coverImageUrl:
            data.coverImageUrl || '',
          startAt: start,
          endAt: end,
          isPublished:
            data.isPublished,
        });

      res.status(201).json({
        success: true,
        event: serializeEvent(
          event.toObject()
        ),
      });
    }
  );

export const listEvents =
  asyncHandler(
    async (req, res) => {
      const hotelId =
        req.user.role ===
        'SUPER_ADMIN'
          ? req.query.hotelId
          : req.user.hotelId;

      if (!hotelId) {
        throw new ApiError(
          400,
          'hotelId is required'
        );
      }

      assertHotelAccess(
        req.user,
        hotelId
      );

      const events =
        await Event.find({
          hotelId,
        })
          .sort({
            startAt: 1,
          })
          .lean();

      res.json({
        success: true,
        events:
          events.map(
            serializeEvent
          ),
      });
    }
  );

export const getEvent =
  asyncHandler(
    async (req, res) => {
      const event =
        await Event.findById(
          req.params.id
        ).lean();

      if (!event) {
        throw new ApiError(
          404,
          'Event not found'
        );
      }

      assertHotelAccess(
        req.user,
        event.hotelId
      );

      res.json({
        success: true,
        event:
          serializeEvent(event),
      });
    }
  );

export const updateEvent =
  asyncHandler(
    async (req, res) => {
      const event =
        await Event.findById(
          req.params.id
        );

      if (!event) {
        throw new ApiError(
          404,
          'Event not found'
        );
      }

      assertHotelAccess(
        req.user,
        event.hotelId
      );

      const data =
        updateEventSchema.parse(
          req.body
        );

      const startAt =
        data.startAt ??
        event.startAt;

      const endAt =
        data.endAt ??
        event.endAt;

      const {
        start,
        end,
      } = validateDates(
        startAt,
        endAt
      );

      if (
        data.title !== undefined
      ) {
        event.title =
          data.title;
      }

      if (
        data.description !==
        undefined
      ) {
        event.description =
          data.description;
      }

      if (
        data.venue !== undefined
      ) {
        event.venue =
          data.venue;
      }

      if (
        data.coverImageUrl !==
        undefined
      ) {
        event.coverImageUrl =
          data.coverImageUrl;
      }

      if (
        data.isPublished !==
        undefined
      ) {
        event.isPublished =
          data.isPublished;
      }

      event.startAt = start;
      event.endAt = end;

      await event.save();

      res.json({
        success: true,
        event:
          serializeEvent(
            event.toObject()
          ),
      });
    }
  );

export const deleteEvent =
  asyncHandler(
    async (req, res) => {
      const event =
        await Event.findById(
          req.params.id
        );

      if (!event) {
        throw new ApiError(
          404,
          'Event not found'
        );
      }

      assertHotelAccess(
        req.user,
        event.hotelId
      );

      await event.deleteOne();

      res.json({
        success: true,
        message:
          'Event deleted',
      });
    }
  );