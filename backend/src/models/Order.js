import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  customizations: [{
    groupName: String,
    optionId: mongoose.Schema.Types.ObjectId,
    optionName: String,
    priceDelta: Number,
  }],
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  roomNumber: { type: String, required: true },
  guestName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  specialInstructions: { type: String, default: '' },
  items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  orderStatus: { type: String, enum: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'], default: 'NEW', index: true },
  trackingTokenHash: { type: String, required: true, unique: true, select: false },
}, { timestamps: true });

orderSchema.index({ hotelId: 1, createdAt: -1 });
orderSchema.index({ hotelId: 1, orderStatus: 1, createdAt: -1 });
export const Order = mongoose.model('Order', orderSchema);
