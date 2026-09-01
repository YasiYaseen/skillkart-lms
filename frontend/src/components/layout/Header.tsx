import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCapIcon } from '@assets/icons';
import Button from '@components/common/Button';
import NotificationBell from '@components/common/NotificationBell';
import ThemeToggle from '@components/common/ThemeToggle';
import UserDropdown from '@components/common/UserDropdown';
import { AuthModals } from '@features/auth';
import { useAuth } from '@features/auth/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { api } from '@/lib/api';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';

function Header() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [maintenance, setMaintenance] = useState<{ mode: boolean; message: string } | null>(null);

  const { user, logout } = useAuth();
  const { cart, removeFromCart, cartTotal, cartCount } = useCart();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    api.get('/settings/public')
      .then((res) => {
        if (res.data?.maintenanceMode) {
          setMaintenance({
            mode: true,
            message: res.data.maintenanceMessage || 'Platform Maintenance is currently underway.',
          });
        }
      })
      .catch(() => {});
  }, []);

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
      {maintenance?.mode && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-xs z-50">
          <ExclamationTriangleIcon className="w-4 h-4 text-white shrink-0" />
          <span>{maintenance.message}</span>
        </div>
      )}
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
                <>
                  <Link to="/admin" className="header-nav-link">
                    Admin Panel
                  </Link>
                  <Link to="/courses" className="header-nav-link">
                    Course Catalog
                  </Link>
                </>
              )}

              {user && user.role === 'instructor' && (
                <>
                  <Link to="/instructor" className="header-nav-link">
                    Instructor Studio
                  </Link>
                  <Link to="/courses" className="header-nav-link">
                    Explore Catalog
                  </Link>
                </>
              )}

              {user && user.role === 'student' && (
                <>
                  <Link to="/" className="header-nav-link font-semibold">
                    Home
                  </Link>
                  <Link to="/courses" className="header-nav-link">
                    Explore Courses
                  </Link>
                  <Link to="/my-courses" className="header-nav-link">
                    My Learning
                  </Link>
                  <Link to="/study-hub" className="header-nav-link">
                    Study Hub
                  </Link>
                  <Link to="/wishlist" className="header-nav-link">
                    Wishlist
                  </Link>
                  <Link to="/my-certificates" className="header-nav-link">
                    Certificates
                  </Link>
                </>
              )}

              {!user && (
                <>
                  <Link to="/courses" className="header-nav-link">
                    Explore Courses
                  </Link>
                  <a
                    href="/login"
                    onClick={handleLoginClick}
                    className="header-nav-link"
                  >
                    Login
                  </a>
                </>
              )}
            </nav>

            {/* Shopping Cart with Interactive Dropdown */}
            <div className="relative group">
              <Link
                to="/cart"
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center rounded-lg"
                title="Shopping Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Hover Mini-Cart Flyout */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Shopping Cart ({cartCount})
                  </span>
                  <Link to="/cart" className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    View Cart
                  </Link>
                </div>

                {cart.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <p>Your cart is empty</p>
                    <Link to="/courses" className="mt-2 inline-block text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Explore courses →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 pt-3">
                    <div className="max-h-52 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                      {cart.slice(0, 3).map((item) => (
                        <div key={item.courseId} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                          <div className="truncate flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{formatAmount(item.price)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              removeFromCart(item.courseId);
                            }}
                            className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {cart.length > 3 && (
                      <p className="text-[10px] text-slate-400 text-center">
                        + {cart.length - 3} more item(s) in cart
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>Total:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">{formatAmount(cartTotal)}</span>
                    </div>

                    <Link
                      to="/cart"
                      className="block w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-center text-xs font-bold rounded-lg transition-colors shadow-2xs"
                    >
                      Checkout Now
                    </Link>
                  </div>
                )}
              </div>
            </div>

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
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserDropdown />
              </div>
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
