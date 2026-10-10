import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomNumber: { type: String, required: true, trim: true },
  floor: { type: String, default: '' },
  qrTokenHash: { type: String, required: true, unique: true, select: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
export const Room = mongoose.model('Room', roomSchema);
