import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCapIcon } from '@assets/icons';
import Button from '@components/common/Button';
import { AuthModals } from '@features/auth';
import { useAuth } from '@features/auth/AuthContext';

function Header() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  const { user, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
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



          {/* Actions */}
          <div className="header-actions">
            {/* Navigation */}
            <nav className="header-nav ml-auto">
              <Link to="/instructor" className="header-nav-link">
                Instructor Studio
              </Link>

              {user && (
                <Link to="/courses/create" className="header-nav-link">
                  Add Courses
                </Link>
              )}

              {!user && (
                <a
                  href="/login"
                  onClick={handleLoginClick}
                  className="header-nav-link"
                >
                  Login
                </a>
              )}
            </nav>

            {!user ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleRegisterClick}
              >
                Create Account
              </Button>
            ) : (
              <>
                <span className="mr-4 text-sm font-medium">
                  {user.name}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
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
