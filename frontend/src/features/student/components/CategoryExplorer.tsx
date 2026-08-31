import { useNavigate } from 'react-router-dom';
import {
    BriefcaseIcon,
    ChartBarIcon,
    PaintBrushIcon,
    CommandLineIcon,
    CpuChipIcon,
    MegaphoneIcon,
    ArrowRightIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';

export interface CategoryTrack {
    id: string;
    name: string;
    tagQuery?: string;
    icon: string;
    gradient?: string;
    description: string;
    courseCount?: number;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
    business: BriefcaseIcon,
    finance: ChartBarIcon,
    design: PaintBrushIcon,
    tech: CommandLineIcon,
    'ai-ml': CpuChipIcon,
    marketing: MegaphoneIcon,
};

const DEFAULT_CATEGORY_TRACKS: CategoryTrack[] = [
    {
        id: 'business',
        name: 'Business & Leadership',
        tagQuery: 'Business',
        icon: 'business',
        description: 'Executive Leadership, Product Management, Strategy & Organizational Design',
    },
    {
        id: 'finance',
        name: 'Finance & Accounting',
        tagQuery: 'Finance',
        icon: 'finance',
        description: 'Financial Modeling, Corporate Valuation, Portfolio Strategy & Economics',
    },
    {
        id: 'design',
        name: 'Design & UX Systems',
        tagQuery: 'Design',
        icon: 'design',
        description: 'UI/UX Architecture, Design Systems, Visual Identity & Interaction Design',
    },
    {
        id: 'tech',
        name: 'Software Engineering',
        tagQuery: 'Web Development',
        icon: 'tech',
        description: 'Full-Stack Web Systems, Cloud Infrastructure, APIs & Distributed Architecture',
    },
    {
        id: 'ai-ml',
        name: 'AI & Data Science',
        tagQuery: 'AI',
        icon: 'ai-ml',
        description: 'Applied Machine Learning, Large Language Models, Data Pipelines & Analytics',
    },
    {
        id: 'marketing',
        name: 'Growth & Marketing',
        tagQuery: 'Marketing',
        icon: 'marketing',
        description: 'Product Marketing, Search Optimization, Analytics & Customer Acquisition',
    },
];

interface CategoryExplorerProps {
    categories?: CategoryTrack[];
    onSelectCategory?: (category: CategoryTrack) => void;
}

export function CategoryExplorer({ categories = DEFAULT_CATEGORY_TRACKS, onSelectCategory }: CategoryExplorerProps) {
    const navigate = useNavigate();

    const handleClick = (cat: CategoryTrack) => {
        if (onSelectCategory) {
            onSelectCategory(cat);
            return;
        }
        const categorySlug = (cat as { slug?: string }).slug || cat.id;
        navigate(`/courses?category=${encodeURIComponent(categorySlug)}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        <Squares2X2Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>Curated Disciplines & Learning Tracks</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Structured curricula designed for practical mastery and industry credentials.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                    const IconComponent = CATEGORY_ICON_MAP[cat.id] || BriefcaseIcon;

                    return (
                        <div
                            key={cat.id}
                            onClick={() => handleClick(cat)}
                            className="group relative p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3.5">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-400 transition-colors">
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                    {cat.courseCount !== undefined && cat.courseCount > 0 && (
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                                            {cat.courseCount} {cat.courseCount === 1 ? 'course' : 'courses'}
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {cat.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                                    {cat.description}
                                </p>
                            </div>

                            <div className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <span>Explore Track</span>
                                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CategoryExplorer;
