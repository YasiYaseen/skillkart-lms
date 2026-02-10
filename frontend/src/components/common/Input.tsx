import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

/**
 * Input Component
 * Reusable input field with label and error message
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', fullWidth = true, ...props }, ref) => {
        const inputClasses = `
            w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all
            placeholder:text-gray-400 text-gray-900
            ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-300'
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
                    <label className="text-sm font-medium text-gray-700 ml-1">
                        {label}
                    </label>
                )}
                <input ref={ref} className={inputClasses} {...props} />
                {error && (
                    <span className="text-xs text-red-500 ml-1">{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
