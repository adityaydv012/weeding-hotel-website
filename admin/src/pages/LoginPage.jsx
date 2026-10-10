import { useEffect, useState } from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const {
    login,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from =
    location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setSubmitting(true);

      await login(
        email.trim().toLowerCase(),
        password
      );

      navigate(from, { replace: true });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        'Unable to sign in. Please check your credentials.';

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b2638] text-2xl font-semibold text-[#f8e8c8] shadow-lg">
            R&A
          </div>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#241d1a]">
            Rose & Aman
          </h1>

          <p className="mt-2 text-sm text-[#746a64]">
            Hotel Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[#e8ded3] bg-white p-6 shadow-[0_20px_60px_rgba(55,35,25,0.08)] sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-[#241d1a]">
              Welcome back
            </h2>

            <p className="mt-1.5 text-sm text-[#746a64]">
              Sign in to manage your hotel operations.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#3d3531]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@example.com"
                disabled={submitting}
                className="w-full rounded-xl border border-[#ddd2c8] bg-[#fcfaf7] px-4 py-3 text-sm text-[#241d1a] outline-none transition placeholder:text-[#a79c94] focus:border-[#7b2638] focus:ring-4 focus:ring-[#7b2638]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#3d3531]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  disabled={submitting}
                  className="w-full rounded-xl border border-[#ddd2c8] bg-[#fcfaf7] px-4 py-3 pr-20 text-sm text-[#241d1a] outline-none transition placeholder:text-[#a79c94] focus:border-[#7b2638] focus:ring-4 focus:ring-[#7b2638]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-[#7b2638] hover:text-[#5e1d2b] disabled:opacity-50"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-[#7b2638] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#682030] focus:outline-none focus:ring-4 focus:ring-[#7b2638]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#968b83]">
          Rose & Aman Wedding • Hotel Management
        </p>
      </div>
    </div>
  );
}