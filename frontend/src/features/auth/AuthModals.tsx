import { useState } from 'react';
import { Button, Input, Modal } from '../../components/common';
import { useNavigate } from 'react-router-dom';

interface AuthModalsProps {
    isOpen: boolean;
    initialMode: 'login' | 'register';
    onClose: () => void;
}

function AuthModals({ isOpen, initialMode, onClose }: AuthModalsProps) {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const navigate = useNavigate();

    // Reset mode when reopening
    if (!isOpen && mode !== initialMode) {
        setMode(initialMode);
    }

    const handleGoogleLogin = () => {
        // Mock Google Login
        console.log('Google login clicked');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock Auth
        console.log(`Submitting ${mode} form`);
        onClose();

        // If registering, go to onboarding (mock flow)
        if (mode === 'register') {
            navigate('/onboarding');
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
            <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mb-6 group"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                <span className="text-gray-700 font-medium group-hover:text-gray-900">Continue with Google</span>
            </button>

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
                <Input
                    type="email"
                    placeholder="Enter your email address"
                    label="Email address"
                    required
                />

                <Input
                    type="password"
                    placeholder="Enter your password"
                    label="Password"
                    required
                />

                <Button type="submit" className="w-full justify-center mt-2" size="lg">
                    {isLogin ? 'Continue' : 'Continue'}
                </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? (
                    <>
                        Don't have an account?{' '}
                        <button
                            onClick={() => setMode('register')}
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
                            className="font-semibold text-gray-900 hover:underline hover:text-blue-600"
                        >
                            Sign in
                        </button>
                    </>
                )}
            </div>

            {/* Development Mode Badge */}
            <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 font-medium bg-orange-50 py-1.5 rounded-lg">
                    <span>Secured by Component</span>
                    <span className="px-1.5 py-0.5 bg-orange-100 rounded text-[10px] uppercase tracking-wider">Development mode</span>
                </div>
            </div>
        </Modal>
    );
}

export default AuthModals;
