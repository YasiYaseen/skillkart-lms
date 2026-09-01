import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuth } from '@/features/auth/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import UserDropdown from '@/components/common/UserDropdown';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// Sidebar nav items
const NAV_ITEMS = [
    {
        label: 'Dashboard',
        path: '/instructor',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        ),
    },
    {
        label: 'Add Course',
        path: '/instructor/create-course',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        ),
    },
    {
        label: 'My Courses',
        path: '/instructor/courses',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
    {
        label: 'Student Enrolled',
        path: '/instructor/students',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
    },
    {
        label: 'Announcements',
        path: '/instructor/announcements',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
        ),
    },
    {
        label: 'Assignments & Gradebook',
        path: '/instructor/assignments',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        ),
    },
    {
        label: 'Coupons & Discounts',
        path: '/instructor/coupons',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
            </svg>
        ),
    },
    {
        label: 'Analytics',
        path: '/instructor/analytics',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        ),
    },
    {
        label: 'Earnings & Payouts',
        path: '/instructor/earnings',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
        ),
    },
];

export function InstructorLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Auto close drawer on route change
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    // Handle ESC key and resize
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileDrawerOpen(false);
        };
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileDrawerOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (mobileDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileDrawerOpen]);

    const handleLogout = () => {
        setMobileDrawerOpen(false);
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
            {/* Top Header */}
            <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-gray-900 sticky top-0 z-40 transition-colors">
                <div className="flex items-center gap-3">
                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-hidden cursor-pointer"
                        aria-label="Toggle instructor menu"
                        aria-expanded={mobileDrawerOpen}
                    >
                        {mobileDrawerOpen ? (
                            <XMarkIcon className="w-6 h-6" />
                        ) : (
                            <Bars3Icon className="w-6 h-6" />
                        )}
                    </button>

                    <BrandLogo subtitle="Instructor Studio" to="/instructor" />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hidden sm:inline-block">
                        Instructor Studio
                    </span>

                    <div className="pl-2 border-l border-gray-200 dark:border-gray-700">
                        <UserDropdown />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 relative">
                {/* Desktop Sidebar (Visible on md and above) */}
                <aside className="w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 hidden md:flex flex-col justify-between transition-colors sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    <nav className="py-6 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-3
                                        ${isActive
                                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-transparent'
                                        }
                                    `}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
                        <Link
                            to="/"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            Back to Site
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Mobile Slide-Over Drawer Navigation */}
                {mobileDrawerOpen && (
                    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                            onClick={() => setMobileDrawerOpen(false)}
                        />

                        {/* Slide-out Drawer */}
                        <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-250 z-10">
                            <div>
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                                    <BrandLogo subtitle="Instructor Studio" size="sm" to="/instructor" />
                                    <button
                                        type="button"
                                        onClick={() => setMobileDrawerOpen(false)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        aria-label="Close instructor menu"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <nav className="py-3 space-y-1">
                                    {NAV_ITEMS.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setMobileDrawerOpen(false)}
                                                className={`
                                                    flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3
                                                    ${isActive
                                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 font-semibold'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-transparent'
                                                    }
                                                `}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
                                <Link
                                    to="/"
                                    onClick={() => setMobileDrawerOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                    </svg>
                                    Back to Site
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-950 overflow-x-auto min-w-0 transition-colors">
                    <Outlet />
                </main>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 bg-white dark:bg-gray-900 mt-auto transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <BrandLogo subtitle="Instructor Hub" size="sm" to="/instructor" />
                    <p>&copy; {new Date().getFullYear()} SkillKart. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default InstructorLayout;
