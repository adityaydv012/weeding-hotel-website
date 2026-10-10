import { z } from 'zod';
import { Hotel } from '../models/Hotel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const createHotelSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers and hyphens'
    ),
  logoUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().max(500).optional().default(''),
  phone: z.string().max(30).optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  taxPercent: z.number().min(0).max(100).optional().default(0),
  currency: z.string().min(3).max(10).optional().default('INR'),
  isActive: z.boolean().optional().default(true),
});

const updateHotelSchema = createHotelSchema.partial();

export const createHotel = asyncHandler(async (req, res) => {
  const data = createHotelSchema.parse(req.body);

  const existingHotel = await Hotel.findOne({
    slug: data.slug.toLowerCase(),
  });

  if (existingHotel) {
    throw new ApiError(409, 'Hotel slug already exists');
  }

  const hotel = await Hotel.create({
    ...data,
    slug: data.slug.toLowerCase(),
  });

  res.status(201).json({
    success: true,
    hotel,
  });
});

export const listHotels = asyncHandler(async (_req, res) => {
  const hotels = await Hotel.find()
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    hotels,
  });
});

export const getHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).lean();

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }

  res.json({
    success: true,
    hotel,
  });
});

export const updateHotel = asyncHandler(async (req, res) => {
  const data = updateHotelSchema.parse(req.body);

  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }

  if (data.slug && data.slug.toLowerCase() !== hotel.slug) {
    const existingHotel = await Hotel.findOne({
      slug: data.slug.toLowerCase(),
      _id: { $ne: hotel._id },
    });

    if (existingHotel) {
      throw new ApiError(409, 'Hotel slug already exists');
    }

    data.slug = data.slug.toLowerCase();
  }

  Object.assign(hotel, data);

  await hotel.save();

  res.json({
    success: true,
    hotel,
  });
});

export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }

  await hotel.deleteOne();

  res.json({
    success: true,
    message: 'Hotel deleted successfully',
  });
});