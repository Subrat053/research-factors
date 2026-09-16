import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract from HttpOnly cookie or Authorization header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required to access this resource', 401, 'UNAUTHORIZED');
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      throw new AppError('Session expired or invalid. Please sign in again.', 401, 'INVALID_TOKEN');
    }

    // 3. Fetch user and verify active status
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        authorProfile: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive, suspended, or does not exist', 403, 'FORBIDDEN');
    }

    // 4. Resolve permissions and roles
    const { permissions, isSuperAdmin, roles } = await AuthService.resolveUserPermissions(user.id);

    req.user = {
      ...user,
      roles,
      permissions,
      isSuperAdmin
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware for public endpoints (attaches req.user if present, proceeds if guest)
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { authorProfile: true }
    });

    if (user && user.status === 'ACTIVE') {
      const { permissions, isSuperAdmin, roles } = await AuthService.resolveUserPermissions(user.id);
      req.user = {
        ...user,
        roles,
        permissions,
        isSuperAdmin
      };
    } else {
      req.user = null;
    }

    next();
  } catch {
    req.user = null;
    next();
  }
};
