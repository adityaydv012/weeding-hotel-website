import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    const token = header.slice(7).trim();

    if (!token) {
      return next(new ApiError(401, 'Authentication token missing'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.sub) {
      return next(new ApiError(401, 'Invalid authentication token'));
    }

    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'Invalid or inactive account'));
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Authentication token expired'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid authentication token'));
    }

    return next(new ApiError(401, 'Authentication failed'));
  }
}

export const allowRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};