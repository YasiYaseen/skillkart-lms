import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCapIcon } from '@assets/icons';
import Button from '@components/common/Button';
import NotificationBell from '@components/common/NotificationBell';
import ThemeToggle from '@components/common/ThemeToggle';
import { AuthModals } from '@features/auth';
import { useAuth } from '@features/auth/AuthContext';
import { useCart } from '@/context/CartContext';

function Header() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  const { user, logout } = useAuth();
  const { cartCount } = useCart();

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
              {user && user.role === 'admin' && (
                <Link to="/admin" className="header-nav-link">
                  Admin Panel
                </Link>
              )}

              {user && user.role === 'instructor' && (
                <Link to="/instructor" className="header-nav-link">
                  Instructor Studio
                </Link>
              )}

              {user && user.role === 'student' && (
                <>
                  <Link to="/my-courses" className="header-nav-link">
                    My Courses
                  </Link>
                  <Link to="/study-hub" className="header-nav-link">
                    Study Hub
                  </Link>
                  <Link to="/wishlist" className="header-nav-link">
                    Wishlist
                  </Link>
                  <Link to="/purchase-history" className="header-nav-link">
                    Orders
                  </Link>
                  <Link to="/my-certificates" className="header-nav-link">
                    My Certificates
                  </Link>
                </>
              )}

              {user && (
                <Link to="/courses/create" className="header-nav-link hidden">
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

            {/* Shopping Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Shopping Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <ThemeToggle />

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
                <div className="flex items-center gap-4 mr-4">
                  <NotificationBell />
                  <Link to="/profile" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    {user.name}
                  </Link>
                </div>

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
