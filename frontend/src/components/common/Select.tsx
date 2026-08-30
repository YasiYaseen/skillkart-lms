import { SelectHTMLAttributes, forwardRef } from 'react';

interface Option {
    label: string;
    value: string | number;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Option[];
    fullWidth?: boolean;
    placeholder?: string;
}

/**
 * Select Component
 * Reusable select dropdown with label and error message
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = '', fullWidth = true, ...props }, ref) => {
        const selectClasses = `
            w-full px-4 py-3 bg-white dark:bg-gray-800/90 border rounded-xl outline-none transition-all appearance-none cursor-pointer
            text-gray-900 dark:text-white
            ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 hover:border-gray-300 dark:hover:border-gray-600'
            }
            ${className}
        `.trim();

        const containerClasses = `
            flex flex-col gap-1.5 relative
            ${fullWidth ? 'w-full' : ''}
        `.trim();

        return (
            <div className={containerClasses}>
                {label && (
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select ref={ref} className={selectClasses} {...props}>
                        {placeholder && (
                            <option value="" disabled selected className="bg-white dark:bg-gray-800 text-gray-400">
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* Chevron Icon */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </div>
                {error && (
                    <span className="text-xs text-red-500 dark:text-red-400 ml-1">{error}</span>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
