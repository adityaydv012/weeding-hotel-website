import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF', 'KITCHEN'], required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
