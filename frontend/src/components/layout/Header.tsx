import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCapIcon } from '@assets/icons';
import Button from '@components/common/Button';
import { AuthModals } from '@features/auth';

/**
 * Header Component
 * Main navigation header with logo, nav links, and auth buttons
 */
function Header() {
    const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

    const handleLoginClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setAuthMode('login');
    };

    const handleRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setAuthMode('register');
    };

    const handleCloseAuth = () => {
        setAuthMode(null);
    };

    return (
        <>
            <header className="header">
                <div className="container header-inner">
                    {/* Logo */}
                    <Link to="/" className="header-logo">
                        <span className="header-logo-icon">
                            <GraduationCapIcon />
                        </span>
                        SkillKart
                    </Link>

                    {/* Navigation */}
                    <nav className="header-nav">
                        <Link to="/courses/create" className="header-nav-link">
                            Add Courses
                        </Link>
                        <a href="/login" onClick={handleLoginClick} className="header-nav-link">
                            Login
                        </a>
                    </nav>

                    {/* Actions */}
                    <div className="header-actions">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleRegisterClick}
                        >
                            Create Account
                        </Button>
                    </div>
                </div>
            </header>

            <AuthModals
                isOpen={!!authMode}
                initialMode={authMode || 'login'}
                onClose={handleCloseAuth}
            />
        </>
    );
}

export default Header;
