import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button, Input } from '@/components/common';
import { resetPasswordWithToken } from '@/features/auth/auth.service';
import { toast } from 'react-toastify';

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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reset password. The link may have expired.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🔐
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a strong new password for your SkillKart account.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="text-emerald-600 dark:text-emerald-400 text-3xl mb-2">✅</div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-base mb-1">
                Password Reset Successfully
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Your new password is now active. You can sign in to continue learning.
              </p>
            </div>

            <Button
              className="w-full justify-center"
              size="lg"
              onClick={() => navigate('/')}
            >
              Back to Home & Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
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
              className="w-full justify-center mt-4"
              size="lg"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
              >
                ← Return to Home
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

