import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from './user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/me/profile', UserController.getProfile);
router.patch('/me/profile', validateRequest(updateProfileSchema), UserController.updateProfile);
router.patch('/me/password', validateRequest(changePasswordSchema), UserController.changePassword);

export const userRoutes = router;
