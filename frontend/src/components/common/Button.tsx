import { Link } from 'react-router-dom';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    as?: 'button' | 'link';
    to?: string;
    className?: string;
}

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */
function Button({
    children,
    variant = 'primary',
    size = 'md',
    as = 'button',
    to,
    className = '',
    ...props
}: ButtonProps) {
    const classes = `btn btn-${variant} btn-${size} ${className}`.trim();

    if (as === 'link' && to) {
        return (
            <Link to={to} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}

export default Button;
