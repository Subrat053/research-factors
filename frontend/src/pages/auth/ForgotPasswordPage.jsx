import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../services/auth.api.js';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase()
});

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Unable to process reset request.');
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
          Reset password
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Enter your registered email and we'll send you a recovery link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-paper-border rounded-2xl sm:px-10">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-rfblue-50 text-rfblue flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-ink-darkest mb-2">Check your inbox</h3>
              <p className="text-sm text-ink-muted mb-6 leading-relaxed">
                If an account exists with that email, instructions to reset your password have been sent.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-rfblue hover:text-rfblue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
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
                    placeholder="name@example.com"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.email ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                    } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-rfred font-medium">{errors.email.message}</p>
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
                      Dispatching reset link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-xs font-semibold text-ink-muted hover:text-ink"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
