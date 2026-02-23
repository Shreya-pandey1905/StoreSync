import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Store, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { register, getCurrentUser, isAuthenticated } from '../services/authService.ts';
import axios from 'axios';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    store: ''
  });

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('🔍 Register page mounted - showing register form');
  }, []);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    // Only fetch roles if we're not in a public context
    console.log('🔍 Register page: fetching roles...');
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      console.log('🔍 Fetching roles from API...');

      // Use direct axios call without auth headers for public access
      const response = await axios.get('http://localhost:5000/api/roles');

      if (response.data.success) {
        setRoles(response.data.data || []);
        // Don't automatically set role - let user choose from dropdown
        console.log('✅ Roles loaded successfully:', response.data.data);
        console.log('🔍 Available roles:', response.data.data.map(r => r.name));
      }
    } catch (err) {
      console.error('❌ Error fetching roles:', err);
      // Fallback to default roles if API fails
      const defaultRoles = [
        { _id: '1', name: 'admin', description: 'Full system access' },
        { _id: '2', name: 'manager', description: 'Management level access' },
        { _id: '3', name: 'staff', description: 'Basic staff access' }
      ];
      setRoles(defaultRoles);
      // Don't automatically set role - let user choose from dropdown
      console.log('✅ Using fallback roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    console.log('🔍 Form change detected:', e.target.name, '=', e.target.value);
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!form.role) {
      setError('Please select a role');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
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

    if (!validateForm()) return;

    setLoading(true);
    try {
      const formToSend = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        store: form.store.trim() === '' ? undefined : form.store
      };

      console.log('🔍 Submitting form with role:', form.role);
      console.log('🔍 Full form data being sent:', JSON.stringify(formToSend, null, 2));

      await register(formToSend);

      setSuccess('Registration successful! Please check your email to verify your account.');

      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        store: ''
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="w-full max-w-md mx-auto my-4">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-3 sm:mb-4">
            <Store className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2">Create Account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Join SmartKirana</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/60 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/60 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
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
                  placeholder="Create a strong password"
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
                    <EyeOff className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
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
                    <EyeOff className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <select
                  id="role"
                  name="role"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  value={form.role}
                  onChange={handleChange}
                  disabled={rolesLoading}
                  required
                >
                  {rolesLoading ? (
                    <option value="">Loading roles...</option>
                  ) : (
                    <>
                      <option value="">Select a role...</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role.name}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)} - {role.description}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              {!rolesLoading && roles.length === 0 && (
                <p className="text-sm text-red-500">No roles available. Please contact administrator.</p>
              )}
            </div>

            {/* Removed Store/Supplier fields per request */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium hover:underline"
                  onClick={() => navigate('/login')}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
