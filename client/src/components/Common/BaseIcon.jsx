// components/Icon.jsx
import React from 'react';
import * as Icons from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useDarkMode } from '../../../context/DarkModeContext';

const Icon = ({
    name = 'FiCircle',
    size = 'md',
    className = '',
    strokeWidth = 1,
    color = 'currentColor',
    darkColor, // Optional separate color for dark mode
    onClick,
    disabled = false
}) => {
    const { isDark } = useDarkMode(); // Get dark mode state
    const IconComponent = Icons[name];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found`);
        return <Icons.FiHelpCircle className={`w-5 h-5 stroke-1 ${className}`} />;
    }

    const sizeClass = {
        xs: 'w-4 h-4',
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-7 h-7',
        xl: 'w-8 h-8'
    }[size];

    const strokeClass = `stroke-${strokeWidth}`;

    // Use darkColor if provided and in dark mode, otherwise use the regular color
    const iconColor = isDark && darkColor ? darkColor : color;

    return (
        <IconComponent
            className={`${sizeClass} ${strokeClass} ${disabled ? 'opacity-50' : ''} ${className}`}
            color={iconColor}
            onClick={disabled ? undefined : onClick}
        />
    );
};

Icon.propTypes = {
    name: PropTypes.string,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    className: PropTypes.string,
    strokeWidth: PropTypes.oneOf([1, 2, 3]),
    color: PropTypes.string,
    darkColor: PropTypes.string, // New prop for dark mode color
    onClick: PropTypes.func,
    disabled: PropTypes.bool
};

export default Icon;