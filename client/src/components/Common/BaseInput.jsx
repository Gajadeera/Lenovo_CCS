import { useDarkMode } from '../../../context/DarkModeContext';

const BaseInput = ({
    type = 'text',
    label,
    name,
    value,
    onChange,
    multiline = false,
    rows = 2,
    required,
    className = '',
    compact = false,
    dense = false,
    ...rest
}) => {
    const { isDark } = useDarkMode();
    const InputComponent = multiline ? 'textarea' : 'input';
    const heightClass = compact ? 'py-1' : dense ? 'py-0.5' : 'py-1.5';
    const textSizeClass = compact ? 'text-xs' : 'text-sm';

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label
                    htmlFor={name}
                    className={`block font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} ${textSizeClass}`}
                >
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}

            <div className="relative rounded-md shadow-sm">
                <InputComponent
                    type={!multiline ? type : undefined}
                    name={name}
                    id={name}
                    value={value}
                    onChange={onChange}
                    rows={multiline ? rows : undefined}
                    className={`block w-full px-2 ${heightClass} border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#65C2CB] focus:border-[#1E4065] ${textSizeClass}`}
                    required={required}
                    {...rest}
                />
            </div>
        </div>
    );
};

export default BaseInput;