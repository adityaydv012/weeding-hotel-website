import { z } from 'zod';
import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const schema = z.object({ hotelId: z.string().min(1), name: z.string().min(1).max(80), imageUrl: z.string().url().optional().or(z.literal('')), displayOrder: z.number().int().optional(), isActive: z.boolean().optional() });
function access(user, hotelId) { if (user.role !== 'SUPER_ADMIN' && String(user.hotelId) !== String(hotelId)) throw new ApiError(403, 'Hotel access denied'); }

export const listCategories = asyncHandler(async (req, res) => {
  const hotelId = req.user.role === 'SUPER_ADMIN' ? req.query.hotelId : req.user.hotelId;
  if (!hotelId) throw new ApiError(400, 'hotelId is required');
  access(req.user, hotelId);
  res.json({ success: true, categories: await Category.find({ hotelId }).sort({ displayOrder: 1, name: 1 }).lean() });
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = schema.parse(req.body); access(req.user, data.hotelId);
  res.status(201).json({ success: true, category: await Category.create(data) });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = schema.partial().omit({ hotelId: true }).parse(req.body);
  const category = await Category.findById(req.params.id); if (!category) throw new ApiError(404, 'Category not found');
  access(req.user, category.hotelId);
  Object.assign(category, data); await category.save();
  res.json({ success: true, category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id); if (!category) throw new ApiError(404, 'Category not found');
  access(req.user, category.hotelId); await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});
