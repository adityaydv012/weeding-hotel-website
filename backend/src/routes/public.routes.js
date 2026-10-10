import { Router } from 'express'; import rateLimit from 'express-rate-limit'; import { resolveRoom, createOrder, getOrder } from '../controllers/public.controller.js';
const router=Router();
const publicLimiter=rateLimit({ windowMs: 60*1000, limit: 120, standardHeaders: true, legacyHeaders: false });
const orderLimiter=rateLimit({ windowMs: 10*60*1000, limit: 30, standardHeaders: true, legacyHeaders: false });
router.use(publicLimiter); router.get('/rooms/:token', resolveRoom); router.post('/orders', orderLimiter, createOrder); router.get('/orders/:id', getOrder); export default router;
