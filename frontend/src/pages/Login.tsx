import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Store, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, requestPasswordReset } from '../services/authService.ts';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!form.password.trim()) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(form);
      setSuccess('Login successful! Redirecting to dashboard...');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-3 sm:mb-4">
            <Store className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2">Sign In</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back to SmartKirana</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/60 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/60 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                onClick={async () => {
                  const email = form.email.trim();
                  setError('');
                  setSuccess('');
                  if (!email) {
                    setError('Enter your email above, then click Forgot password.');
                    return;
                  }
                  try {
                    await requestPasswordReset(email);
                    setSuccess('If the email is registered, a reset link has been sent.');
                  } catch (e) {
                    // Still show success-like message to avoid leaking account existence
                    setSuccess('If the email is registered, a reset link has been sent.');
                  }
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
                  onClick={() => navigate('/register')}
                >
                  Create one here
                </button>
              </p>
            </div>


          </form>
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure login powered by SmartKirana
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
