import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class UserService {
  /**
   * Retrieves user profile with associated author profile and roles
   */
  static async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        authorProfile: true,
        roles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Updates user and author profile details transactionally
   */
  static async updateProfile(userId, data) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { authorProfile: true }
    });

    if (!user) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    const {
      firstName,
      lastName,
      avatarUrl,
      bio,
      headline,
      biography,
      websiteUrl,
      twitterUrl,
      linkedinUrl,
      githubUrl
    } = data;

    // Separate User fields and AuthorProfile fields
    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl || null;
    if (bio !== undefined) userUpdate.bio = bio || null;

    const authorFieldsProvided =
      headline !== undefined ||
      biography !== undefined ||
      websiteUrl !== undefined ||
      twitterUrl !== undefined ||
      linkedinUrl !== undefined ||
      githubUrl !== undefined;

    return await prisma.$transaction(async (tx) => {
      let updatedUser = user;
      if (Object.keys(userUpdate).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: userUpdate
        });
      }

      if (authorFieldsProvided) {
        const authorData = {};
        if (headline !== undefined) authorData.headline = headline || null;
        if (biography !== undefined) authorData.biography = biography || null;
        if (websiteUrl !== undefined) authorData.websiteUrl = websiteUrl || null;
        if (twitterUrl !== undefined) authorData.twitterUrl = twitterUrl || null;
        if (linkedinUrl !== undefined) authorData.linkedinUrl = linkedinUrl || null;
        if (githubUrl !== undefined) authorData.githubUrl = githubUrl || null;

        await tx.authorProfile.upsert({
          where: { userId },
          create: {
            userId,
            ...authorData
          },
          update: authorData
        });
      }

      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          authorProfile: true,
          roles: {
            include: { role: true }
          }
        }
      });
    });
  }

  /**
   * Securely verifies old password and sets new password hash
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('The current password provided is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    return { message: 'Password updated successfully' };
  }
}
