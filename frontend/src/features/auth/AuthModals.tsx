import { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleIcon } from '@/assets/icons';
import { toast } from 'react-toastify';
import { getOnboardingStatus, loginWithGoogle, loginWithEmail, registerWithEmail, requestPasswordReset, AuthUser } from './auth.service';
import { useAuth } from './AuthContext';

interface AuthModalsProps {
    isOpen: boolean;
    initialMode: 'login' | 'register' | 'forgot';
    onClose: () => void;
}

function AuthModals({ isOpen, initialMode, onClose }: AuthModalsProps) {
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const navigate = useNavigate();

    // Reset mode when opening modal
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setForgotSuccess(false);
        }
    }, [isOpen, initialMode]);

    const handleAuthSuccess = async (token: string, initialUser: AuthUser) => {
        let currentUser = initialUser;
        login(token, currentUser);

        try {
            const status = await getOnboardingStatus();
            if (status?.user) {
                login(token, status.user);
                currentUser = status.user;
            }
        } catch {
            // Ignore sync error and fallback to login response payload
        }

        onClose();
        if (!currentUser.onboardingCompleted) {
            navigate('/onboarding');
        } else if (currentUser.role === 'admin') {
            navigate('/admin');
        } else if (currentUser.role === 'instructor') {
            navigate('/instructor');
        } else {
            navigate('/');
        }
    };

    const googleLoginBtn = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const { token, user } = await loginWithGoogle(tokenResponse.access_token);
                await handleAuthSuccess(token, user);
            } catch {
                toast.error('Login failed');
            }
        },
        onError: () => {
            toast.error('Login failed');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'forgot') {
                const res = await requestPasswordReset(email);
                setForgotSuccess(true);
                toast.success(res.message || 'Password reset link sent!');
            } else if (mode === 'login') {
                const { token, user } = await loginWithEmail({ email, password });
                await handleAuthSuccess(token, user);
            } else {
                const { token, user } = await registerWithEmail({ name, email, password });
                await handleAuthSuccess(token, user);
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Authentication error';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === 'login';
    const isForgot = mode === 'forgot';

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isForgot
                        ? 'Reset your password'
                        : isLogin
                        ? 'Sign in to LMS'
                        : 'Create your account'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isForgot
                        ? 'Enter your email address and we will send you a link to reset your password.'
                        : isLogin
                        ? 'Welcome back! Please sign in to continue'
                        : 'Welcome! Please fill in the details to get started.'}
                </p>
            </div>

            {/* Google Button (only on login/register) */}
            {!isForgot && (
                <>
                    <div className="mb-6">
                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            onClick={() => googleLoginBtn()}
                            type="button"
                        >
                            <GoogleIcon className="w-5 h-5 mr-3" />
                            Sign in with Google
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">or</span>
                        </div>
                    </div>
                </>
            )}

            {/* Forgot Password Success Message */}
            {isForgot && forgotSuccess ? (
                <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                        <div className="text-emerald-600 dark:text-emerald-400 text-2xl mb-1">✉️</div>
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Check your inbox</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            If <span className="font-semibold">{email}</span> is registered, we've sent password reset instructions.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-center"
                        onClick={() => {
                            setForgotSuccess(false);
                            setMode('login');
                        }}
                    >
                        Back to Sign In
                    </Button>
                </div>
            ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && !isForgot && (
                        <Input
                            type="text"
                            placeholder="Enter your full name"
                            label="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}
                    <Input
                        type="email"
                        placeholder="Enter your email address"
                        label="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    {!isForgot && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotSuccess(false);
                                            setMode('forgot');
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full justify-center mt-2" size="lg">
                        {loading
                            ? 'Processing...'
                            : isForgot
                            ? 'Send Reset Link'
                            : isLogin
                            ? 'Sign In'
                            : 'Create Account'}
                    </Button>
                </form>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                {isForgot ? (
                    <button
                        onClick={() => {
                            setForgotSuccess(false);
                            setMode('login');
                        }}
                        type="button"
                        className="font-semibold text-gray-900 dark:text-white hover:underline hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1"
                    >
                        ← Back to sign in
                    </button>
                ) : isLogin ? (
                    <>
                        Don't have an account?{' '}
                        <button
                            onClick={() => setMode('register')}
                            type="button"
                            className="font-semibold text-gray-900 dark:text-white hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Sign up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{' '}
                        <button
                            onClick={() => setMode('login')}
                            type="button"
                            className="font-semibold text-gray-900 dark:text-white hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Sign in
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default AuthModals;
