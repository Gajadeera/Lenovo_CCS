// components/StatCard.jsx
import React from 'react';
import { useDarkMode } from '../../../context/DarkModeContext';

const StatCard = ({
    icon: Icon,
    title,
    value,
    additionalInfo,
    className = '',
    align = 'left',
    onClick,
    width = 'auto',
    height = 'auto',
    compact = false
}) => {
    const contextIsDark = useDarkMode()?.isDark;
    const isDark = contextIsDark;
    const borderColor = isDark ? 'border-white' : 'border-black';

    // Helper function to safely render the value
    const renderValue = () => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        // Handle objects
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return value.length;
            }
            if (value.userName) {
                return value.userName;
            }
            return JSON.stringify(value);
        }

        // Handle numbers, strings, etc.
        return value;
    };

    // Size classes based on compact mode
    const paddingClass = compact ? 'p-4' : 'p-6';
    const textSizeClass = compact ? 'text-lg' : 'text-2xl';
    const iconSizeClass = compact ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <div
            className={`
                ${isDark ? 'bg-gray-800' : 'bg-white'} 
                ${paddingClass} rounded-lg shadow-lg border
                transition-all hover:shadow-xl hover:-translate-y-1
                ${align === 'center' ? 'text-center' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${borderColor}
                ${className}
            `}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderWidth: '1px'
            }}
            onClick={onClick}
        >
            <div className={`flex ${align === 'center' ? 'flex-col items-center' : 'items-center'}`}>
                <Icon
                    className={`${iconSizeClass} stroke-1 ${isDark ? 'text-blue-400' : 'text-[#1E4065]'} ${compact ? 'mr-2' : 'mr-4'}`}
                />
                <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {title}
                    </p>
                    <p className={`${textSizeClass} font-semibold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>
                        {renderValue()}
                    </p>
                    {additionalInfo && (
                        <div className={`mt-2 text-xs font-medium ${isDark ? 'text-blue-400' : 'text-[#65C2CB]'}`}>
                            {typeof additionalInfo === 'object'
                                ? JSON.stringify(additionalInfo)
                                : additionalInfo}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;