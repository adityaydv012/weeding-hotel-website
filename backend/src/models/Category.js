import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  name: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ hotelId: 1, name: 1 }, { unique: true });
export const Category = mongoose.model('Category', categorySchema);
