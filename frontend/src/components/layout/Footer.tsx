import { Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { GraduationCapIcon } from '../../assets/icons';
import Button from '../common/Button';
import { toast } from 'react-toastify';
import { api } from '@/lib/api';

/**
 * Footer Component
 * Site footer with branding, links, and newsletter signup
 */
function Footer() {
    const currentYear = new Date().getFullYear();
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNewsletterSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = newsletterEmail.trim();
        if (!trimmed) return;

        setIsSubmitting(true);
        try {
            const res = await api.post<{ success: boolean; message: string; alreadySubscribed?: boolean }>('/newsletter/subscribe', {
                email: trimmed,
                source: 'footer',
            });
            toast.success(res.data.message || `Thank you! ${trimmed} has been subscribed to our newsletter.`);
            setNewsletterEmail('');
        } catch (error: any) {
            const errMsg = error.response?.data?.message || 'Failed to subscribe. Please try again later.';
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-inner">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <span className="footer-logo-icon">
                                <GraduationCapIcon />
                            </span>
                            SkillKart
                        </div>
                        <p className="footer-description">
                            SkillKart is a modern learning management system designed to help
                            instructors create courses and enable students to learn at their own pace.
                        </p>
                    </div>

                    {/* Company Links */}
                    <div className="footer-section">
                        <h4 className="footer-section-title">Company</h4>
                        <ul className="footer-links">
                            <li>
                                <Link to="/" className="footer-link">Home</Link>
                            </li>
                            <li>
                                <Link to="/about" className="footer-link">About us</Link>
                            </li>
                            <li>
                                <Link to="/contact" className="footer-link">Contact us</Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="footer-link">Privacy policy</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <div className="footer-section">
                        <h4 className="footer-section-title">Subscribe to our newsletter</h4>
                        <div className="footer-newsletter">
                            <p>
                                The latest news, articles, and resources, sent to your inbox weekly.
                            </p>
                            <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
                                <input
                                    type="email"
                                    required
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    className="footer-newsletter-input"
                                    placeholder="Enter your email"
                                />
                                <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="footer-copyright">
                    Copyright {currentYear} © SkillKart. All Rights Reserved.
                </div>
            </div>
        </footer>
    );
}

export default Footer;
