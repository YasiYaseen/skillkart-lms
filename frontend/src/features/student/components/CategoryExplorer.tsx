import { useNavigate } from 'react-router-dom';

export interface CategoryTrack {
    id: string;
    name: string;
    tagQuery?: string;
    icon: string;
    gradient: string;
    description: string;
    courseCount?: number;
}

const DEFAULT_CATEGORY_TRACKS: CategoryTrack[] = [
    {
        id: 'business',
        name: 'Business & Leadership',
        tagQuery: 'Business',
        icon: '💼',
        gradient: 'from-blue-600/15 via-sky-600/10 to-indigo-900/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
        description: 'Executive Leadership, Product Management, Scaling Startups & Agile Strategy',
    },
    {
        id: 'finance',
        name: 'Finance & Accounting',
        tagQuery: 'Finance',
        icon: '📈',
        gradient: 'from-emerald-600/15 via-teal-600/10 to-emerald-900/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        description: 'Financial Modeling, Stock Valuation, Personal Wealth & Corporate Accounting',
    },
    {
        id: 'design',
        name: 'Design & Creative Arts',
        tagQuery: 'Design',
        icon: '🎨',
        gradient: 'from-rose-600/15 via-pink-600/10 to-rose-900/5 border-rose-500/20 text-rose-600 dark:text-rose-400',
        description: 'UI/UX, Figma Design Systems, 3D Art, Motion Graphics & Visual Identity',
    },
    {
        id: 'tech',
        name: 'Software & Web Engineering',
        tagQuery: 'Web Development',
        icon: '💻',
        gradient: 'from-purple-600/15 via-violet-600/10 to-purple-900/5 border-purple-500/20 text-purple-600 dark:text-purple-400',
        description: 'Full-Stack Development, React, Cloud Microservices & Distributed Architecture',
    },
    {
        id: 'ai-ml',
        name: 'AI, LLMs & Data Science',
        tagQuery: 'AI',
        icon: '🤖',
        gradient: 'from-amber-600/15 via-orange-600/10 to-amber-900/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
        description: 'Generative AI, Neural Networks, Predictive Analytics & Large Language Models',
    },
    {
        id: 'marketing',
        name: 'Digital Marketing & Growth',
        tagQuery: 'Marketing',
        icon: '📣',
        gradient: 'from-cyan-600/15 via-blue-600/10 to-cyan-900/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
        description: 'Growth Hacking, SEO, Brand Positioning, Funnel Optimization & Social Strategy',
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
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>🎯</span>
                        <span>Explore by Career Path & Skill Tracks</span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Hand-picked structured curricula designed to take you from foundational to production-ready.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => handleClick(cat)}
                        className={`group relative p-5 rounded-3xl bg-linear-to-br ${cat.gradient} border backdrop-blur-xs shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between`}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {cat.icon}
                                </div>
                                {cat.courseCount !== undefined && cat.courseCount > 0 && (
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 shadow-2xs font-mono">
                                        {cat.courseCount} {cat.courseCount === 1 ? 'course' : 'courses'}
                                    </span>
                                )}
                            </div>

                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {cat.name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-4">
                                {cat.description}
                            </p>
                        </div>

                        <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1.5 group-hover:translate-x-1 transition-transform">
                            <span>Browse Track</span>
                            <span>→</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CategoryExplorer;
