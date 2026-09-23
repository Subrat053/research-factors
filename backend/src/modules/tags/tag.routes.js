import { Router } from 'express';
import { TagController } from './tag.controller.js';

const router = Router();

router.get('/', TagController.getTags);
router.get('/:slug', TagController.getTagBySlug);

export const tagRoutes = router;
