
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';

import { User } from '../models/User.js';
import { Hotel } from '../models/Hotel.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const roles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF', 'KITCHEN'];

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(roles),
  hotelId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  email: z.string().trim().email().transform((v) => v.toLowerCase()).optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(roles).optional(),
  hotelId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

function validateHotelId(hotelId) {
  if (hotelId && !mongoose.isValidObjectId(hotelId)) {
    throw new ApiError(400, 'Invalid hotel ID');
  }
}

async function validateUserAssignment(role, hotelId) {
  if (role === 'SUPER_ADMIN') {
    if (hotelId) {
      throw new ApiError(400, 'Super Admin must not be assigned to a hotel');
    }
    return null;
  }

  if (!hotelId) {
    throw new ApiError(400, 'Hotel is required for this user role');
  }

  validateHotelId(hotelId);

  const hotel = await Hotel.findById(hotelId).select('_id isActive');

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }

  if (!hotel.isActive) {
    throw new ApiError(400, 'Cannot assign a user to an inactive hotel');
  }

  return hotel._id;
}

async function protectLastSuperAdmin(targetUser, nextRole, nextActive) {
  const remainsSuperAdmin =
    nextRole === 'SUPER_ADMIN' && nextActive === true;

  if (targetUser.role !== 'SUPER_ADMIN' || remainsSuperAdmin) {
    return;
  }

  const activeSuperAdmins = await User.countDocuments({
    role: 'SUPER_ADMIN',
    isActive: true,
  });

  if (targetUser.isActive && activeSuperAdmins <= 1) {
    throw new ApiError(
      409,
      'Cannot deactivate, demote, or delete the last active Super Admin'
    );
  }
}

export const listUsers = asyncHandler(async (req, res) => {
  const { search = '', role = '', status = '' } = req.query;

  const filter = {};

  if (role && roles.includes(role)) {
    filter.role = role;
  }

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (search.trim()) {
    const escapedSearch = search.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .select('name email role hotelId isActive createdAt updatedAt')
    .populate('hotelId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, users });
});

export const getUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const user = await User.findById(req.params.id)
    .select('name email role hotelId isActive createdAt updatedAt')
    .populate('hotelId', 'name')
    .lean();

  if (!user) throw new ApiError(404, 'User not found');

  res.json({ success: true, user });
});

export const createUser = asyncHandler(async (req, res) => {
  const data = createUserSchema.parse(req.body);

  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new ApiError(409, 'Email address is already registered');
  }

  const hotelId = await validateUserAssignment(
    data.role,
    data.hotelId
  );

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
    hotelId,
    isActive: data.isActive,
  });

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const data = updateUserSchema.parse(req.body);
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) throw new ApiError(404, 'User not found');

  const nextRole = data.role ?? targetUser.role;
  const nextActive = data.isActive ?? targetUser.isActive;

  if (
    targetUser._id.toString() === req.user._id.toString() &&
    (!nextActive || nextRole !== 'SUPER_ADMIN')
  ) {
    throw new ApiError(
      400,
      'You cannot deactivate or demote your own Super Admin account'
    );
  }

  if (data.email && data.email !== targetUser.email) {
    const existingUser = await User.findOne({
      email: data.email,
      _id: { $ne: targetUser._id },
    });

    if (existingUser) {
      throw new ApiError(409, 'Email address is already registered');
    }
  }

  if (data.role || Object.hasOwn(data, 'hotelId')) {
    const nextHotelId = Object.hasOwn(data, 'hotelId')
      ? data.hotelId
      : targetUser.hotelId?.toString() ?? null;

    targetUser.hotelId = await validateUserAssignment(
      nextRole,
      nextHotelId
    );
  }

  await protectLastSuperAdmin(targetUser, nextRole, nextActive);

  if (data.name !== undefined) targetUser.name = data.name;
  if (data.email !== undefined) targetUser.email = data.email;
  if (data.role !== undefined) targetUser.role = data.role;
  if (data.isActive !== undefined) targetUser.isActive = data.isActive;

  if (data.password) {
    targetUser.passwordHash = await bcrypt.hash(data.password, 12);
  }

  await targetUser.save();

  res.json({
    success: true,
    user: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      hotelId: targetUser.hotelId,
      isActive: targetUser.isActive,
      updatedAt: targetUser.updatedAt,
    },
  });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const targetUser = await User.findById(req.params.id);

  if (!targetUser) throw new ApiError(404, 'User not found');

  if (targetUser._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  await protectLastSuperAdmin(
    targetUser,
    targetUser.role,
    false
  );

  targetUser.isActive = false;
  await targetUser.save();

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
});
