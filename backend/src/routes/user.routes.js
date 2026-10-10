
import { Router } from 'express';

import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/user.controller.js';

import {
  requireAuth,
  allowRoles,
} from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(allowRoles('SUPER_ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.patch('/:id/deactivate', deactivateUser);

export default router;
