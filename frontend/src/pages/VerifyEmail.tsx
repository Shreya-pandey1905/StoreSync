import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { verifyEmail, verifySignupOtp, resendSignupOtp } from '../services/authService.ts';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [emailInput, setEmailInput] = useState(emailParam || '');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const didVerifyRef = useRef(false);

  useEffect(() => {
    if (emailParam) setEmailInput(emailParam);
  }, [emailParam]);

  // Legacy: magic link ?token=
  useEffect(() => {
    if (!token) return;

    if (didVerifyRef.current) return;
    didVerifyRef.current = true;

    setStatus('loading');
    const run = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Email verified! You can now log in.');
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
            ? 'Unable to reach the server. Ensure the backend is running.'
            : msg || 'Invalid or expired link.'
        );
      }
    };
    run();
  }, [token, navigate]);

  const emailForOtp = (emailParam || emailInput).trim();

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!emailForOtp) {
      setMessage('Email is required');
      return;
    }
    if (!otp.trim()) {
      setMessage('Enter the 6-digit code');
      return;
    }

    setSubmitting(true);
    try {
      await verifySignupOtp(emailForOtp, otp.trim());
      setStatus('success');
      setMessage('Email verified! Redirecting…');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailForOtp) {
      setMessage('Enter your email first');
      return;
    }
    setResending(true);
    setMessage('');
    try {
      await resendSignupOtp(emailForOtp);
      setMessage('If this account is pending verification, a new code was sent.');
    } catch {
      setMessage('If this account is pending verification, a new code was sent.');
    } finally {
      setResending(false);
    }
  };

  // Magic-link flow
  if (token) {
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
  }

  // OTP flow (signup verification)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verify your email</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter the 6-digit code we sent to your inbox.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 border border-slate-200 dark:border-slate-700">
          {status === 'success' ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 dark:text-green-400 font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {!emailParam && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white tracking-[0.4em] text-center text-lg font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </div>

              {message && (
                <p className={`text-sm ${message.includes('sent') || message.includes('new code') ? 'text-slate-600 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Verifying…' : 'Verify & continue'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || !emailForOtp}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full text-sm text-slate-500 dark:text-slate-400"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
