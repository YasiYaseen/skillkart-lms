import { Link } from 'react-router-dom';
import { GraduationCapIcon } from '../../assets/icons';
import Button from '../common/Button';

/**
 * Header Component
 * Main navigation header with logo, nav links, and auth buttons
 */
function Header() {
    return (
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
                    <Link to="/login" className="header-nav-link">
                        Login
                    </Link>
                </nav>

                {/* Actions */}
                <div className="header-actions">
                    <Button variant="primary" size="md" as="link" to="/register">
                        Create Account
                    </Button>
                </div>
            </div>
        </header>
    );
}

export default Header;
