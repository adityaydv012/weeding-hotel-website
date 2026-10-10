import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import roomRoutes from './routes/room.routes.js';
import categoryRoutes from './routes/category.routes.js';
import foodRoutes from './routes/food.routes.js';
import orderRoutes from './routes/order.routes.js';
import publicRoutes from './routes/public.routes.js';
import eventRoutes from './routes/event.routes.js';
import { errorHandler, notFound } from './middleware/error.js';
import userRoutes from './routes/user.routes.js';


const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length ? origins : true,
    credentials: false,
  })
);

app.use(express.json({ limit: '1mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  })
);

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'hotel-food-ordering-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/hotels', hotelRoutes);

app.use('/api/public', publicRoutes);

app.use('/api/rooms', roomRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/food-items', foodRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/events', eventRoutes);


app.use('/api/users', userRoutes);


app.use(notFound);

app.use(errorHandler);

export default app;