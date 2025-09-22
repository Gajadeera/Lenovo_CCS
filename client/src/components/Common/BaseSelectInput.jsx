import { FiChevronDown } from 'react-icons/fi';
import { useDarkMode } from '../../../context/DarkModeContext';

const BaseSelectInput = ({
    id,
    name,
    label,
    value,
    onChange,
    options,
    isLoading,
    icon: Icon,
    required,
    placeholder,
    className = '',
    compact = false,
    dense = false,
    ...rest
}) => {
    const { isDark } = useDarkMode();
    const heightClass = compact ? 'py-1' : dense ? 'py-0.5' : 'py-1.5';
    const textSizeClass = compact ? 'text-xs' : 'text-sm';
    const iconSize = compact ? 14 : dense ? 12 : 14;

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className={`block font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} ${textSizeClass} flex items-center`}
                >
                    {Icon && (
                        <Icon
                            className={`mr-1.5 ${isDark ? 'text-blue-400' : 'text-[#1E4065]'}`}
                            size={iconSize}
                        />
                    )}
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}

            <div className="relative">
                <select
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={isLoading}
                    className={`block w-full pl-2  ${heightClass} rounded-md border shadow-sm focus:outline-none focus:ring-1 focus:ring-[#65C2CB] focus:border-[#1E4065] ${textSizeClass} appearance-none ${isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                    {...rest}
                >
                    {placeholder && (
                        <option value="" className={isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-900'}>
                            {placeholder}
                        </option>
                    )}
                    {options.map(({ value, label }) => (
                        <option
                            key={value}
                            value={value}
                            className={isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-900'}
                        >
                            {label}
                        </option>
                    ))}
                </select>

                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Icon
                            className={isDark ? 'text-blue-400' : 'text-[#1E4065]'}
                            size={iconSize}
                        />
                    </div>
                )}
                <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                    <FiChevronDown
                        className={isDark ? 'text-blue-400' : 'text-[#1E4065]'}
                        size={iconSize}
                    />
                </div>
            </div>

            {isLoading && (
                <p className={`mt-0.5 ${textSizeClass} ${isDark ? 'text-blue-400' : 'text-[#65C2CB]'}`}>
                    Loading options...
                </p>
            )}
        </div>
    );
};

export default BaseSelectInput;