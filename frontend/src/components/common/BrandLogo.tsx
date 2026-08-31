import { Link } from 'react-router-dom';
import { SkillKartIcon } from '@/assets/icons';

interface BrandLogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    subtitle?: string;
    to?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({
    className = '',
    iconClassName = '',
    textClassName = '',
    subtitle,
    to = '/',
    size = 'md',
}: BrandLogoProps) {
    const sizeMap = {
        sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[10px]' },
        md: { icon: 'w-8 h-8', text: 'text-xl', sub: 'text-xs' },
        lg: { icon: 'w-10 h-10', text: 'text-2xl', sub: 'text-sm' },
    };

    const currentSize = sizeMap[size];

    const content = (
        <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
            <div className="shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs rounded-lg">
                <SkillKartIcon className={iconClassName || currentSize.icon} />
            </div>
            <div className="flex flex-col leading-none">
                <div className={`font-bold tracking-tight text-slate-900 dark:text-white flex items-center ${textClassName || currentSize.text}`}>
                    <span>Skill</span>
                    <span className="text-blue-600 dark:text-blue-400">Kart</span>
                </div>
                {subtitle && (
                    <span className={`text-slate-500 dark:text-slate-400 font-medium mt-0.5 ${currentSize.sub}`}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );

    if (!to) return content;

    return (
        <Link to={to} className="inline-flex items-center">
            {content}
        </Link>
    );
}

export default BrandLogo;
