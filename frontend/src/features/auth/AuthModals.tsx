import { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleIcon } from '@/assets/icons';
import { toast } from 'react-toastify';
import { getOnboardingStatus, loginWithGoogle, loginWithEmail, registerWithEmail } from './auth.service';
import { useAuth } from './AuthContext';

interface AuthModalsProps {
    isOpen: boolean;
    initialMode: 'login' | 'register';
    onClose: () => void;
}

function AuthModals({ isOpen, initialMode, onClose }: AuthModalsProps) {
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Reset mode when opening modal
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    const handleAuthSuccess = async (token: string, user: any) => {
        login(token, user);

        try {
            const status = await getOnboardingStatus();
            if (status?.user) {
                login(token, status.user);
                user = status.user;
            }
        } catch {
            // Ignore sync error and fallback to login response payload
        }

        onClose();
        if (!user.onboardingCompleted) {
            navigate('/onboarding');
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
            if (mode === 'login') {
                const { token, user } = await loginWithEmail({ email, password });
                await handleAuthSuccess(token, user);
            } else {
                const { token, user } = await registerWithEmail({ name, email, password });
                await handleAuthSuccess(token, user);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication error');
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === 'login';

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isLogin ? 'Sign in to LMS' : 'Create your account'}
                </h2>
                <p className="text-gray-500 text-sm">
                    {isLogin
                        ? 'Welcome back! Please sign in to continue'
                        : 'Welcome! Please fill in the details to get started.'}
                </p>
            </div>

            {/* Google Button */}
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
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">or</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
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

                <Input
                    type="password"
                    placeholder="Enter your password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button type="submit" disabled={loading} className="w-full justify-center mt-2" size="lg">
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? (
                    <>
                        Don't have an account?{' '}
                        <button
                            onClick={() => setMode('register')}
                            type="button"
                            className="font-semibold text-gray-900 hover:underline hover:text-blue-600"
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
                            className="font-semibold text-gray-900 hover:underline hover:text-blue-600"
                        >
                            Sign in
                        </button>
                    </>
                )}
            </div>

            {/* Development Mode Badge */}
            {/* <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 font-medium bg-orange-50 py-1.5 rounded-lg">
                    <span>Secured by Component</span>
                    <span className="px-1.5 py-0.5 bg-orange-100 rounded text-[10px] uppercase tracking-wider">Development mode</span>
                </div>
            </div> */}
        </Modal>
    );
}

export default AuthModals;
