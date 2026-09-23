import { CategoryService } from './category.service.js';

export class CategoryController {
  static async getCategories(req, res, next) {
    try {
      const categories = await CategoryService.getActiveCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCategoryBySlug(req, res, next) {
    try {
      const category = await CategoryService.getCategoryBySlug(req.params.slug);
      res.json({
        success: true,
        data: category
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body, req.user?.id);
      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      await CategoryService.deleteCategory(req.params.id, req.user?.id);
      res.json({
        success: true,
        data: null,
        message: 'Category deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  static async mergeCategories(req, res, next) {
    try {
      const result = await CategoryService.mergeCategories(req.body, req.user?.id);
      res.json({
        success: true,
        data: result,
        message: 'Categories merged successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
