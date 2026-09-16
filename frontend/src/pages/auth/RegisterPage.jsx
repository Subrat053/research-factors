import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional()
});

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate('/account/profile', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
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
          Join Research Factors
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-rfblue hover:text-rfblue-700 underline underline-offset-4">
            Sign in here
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

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="Eleanor"
                  className={`w-full px-3.5 py-2.5 rounded-lg border ${
                    errors.firstName ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                  } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-rfred">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="Vance"
                  className={`w-full px-3.5 py-2.5 rounded-lg border ${
                    errors.lastName ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                  } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-rfred">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Email address
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="name@university.edu"
                className={`w-full px-3.5 py-2.5 rounded-lg border ${
                  errors.email ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rfred">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="Minimum 8 characters"
                className={`w-full px-3.5 py-2.5 rounded-lg border ${
                  errors.password ? 'border-rfred bg-rfred-50/20' : 'border-paper-border'
                } focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rfred">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Brief Bio / Research Interests (Optional)
              </label>
              <textarea
                {...register('bio')}
                rows={2}
                placeholder="e.g. Theoretical physicist focusing on quantum optics..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-paper-border focus:outline-none focus:ring-2 focus:ring-rfblue text-ink text-sm transition-all resize-none"
              />
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
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
