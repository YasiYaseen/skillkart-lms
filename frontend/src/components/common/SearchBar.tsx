import { FormEvent } from 'react';
import { SearchIcon } from '../../assets/icons';

interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    className?: string;
}

/**
 * SearchBar Component
 * Search input with icon and submit button
 */
function SearchBar({
    placeholder = 'Search for courses',
    value = '',
    onChange,
    onSubmit,
    className = ''
}: SearchBarProps) {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit?.(value);
    };

    return (
        <form className={`search-bar ${className}`} onSubmit={handleSubmit}>
            <div className="search-input-wrapper">
                <SearchIcon />
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-primary btn-md">
                Search
            </button>
        </form>
    );
}

export default SearchBar;
