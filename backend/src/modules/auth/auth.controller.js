import { AuthService } from './auth.service.js';
import { UserDTO } from '../users/user.dto.js';
import { config } from '../../config/index.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('accessToken', result.token, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        data: {
          user: UserDTO.toPrivate(result.user, result.permissions),
          token: result.token
        },
        message: 'Account registered successfully. Please check your email to verify.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('accessToken', result.token, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user: UserDTO.toPrivate(result.user, result.permissions),
          token: result.token
        },
        message: 'Signed in successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      data: null,
      message: 'Logged out successfully'
    });
  }

  static async me(req, res) {
    res.status(200).json({
      success: true,
      data: {
        user: UserDTO.toPrivate(req.user, req.user.permissions)
      }
    });
  }

  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Email verified successfully. You now have full platform access.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      await AuthService.forgotPassword(req.body.email);

      res.status(200).json({
        success: true,
        data: null,
        message: 'If an account exists with that email, a password reset link has been dispatched.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      await AuthService.resetPassword(req.body);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Password reset successfully. You can now sign in with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }
}
