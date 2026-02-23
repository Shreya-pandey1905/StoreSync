import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService.ts';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!form.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!form.confirmPassword.trim()) {
      setError('Please confirm your password');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setSuccess('Password reset successful! Redirecting to login...');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 sm:p-8 border border-slate-200 dark:border-slate-700 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-3 sm:mb-4">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2">Reset Password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter your new password below</p>
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

            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter your new password"
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <button
                type="button"
                className="flex items-center justify-center mx-auto space-x-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure password reset powered by SmartKirana
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
