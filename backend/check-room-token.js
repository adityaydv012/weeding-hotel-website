import 'dotenv/config';
import mongoose from 'mongoose';

import { Room } from './src/models/Room.js';
import { Hotel } from './src/models/Hotel.js';
import { sha256 } from './src/utils/hash.js';

const token =
  '05e737fde17d1643436e08f8660a08d4624c5b5a84520a07';

try {
  await mongoose.connect(process.env.MONGO_URI);

  const tokenHash = sha256(token);

  const room = await Room.findOne({
    qrTokenHash: tokenHash,
  })
    .select('+qrTokenHash')
    .lean();

  if (!room) {
    console.log('RESULT: No room matches this QR token.');
  } else {
    const hotel = await Hotel.findById(room.hotelId)
      .select('name isActive')
      .lean();

    console.log({
      roomId: String(room._id),
      roomNumber: room.roomNumber,
      roomActive: room.isActive,
      hotelId: String(room.hotelId),
      hotelName: hotel?.name ?? null,
      hotelActive: hotel?.isActive ?? null,
    });
  }
} catch (error) {
  console.error('Diagnostic failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}