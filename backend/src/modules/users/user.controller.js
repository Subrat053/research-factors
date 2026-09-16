import { UserService } from './user.service.js';
import { UserDTO } from './user.dto.js';

export class UserController {
  static async getProfile(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: UserDTO.toPrivate(user, req.user.permissions)
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const user = await UserService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: UserDTO.toPrivate(user, req.user.permissions),
        message: 'Profile updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await UserService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}
