export class UserDTO {
  /**
   * Safe serialization for public views (e.g. author byline, commenter)
   */
  static toPublic(user) {
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      authorProfile: user.authorProfile ? {
        headline: user.authorProfile.headline,
        biography: user.authorProfile.biography,
        websiteUrl: user.authorProfile.websiteUrl,
        twitterUrl: user.authorProfile.twitterUrl,
        linkedinUrl: user.authorProfile.linkedinUrl,
        isApproved: user.authorProfile.isApproved
      } : null
    };
  }

  /**
   * Safe serialization for private authenticated account views
   */
  static toPrivate(user, permissions = []) {
    if (!user) return null;
    const roles = Array.isArray(user.roles)
      ? user.roles.map(ur => (typeof ur === 'string' ? ur : ur.role?.name || ur.name || ''))
      : [];

    const isSuperAdmin = roles.includes('SUPER_ADMIN') || Boolean(user.isSuperAdmin);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      roles,
      isSuperAdmin,
      permissions: Array.from(permissions),
      createdAt: user.createdAt,
      authorProfile: user.authorProfile || null
    };
  }

  /**
   * Safe serialization for administrative directory and detail views
   */
  static toAdmin(user) {
    if (!user) return null;
    const roles = Array.isArray(user.roles)
      ? user.roles.map(ur => (typeof ur === 'string' ? ur : ur.role?.name || ur.name || ''))
      : [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      authorProfile: user.authorProfile ? {
        id: user.authorProfile.id,
        headline: user.authorProfile.headline,
        biography: user.authorProfile.biography,
        websiteUrl: user.authorProfile.websiteUrl,
        twitterUrl: user.authorProfile.twitterUrl,
        linkedinUrl: user.authorProfile.linkedinUrl,
        githubUrl: user.authorProfile.githubUrl,
        isApproved: user.authorProfile.isApproved
      } : null,
      counts: {
        articles: user._count?.articles ?? 0,
        comments: user._count?.comments ?? 0,
        bookmarks: user._count?.bookmarks ?? 0,
        reportsFiled: user._count?.commentReports ?? 0
      }
    };
  }
}
