import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

router.get('/', CategoryController.getCategories);
router.get('/all', authenticate, requirePermission('category.manage'), CategoryController.getAllCategories);
router.get('/:slug', CategoryController.getCategoryBySlug);
router.post('/', authenticate, requirePermission('category.manage'), CategoryController.createCategory);
router.put('/:id', authenticate, requirePermission('category.manage'), CategoryController.updateCategory);
router.delete('/:id', authenticate, requirePermission('category.manage'), CategoryController.deleteCategory);

export const categoryRoutes = router;
