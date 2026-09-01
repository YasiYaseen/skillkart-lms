import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '@components/common/BrandLogo';
import Button from '@components/common/Button';
import NotificationBell from '@components/common/NotificationBell';
import ThemeToggle from '@components/common/ThemeToggle';
import UserDropdown from '@components/common/UserDropdown';
import { AuthModals } from '@features/auth';
import { useAuth } from '@features/auth/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { api } from '@/lib/api';
import {
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  HeartIcon,
  TrophyIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  PlusCircleIcon,
  UsersIcon,
  FolderIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  Cog6ToothIcon,
  SparklesIcon,
  UserPlusIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

function Header() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [maintenance, setMaintenance] = useState<{ mode: boolean; message: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const { user, logout } = useAuth();
  const { cart, removeFromCart, cartTotal, cartCount } = useCart();
  const { formatAmount } = useCurrency();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key press or window resize to desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    setMobileMenuOpen(false);
    setAuthMode('login');
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setAuthMode('register');
  };

  const handleCloseAuth = () => {
    setAuthMode(null);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <>
      {maintenance?.mode && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-xs z-50 print:hidden">
          <ExclamationTriangleIcon className="w-4 h-4 text-white shrink-0" />
          <span>{maintenance.message}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors print:hidden">
        <div className="container mx-auto flex items-center justify-between h-16 md:h-18 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <BrandLogo />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 ml-8">
            {user && user.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Admin Panel
                </Link>
                <Link
                  to="/courses"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/courses'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Course Catalog
                </Link>
              </>
            )}

            {user && user.role === 'instructor' && (
              <>
                <Link
                  to="/instructor"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/instructor')
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Instructor Studio
                </Link>
                <Link
                  to="/courses"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/courses'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Explore Catalog
                </Link>
              </>
            )}

            {user && user.role === 'student' && (
              <>
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/courses"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/courses'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Explore Courses
                </Link>
                <Link
                  to="/my-courses"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/my-courses'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  My Learning
                </Link>
                <Link
                  to="/study-hub"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/study-hub'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Study Hub
                </Link>
                <Link
                  to="/wishlist"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/wishlist'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Wishlist
                </Link>
                <Link
                  to="/my-certificates"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/my-certificates'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Certificates
                </Link>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/courses"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/courses'
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Explore Courses
                </Link>
                <a
                  href="/login"
                  onClick={handleLoginClick}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Login
                </a>
              </>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Shopping Cart with Interactive Dropdown */}
            <div className="relative group">
              <Link
                to="/cart"
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center rounded-lg"
                title="Shopping Cart"
                aria-label="Shopping Cart"
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

              {/* Hover Mini-Cart Flyout (Desktop only) */}
              <div className="hidden lg:block absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
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
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRegisterClick}
                >
                  Create Account
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationBell />
                <UserDropdown />
              </div>
            )}

            {/* Mobile Hamburger Toggle Button (Visible on < 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER MENU (Visible when mobileMenuOpen is true)       */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 z-10"
          >
            {/* Top Header inside Drawer */}
            <div>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <BrandLogo size="sm" />

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card / Guest Welcome */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                {user ? (
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Sign in to access your enrolled courses, certifications, and progress.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleLoginClick}
                        className="w-full py-2 px-3 text-xs font-semibold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeftOnRectangleIcon className="w-4 h-4 text-slate-500" />
                        <span>Log In</span>
                      </button>
                      <button
                        onClick={handleRegisterClick}
                        className="w-full py-2 px-3 text-xs font-semibold text-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <UserPlusIcon className="w-4 h-4 text-white" />
                        <span>Register</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Menu Items List */}
              <nav className="p-3 space-y-1">
                {/* 1. Student Navigation */}
                {user && user.role === 'student' && (
                  <>
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HomeIcon className="w-5 h-5 text-slate-400" />
                      <span>Home</span>
                    </Link>
                    <Link
                      to="/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/courses'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <BookOpenIcon className="w-5 h-5 text-slate-400" />
                      <span>Explore Courses</span>
                    </Link>
                    <Link
                      to="/my-courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/my-courses'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <AcademicCapIcon className="w-5 h-5 text-slate-400" />
                      <span>My Learning</span>
                    </Link>
                    <Link
                      to="/study-hub"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/study-hub'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                      <span>Study Hub & Notes</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/wishlist'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HeartIcon className="w-5 h-5 text-slate-400" />
                      <span>Wishlist</span>
                    </Link>
                    <Link
                      to="/my-certificates"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/my-certificates'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <TrophyIcon className="w-5 h-5 text-slate-400" />
                      <span>My Certificates</span>
                    </Link>
                    <Link
                      to="/purchase-history"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/purchase-history'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ReceiptPercentIcon className="w-5 h-5 text-slate-400" />
                      <span>Purchase History</span>
                    </Link>
                  </>
                )}

                {/* 2. Instructor Navigation */}
                {user && user.role === 'instructor' && (
                  <>
                    <Link
                      to="/instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/instructor'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Squares2X2Icon className="w-5 h-5 text-slate-400" />
                      <span>Instructor Dashboard</span>
                    </Link>
                    <Link
                      to="/instructor/create-course"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/instructor/create-course'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <PlusCircleIcon className="w-5 h-5 text-slate-400" />
                      <span>Create New Course</span>
                    </Link>
                    <Link
                      to="/instructor/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/instructor/courses'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <BookOpenIcon className="w-5 h-5 text-slate-400" />
                      <span>Manage Courses</span>
                    </Link>
                    <Link
                      to="/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/courses'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <SparklesIcon className="w-5 h-5 text-slate-400" />
                      <span>Explore Catalog</span>
                    </Link>
                  </>
                )}

                {/* 3. Admin Navigation */}
                {user && user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/admin'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Squares2X2Icon className="w-5 h-5 text-slate-400" />
                      <span>Admin Dashboard</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/admin/users'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <UsersIcon className="w-5 h-5 text-slate-400" />
                      <span>User Management</span>
                    </Link>
                    <Link
                      to="/admin/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/admin/settings'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-slate-400" />
                      <span>System Settings</span>
                    </Link>
                    <Link
                      to="/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/courses'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <BookOpenIcon className="w-5 h-5 text-slate-400" />
                      <span>Course Catalog</span>
                    </Link>
                  </>
                )}

                {/* 4. Guest Navigation */}
                {!user && (
                  <>
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HomeIcon className="w-5 h-5 text-slate-400" />
                      <span>Home</span>
                    </Link>
                    <Link
                      to="/courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/courses'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <BookOpenIcon className="w-5 h-5 text-slate-400" />
                      <span>Explore Courses</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Bottom Actions inside Drawer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-850/50">
              {/* Shopping Cart Summary Link */}
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Cart ({cartCount})</span>
                </div>
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                  {formatAmount(cartTotal)}
                </span>
              </Link>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModals
        isOpen={!!authMode}
        initialMode={authMode || 'login'}
        onClose={handleCloseAuth}
      />
    </>
  );
}

export default Header;
