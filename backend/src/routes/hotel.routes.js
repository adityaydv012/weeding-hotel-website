
import { Router } from 'express';

import {
  createHotel,
  listHotels,
  getHotel,
  updateHotel,
  deleteHotel,
} from '../controllers/hotel.controller.js';

import {
  requireAuth,
  allowRoles,
} from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(allowRoles('SUPER_ADMIN'));

router.get('/', listHotels);
router.post('/', createHotel);
router.get('/:id', getHotel);
router.patch('/:id', updateHotel);
router.delete('/:id', deleteHotel);

export default router;
