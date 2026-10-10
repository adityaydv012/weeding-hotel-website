import { z } from 'zod';
import { FoodItem } from '../models/FoodItem.js';
import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const option = z.object({ name: z.string().min(1), priceDelta: z.number().min(0).optional().default(0), isActive: z.boolean().optional().default(true) });
const customization = z.object({ name: z.string().min(1), selectionType: z.enum(['SINGLE', 'MULTIPLE']).optional().default('SINGLE'), required: z.boolean().optional().default(false), minSelections: z.number().int().min(0).optional().default(0), maxSelections: z.number().int().min(1).optional().default(1), options: z.array(option).default([]) });
const schema = z.object({ hotelId: z.string().min(1), categoryId: z.string().min(1), name: z.string().min(1).max(120), description: z.string().max(500).optional().default(''), imageUrl: z.string().url().optional().or(z.literal('')), price: z.number().min(0), discountPrice: z.number().min(0).nullable().optional(), isVeg: z.boolean().optional().default(true), isBestseller: z.boolean().optional().default(false), preparationTime: z.number().int().min(0).optional().default(15), isAvailable: z.boolean().optional().default(true), displayOrder: z.number().int().optional().default(0), customizations: z.array(customization).optional().default([]) });
function access(user, hotelId) { if (user.role !== 'SUPER_ADMIN' && String(user.hotelId) !== String(hotelId)) throw new ApiError(403, 'Hotel access denied'); }

export const listFood = asyncHandler(async (req, res) => {
  const hotelId = req.user.role === 'SUPER_ADMIN' ? req.query.hotelId : req.user.hotelId; if (!hotelId) throw new ApiError(400, 'hotelId is required'); access(req.user, hotelId);
  const filter = { hotelId }; if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  res.json({ success: true, foods: await FoodItem.find(filter).sort({ displayOrder: 1, name: 1 }).lean() });
});

export const createFood = asyncHandler(async (req, res) => {
  const data = schema.parse(req.body); access(req.user, data.hotelId);
  const category = await Category.findOne({ _id: data.categoryId, hotelId: data.hotelId }); if (!category) throw new ApiError(400, 'Category does not belong to this hotel');
  if (data.discountPrice != null && data.discountPrice > data.price) throw new ApiError(400, 'discountPrice cannot exceed price');
  res.status(201).json({ success: true, food: await FoodItem.create(data) });
});

export const updateFood = asyncHandler(async (req, res) => {
  const food = await FoodItem.findById(req.params.id); if (!food) throw new ApiError(404, 'Food item not found'); access(req.user, food.hotelId);
  const data = schema.partial().omit({ hotelId: true }).parse(req.body); Object.assign(food, data); if (food.discountPrice != null && food.discountPrice > food.price) throw new ApiError(400, 'discountPrice cannot exceed price'); await food.save();
  res.json({ success: true, food });
});

export const deleteFood = asyncHandler(async (req, res) => {
  const food = await FoodItem.findById(req.params.id); if (!food) throw new ApiError(404, 'Food item not found'); access(req.user, food.hotelId); await food.deleteOne();
  res.json({ success: true, message: 'Food item deleted' });
});
