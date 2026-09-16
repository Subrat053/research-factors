import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../services/auth.api.js';
import { AlertCircle, Loader2 } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const token = new URLSearchParams(location.search).get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(resetSchema)
  });

  const onSubmit = async (data) => {
    if (!token) {
      setServerError('Reset token missing from URL. Please check your reset link.');
      return;
    }

    setServerError(null);
    try {
      await authApi.resetPassword({ token, password: data.password });
      navigate('/login?resetSuccess=true');
    } catch (err) {
      setServerError(err.message || 'Unable to reset password. Token may have expired.');
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block group py-1">
          <img
            src="/logo.png"
            alt="Research Factors"
            className="h-11 w-auto mx-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
        </Link>
        <h2 className="mt-6 text-3xl font-serif font-bold tracking-tight text-ink-darkest">
          Choose a new password
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your new password must be at least 8 characters.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-paper-border rounded-2xl sm:px-10">
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-rfred-50 border border-rfred-100 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rfred shrink-0 mt-0.5" />
              <div className="text-sm text-rfred font-medium leading-relaxed">
                {serverError}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                New Password
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.password ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-rfred font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.confirmPassword ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-rfred font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rfblue transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
