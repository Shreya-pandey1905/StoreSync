import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '../services/authService.ts';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const didVerifyRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. The token is missing.');
      return;
    }

    // React 18 StrictMode runs effects twice in development; guard to avoid double-verifying.
    if (didVerifyRef.current) return;
    didVerifyRef.current = true;

    const verify = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Email verified successfully! You can now log in.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        const msg = err.response?.data?.message || err.message;
        const isNetworkError = !err.response && (err.message?.includes('Network') || err.code === 'ERR_NETWORK');
        setMessage(
          isNetworkError
            ? 'Unable to reach the server. Please ensure the backend is running and try again.'
            : msg || 'Invalid or expired verification link. Please request a new one from the login page.'
        );
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Email Verification</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 border border-slate-200 dark:border-slate-700">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">Verification Successful!</h2>
              <p className="text-green-600 dark:text-green-400 font-medium mb-4">{message}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Redirecting to login in a few seconds...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">Verification Failed</h2>
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{message}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                You can request a new verification email when logging in, or contact support.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
