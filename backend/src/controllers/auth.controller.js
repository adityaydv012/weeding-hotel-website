import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+passwordHash');

  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      hotelId: user.hotelId?.toString() ?? null,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  /*
   * requireAuth middleware already verifies the JWT
   * and loads the user from MongoDB into req.user.
   *
   * Therefore we do NOT need to query using req.user.sub.
   */

  const user = req.user;

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    },
  });
});