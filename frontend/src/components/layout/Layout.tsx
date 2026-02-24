import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
}

/**
 * Layout Component
 * Wrapper that provides consistent Header + Footer structure
 */
function Layout({  }: LayoutProps) {
    return (
        <div className="layout">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default Layout;
