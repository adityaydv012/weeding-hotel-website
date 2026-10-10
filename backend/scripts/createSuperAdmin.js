import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

if (!email || !password) {
  console.error(
    'Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env'
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error('SUPER_ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existingUser) {
    console.log(`User already exists: ${existingUser.email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'SUPER_ADMIN',
    hotelId: null,
    isActive: true,
  });

  console.log('SUPER_ADMIN created successfully.');
  console.log(`Email: ${user.email}`);
  console.log(`User ID: ${user._id}`);

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error('Failed to create SUPER_ADMIN:', error);
  await mongoose.disconnect();
  process.exit(1);
}