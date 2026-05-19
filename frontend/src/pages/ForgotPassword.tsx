import React, { useState } from 'react';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset, verifyPasswordResetOtp } from '../services/authService.ts';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setInfo('If that email is registered, we sent a verification code.');
      setStep(2);
    } catch (err: any) {
      if (err.response?.status === 503) {
        setError(err.response?.data?.message || 'Could not send email. Check server email settings or LOG_OTP_TO_CONSOLE in backend/.env.');
        return;
      }
      setInfo('If that email is registered, we sent a verification code.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyPasswordResetOtp(email.trim(), otp.trim());
      if (!result.success || !result.resetToken) {
        setError(result.message || 'Invalid code');
        return;
      }
      navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
            <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Reset password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {step === 1 ? 'We’ll email you a verification code.' : 'Enter the code from your email.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 md:p-8 border border-slate-200 dark:border-slate-700">
          {step === 1 ? (
            <form onSubmit={sendOtp} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyAndContinue} className="space-y-6">
              {info && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-800 dark:text-green-200">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {info}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Continue'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
