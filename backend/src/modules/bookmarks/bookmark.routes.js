import { Router } from 'express';
import { BookmarkController } from './bookmark.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';

export const bookmarkRoutes = Router();

bookmarkRoutes.post('/toggle', authenticate, BookmarkController.toggle);
bookmarkRoutes.get('/', authenticate, BookmarkController.getBookmarks);
bookmarkRoutes.get('/check/:articleId', optionalAuthenticate, BookmarkController.checkStatus);
