import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { config } from '../../config/index.js';
import { emailService } from '../../email/EmailService.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AuthService {
  /**
   * Hashes a plain password securely
   */
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compares plain password with hash
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates JWT token with user payload
   */
  static generateToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  /**
   * Resolves set of permission action strings for a user
   */
  static async resolveUserPermissions(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions = new Set();
    let isSuperAdmin = false;

    for (const ur of userRoles) {
      if (ur.role.name === 'SUPER_ADMIN') {
        isSuperAdmin = true;
      }
      for (const rp of ur.role.permissions) {
        if (rp.permission?.action) {
          permissions.add(rp.permission.action);
        }
      }
    }

    return { permissions, isSuperAdmin, roles: userRoles.map(ur => ur.role.name) };
  }

  /**
   * Registers a new user account
   */
  static async register({ email, password, firstName, lastName, bio }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await this.hashPassword(password);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // Default to 'USER' role
    let defaultRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!defaultRole) {
      // Create if initial seed hasn't run
      defaultRole = await prisma.role.create({
        data: { name: 'USER', description: 'Standard platform reader & commenter' }
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          bio,
          emailVerifyToken,
          status: 'ACTIVE'
        }
      });

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: defaultRole.id
        }
      });

      return newUser;
    });

    // Send verification email asynchronously
    emailService.sendVerificationEmail(email, emailVerifyToken, firstName).catch(() => {});

    const token = this.generateToken(user);
    const { permissions, isSuperAdmin, roles } = await this.resolveUserPermissions(user.id);

    return {
      user: {
        ...user,
        roles,
        isSuperAdmin
      },
      token,
      permissions
    };
  }

  /**
   * Authenticates user via email and password
   */
  static async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        authorProfile: true,
        roles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account has been suspended by administration', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'DEACTIVATED') {
      throw new AppError('This account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user);
    const { permissions, isSuperAdmin, roles } = await this.resolveUserPermissions(user.id);

    return {
      user: {
        ...user,
        roles,
        isSuperAdmin
      },
      token,
      permissions
    };
  }

  /**
   * Verifies an email token
   */
  static async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFY_TOKEN');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null
      }
    });

    return true;
  }

  /**
   * Issues password reset token
   */
  static async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Protect user enumeration: return success even if email not registered
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    await emailService.sendPasswordResetEmail(email, resetToken).catch(() => {});
    return true;
  }

  /**
   * Resets password using valid token
   */
  static async resetPassword({ token, password }) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired', 400, 'EXPIRED_RESET_TOKEN');
    }

    const passwordHash = await this.hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return true;
  }
}
