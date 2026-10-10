
import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
      maxlength: 500,
    },
    phone: {
      type: String,
      default: '',
      maxlength: 30,
    },
    email: {
      type: String,
      default: '',
    },
    taxPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Hotel = mongoose.model('Hotel', hotelSchema);
