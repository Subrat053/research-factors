import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  ShieldCheck,
  Globe,
  Upload,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Twitter,
  Linkedin,
  Github
} from 'lucide-react';
import { userApi } from '../../services/user.api.js';
import { mediaApi, normalizeMediaUrl } from '../../services/media.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
  avatarUrl: z.string().optional().nullable(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().nullable(),
  headline: z.string().max(160, 'Headline cannot exceed 160 characters').optional().nullable(),
  biography: z.string().max(3000, 'Biography cannot exceed 3000 characters').optional().nullable(),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter/X URL').optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().nullable().or(z.literal(''))
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"]
});

export default function AdminProfilePage() {
  const queryClient = useQueryClient();
  const { user: authUser, refetchUser, hasRole, hasAnyPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch Current Profile
  const { data, isLoading } = useQuery({
    queryKey: ['user-my-profile'],
    queryFn: async () => {
      const res = await userApi.getProfile();
      return res.data;
    }
  });

  const profile = data?.data || data || authUser;
  const authorProfile = profile?.authorProfile;

  // Dynamically determine if user has authoring privileges or staff roles
  const canAuthor =
    hasAnyPermission(['article.create', 'article.update_own', 'author.approve']) ||
    hasRole('SUPER_ADMIN') ||
    hasRole('ADMIN') ||
    hasRole('EDITOR') ||
    hasRole('AUTHOR') ||
    Boolean(authorProfile?.isApproved) ||
    Boolean(
      profile?.roles?.some((r) =>
        ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'].includes(typeof r === 'string' ? r : r.name)
      )
    );

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      avatarUrl: profile?.avatarUrl || '',
      bio: profile?.bio || '',
      headline: authorProfile?.headline || '',
      biography: authorProfile?.biography || '',
      websiteUrl: authorProfile?.websiteUrl || '',
      twitterUrl: authorProfile?.twitterUrl || '',
      linkedinUrl: authorProfile?.linkedinUrl || '',
      githubUrl: authorProfile?.githubUrl || ''
    }
  });

  const avatarWatch = watchProfile('avatarUrl');

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({
        type: 'error',
        text: 'Please select a valid image file (JPEG, PNG, WebP, AVIF, GIF).'
      });
      return;
    }

    // Validate maximum file size (8MB)
    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'File size must not exceed 8MB.' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadRes = await mediaApi.upload(file, {
        caption: `${profile?.fullName || 'User'} Profile Avatar`,
        altText: `${profile?.fullName || 'User'} Avatar`
      });

      // Backend returns { success: true, data: { publicUrl, storageKey, ... } }
      const publicUrl = uploadRes.data?.publicUrl || uploadRes.data?.url || uploadRes.publicUrl;
      if (publicUrl) {
        setProfileValue('avatarUrl', publicUrl, { shouldDirty: true });
        setFeedback({
          type: 'success',
          text: 'Avatar uploaded. Click "Save Profile Changes" below to apply.'
        });
      } else {
        throw new Error('Upload completed, but no accessible image URL was returned.');
      }
    } catch (err) {
      const message =
        err.message ||
        err.response?.data?.error?.message ||
        'Avatar upload failed. Please try again.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit Profile
  const onSaveProfile = async (formData) => {
    try {
      await userApi.updateProfile(formData);
      queryClient.invalidateQueries(['user-my-profile']);
      await refetchUser();
      setFeedback({ type: 'success', text: 'Your profile details have been saved successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Failed to update profile.' });
    }
  };

  // Submit Password
  const onChangePassword = async (formData) => {
    try {
      await userApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      resetPassword();
      setFeedback({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Unable to update password.' });
    }
  };

  return (
    <AdminLayout
      title="Profile"
      subtitle="Manage your identity, researcher accreditation, and account security"
    >
      <Helmet>
        <title>My Profile — Research Factors</title>
      </Helmet>

      {/* Auto-Dismissing Banner */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium transition-all ${
            feedback.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:text-slate-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Profile & Researcher Bio
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Account Security & Password
        </button>
      </div>

      {isLoading ? (
        <div className="p-20 flex justify-center items-center text-slate-500 dark:text-slate-400 space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs">Loading profile details...</span>
        </div>
      ) : activeTab === 'profile' ? (
        <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-8">
          {/* Avatar Section */}
          <div className="admin-card p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Profile Photo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your avatar is displayed on published articles, author bylines, and peer comments.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {avatarWatch ? (
                  <img
                    src={normalizeMediaUrl(avatarWatch)}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 transition-colors">
                    {uploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingAvatar ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                  {avatarWatch && (
                    <button
                      type="button"
                      onClick={() => setProfileValue('avatarUrl', '', { shouldDirty: true })}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or paste an image URL..."
                  {...registerProfile('avatarUrl')}
                  className="admin-input"
                />
                {profileErrors.avatarUrl && (
                  <p className="text-[11px] text-red-500 dark:text-red-400">{profileErrors.avatarUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Identity & Basic Info */}
          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  {...registerProfile('firstName')}
                  className="admin-input"
                />
                {profileErrors.firstName && (
                  <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  {...registerProfile('lastName')}
                  className="admin-input"
                />
                {profileErrors.lastName && (
                  <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.lastName.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="admin-input bg-slate-100/50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Email changes require security verification via administrative contact.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell readers about yourself..."
                  {...registerProfile('bio')}
                  className="admin-input"
                />
                {profileErrors.bio && (
                  <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.bio.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic & Author Accreditation Section (Dynamically rendered only for users with author privileges) */}
          {canAuthor && (
            <div className="admin-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Researcher Credentials & Byline</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Displayed on your public author profile and article header bylines.
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500 dark:text-emerald-400" />
                  Verified Author
                </span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Professional / Academic Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Research Fellow in Quantum Optics, Stanford University"
                    {...registerProfile('headline')}
                    className="admin-input"
                  />
                  {profileErrors.headline && (
                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.headline.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Full Researcher Biography & Focus
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Detail your scientific investigation focus, prior publications, and laboratory affiliation..."
                    {...registerProfile('biography')}
                    className="admin-input leading-relaxed"
                  />
                  {profileErrors.biography && (
                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.biography.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Personal / Lab Website</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourlaboratory.edu"
                      {...registerProfile('websiteUrl')}
                      className="admin-input"
                    />
                    {profileErrors.websiteUrl && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.websiteUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1">
                      <Linkedin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>LinkedIn Profile</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      {...registerProfile('linkedinUrl')}
                      className="admin-input"
                    />
                    {profileErrors.linkedinUrl && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.linkedinUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1">
                      <Twitter className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                      <span>Twitter / X Profile</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://x.com/username"
                      {...registerProfile('twitterUrl')}
                      className="admin-input"
                    />
                    {profileErrors.twitterUrl && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.twitterUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1">
                      <Github className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>GitHub Profile</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      {...registerProfile('githubUrl')}
                      className="admin-input"
                    />
                    {profileErrors.githubUrl && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{profileErrors.githubUrl.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isProfileSubmitting ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      ) : (
        /* Password & Security Tab */
        <div className="max-w-xl">
          <form
            onSubmit={handlePasswordSubmit(onChangePassword)}
            className="admin-card p-6 space-y-4"
          >
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
              <KeyRound className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Change Password</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                {...registerPassword('currentPassword')}
                className="admin-input"
              />
              {passwordErrors.currentPassword && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters..."
                {...registerPassword('newPassword')}
                className="admin-input"
              />
              {passwordErrors.newPassword && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                {...registerPassword('confirmPassword')}
                className="admin-input"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isPasswordSubmitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
