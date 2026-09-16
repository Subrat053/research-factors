import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await login(data);
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Unable to sign in. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Masthead */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block group py-1">
          <img
            src="/logo.png"
            alt="Research Factors"
            className="h-11 w-auto mx-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
        </Link>
        <h2 className="mt-6 text-3xl font-serif font-bold tracking-tight text-ink-darkest">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Or{' '}
          <Link to="/register" className="font-medium text-rfblue hover:text-rfblue-700 underline underline-offset-4">
            create an account to comment and write
          </Link>
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
                Email address
              </label>
              <input
                type="email"
                {...register('email')}
                autoComplete="email"
                placeholder="name@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.email ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                } focus:outline-none focus:ring-2 focus:ring-rfblue focus:border-transparent text-ink text-sm transition-all`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-rfred font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-rfblue hover:text-rfblue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                {...register('password')}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.password ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                } focus:outline-none focus:ring-2 focus:ring-rfblue focus:border-transparent text-ink text-sm transition-all`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-rfred font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rfblue transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
