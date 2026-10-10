import { Router } from 'express';

import {
  requireAuth,
  allowRoles,
} from '../middleware/auth.js';

import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  allowRoles(
    'SUPER_ADMIN',
    'HOTEL_ADMIN',
    'STAFF'
  ),
  listEvents
);

router.get(
  '/:id',
  allowRoles(
    'SUPER_ADMIN',
    'HOTEL_ADMIN',
    'STAFF'
  ),
  getEvent
);

router.post(
  '/',
  allowRoles(
    'SUPER_ADMIN',
    'HOTEL_ADMIN'
  ),
  createEvent
);

router.patch(
  '/:id',
  allowRoles(
    'SUPER_ADMIN',
    'HOTEL_ADMIN'
  ),
  updateEvent
);

router.delete(
  '/:id',
  allowRoles(
    'SUPER_ADMIN',
    'HOTEL_ADMIN'
  ),
  deleteEvent
);

export default router;