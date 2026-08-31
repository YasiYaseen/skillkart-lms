import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button, Input } from '@/components/common';
import { resetPasswordWithToken } from '@/features/auth/auth.service';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';
import { LockClosedIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No reset token found in URL. Please check the link from your email.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing password reset token.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await resetPasswordWithToken(token, password);
      setSuccess(true);
      toast.success(res.message || 'Password reset successfully!');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to reset password. The link may have expired.');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/60">
            <LockClosedIcon className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose a strong new password for your SkillKart account.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-5">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-0.5">
                Password Reset Successfully
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Your new password is now active. You can sign in to continue learning.
              </p>
            </div>

            <Button
              className="w-full justify-center"
              size="md"
              onClick={() => navigate('/')}
            >
              Back to Home & Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <div>
              <Input
                type="password"
                label="New Password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token || loading}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token || loading}
              />
            </div>

            <Button
              type="submit"
              disabled={!token || loading}
              className="w-full justify-center mt-2"
              size="md"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>

            <div className="text-center pt-1">
              <Link
                to="/"
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                <span>Return to Home</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
