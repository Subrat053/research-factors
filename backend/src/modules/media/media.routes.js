import { Router } from 'express';
import multer from 'multer';
import { MediaController } from './media.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

export const mediaRoutes = Router();

mediaRoutes.post(
  '/upload',
  authenticate,
  requirePermission('media.upload'),
  upload.single('file'),
  MediaController.upload
);

mediaRoutes.delete(
  '/:id',
  authenticate,
  MediaController.delete
);
