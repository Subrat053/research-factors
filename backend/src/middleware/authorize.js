import { AppError } from './errorHandler.js';

/**
 * Enforces a specific granular permission string (e.g. 'article.publish')
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource', 401, 'UNAUTHORIZED'));
    }

    // Super Admin bypasses all checks
    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.has(permission)) {
      return next(new AppError(`Access denied: Missing required permission '${permission}'`, 403, 'FORBIDDEN'));
    }

    next();
  };
};

/**
 * Enforces at least one permission among a set
 */
export const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasAny = permissions.some(p => req.user.permissions?.has(p));
    if (!hasAny) {
      return next(new AppError('Access denied: Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};

/**
 * Enforces a specific role name (e.g. 'ADMIN')
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!req.user.roles || !req.user.roles.includes(role)) {
      return next(new AppError(`Access denied: Requires '${role}' role`, 403, 'FORBIDDEN'));
    }

    next();
  };
};

/**
 * Enforces that the authenticated user possesses the SUPER_ADMIN role
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (!req.user.isSuperAdmin) {
    return next(new AppError('Access denied: Super Administrator privileges required', 403, 'FORBIDDEN_SUPER_ADMIN_REQUIRED'));
  }

  next();
};
