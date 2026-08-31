import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    isRequired?: boolean;
}

/**
 * Input Component
 * Reusable input field with label and error message
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', fullWidth = true, isRequired, ...props }, ref) => {
        const isMandatory = isRequired ?? props.required;
        const inputClasses = `
            w-full px-4 py-3 bg-white dark:bg-gray-800/90 border rounded-xl outline-none transition-all
            placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white
            ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 hover:border-gray-300 dark:hover:border-gray-600'
            }
            ${className}
        `.trim();

        const containerClasses = `
            flex flex-col gap-1.5
            ${fullWidth ? 'w-full' : ''}
        `.trim();

        return (
            <div className={containerClasses}>
                {label && (
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1 flex items-center">
                        <span>{label}</span>
                        {isMandatory && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <input ref={ref} className={inputClasses} {...props} />
                {error && (
                    <span className="text-xs text-red-500 dark:text-red-400 ml-1">{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
