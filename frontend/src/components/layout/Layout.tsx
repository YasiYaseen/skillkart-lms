import Header from './Header';
import Footer from './Footer';
import { Outlet, useLocation } from 'react-router-dom';

interface LayoutProps {
    showFooter?: boolean;
}

/**
 * Layout Component
 * Wrapper that provides consistent Header + main structure.
 * Displays the full marketing footer exclusively on the landing page (/),
 * giving all inner app and learning pages a clean, distraction-free interface.
 */
function Layout({ showFooter }: LayoutProps) {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';
    const shouldShowFooter = showFooter !== undefined ? showFooter : isLandingPage;

    return (
        <div className="layout">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            {shouldShowFooter && <Footer />}
        </div>
    );
}

export default Layout;
