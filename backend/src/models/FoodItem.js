import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  priceDelta: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const customizationGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  selectionType: { type: String, enum: ['SINGLE', 'MULTIPLE'], default: 'SINGLE' },
  required: { type: Boolean, default: false },
  minSelections: { type: Number, min: 0, default: 0 },
  maxSelections: { type: Number, min: 1, default: 1 },
  options: { type: [optionSchema], default: [] },
}, { _id: true });

const foodItemSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0, default: null },
  isVeg: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  preparationTime: { type: Number, min: 0, default: 15 },
  isAvailable: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  customizations: { type: [customizationGroupSchema], default: [] },
}, { timestamps: true });

foodItemSchema.index({ hotelId: 1, categoryId: 1, isAvailable: 1, displayOrder: 1 });
export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
