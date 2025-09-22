import React from 'react';
import PropTypes from 'prop-types';
import { FiLoader } from 'react-icons/fi';

const Button = React.forwardRef((props, ref) => {
    const {
        children,
        isLoading = false,
        leftIcon,
        rightIcon,
        className = '',
        disabled,
        marginClass = 'mr-3 last:mr-0',
        size = 'md',
        variant = 'primary',
        ...rest
    } = props;

    const getSizeClasses = () => {
        switch (size) {
            case 'xs': return 'text-xs px-3 py-1.5';
            case 'sm': return 'text-sm px-4 py-2';
            case 'md': return 'text-base px-6 py-2.5';
            case 'lg': return 'text-lg px-7 py-3';
            case 'xl': return 'text-xl px-8 py-3.5';
            default: return 'text-base px-6 py-2.5';
        }
    };

    const getIconSize = () => {
        switch (size) {
            case 'xs': return 14;
            case 'sm': return 15;
            case 'md': return 16;
            case 'lg': return 18;
            case 'xl': return 20;
            default: return 16;
        }
    };

    const baseClasses = [
        'inline-flex items-center justify-center',
        'font-medium focus:outline-none',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        'transition-all duration-300 ease-in-out',
        'transform active:scale-95',
        'rounded-full',
        'border',
        'focus:ring-2 focus:ring-[#52c3cb] dark:focus:ring-[#52c3cb] focus:ring-offset-2 dark:focus:ring-offset-gray-800',
        'shadow-sm hover:shadow-md',
        'whitespace-nowrap',
        getSizeClasses()
    ].join(' ');


    const getVariantClasses = () => {
        switch (variant) {
            case 'primary':
                return isLoading
                    ? 'bg-white dark:bg-gray-800 text-[#52c3cb] dark:text-[#52c3cb] border-[#52c3cb] dark:border-[#52c3cb]'
                    : 'bg-[#52c3cb] dark:bg-[#52c3cb] text-white dark:text-white border-transparent hover:bg-white dark:hover:bg-gray-800 hover:text-[#52c3cb] dark:hover:text-[#52c3cb] hover:border-[#52c3cb] dark:hover:border-[#52c3cb]';

            case 'secondary':
                return isLoading
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500';

            case 'outline':
                return isLoading
                    ? 'bg-transparent text-[#52c3cb] dark:text-[#52c3cb] border-[#52c3cb] dark:border-[#52c3cb]'
                    : 'bg-transparent text-[#52c3cb] dark:text-[#52c3cb] border-[#52c3cb] dark:border-[#52c3cb] hover:bg-[#52c3cb] dark:hover:bg-[#52c3cb] hover:text-white dark:hover:text-white';

            default:
                return isLoading
                    ? 'bg-white dark:bg-gray-800 text-[#52c3cb] dark:text-[#52c3cb] border-[#52c3cb] dark:border-[#52c3cb]'
                    : 'bg-[#52c3cb] dark:bg-[#52c3cb] text-white dark:text-white border-transparent hover:bg-white dark:hover:bg-gray-800 hover:text-[#52c3cb] dark:hover:text-[#52c3cb] hover:border-[#52c3cb] dark:hover:border-[#52c3cb]';
        }
    };

    const iconSize = getIconSize();

    return (
        <button
            ref={ref}
            className={[
                baseClasses,
                marginClass,
                getVariantClasses(),
                isLoading ? 'relative !text-transparent' : '',
                className
            ].join(' ')}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <FiLoader
                        className="animate-spin"
                        size={iconSize}
                        style={{ color: variant === 'primary' ? '#1E4065' : (variant === 'secondary' ? '#4B5563' : '#52c3cb') }}
                    />
                </div>
            )}
            {leftIcon && !isLoading && (
                <span className="mr-2 flex-shrink-0">
                    {React.cloneElement(leftIcon, {
                        size: iconSize,
                        className: 'transition-colors duration-300'
                    })}
                </span>
            )}
            <span>{children}</span>
            {rightIcon && !isLoading && (
                <span className="ml-2 flex-shrink-0">
                    {React.cloneElement(rightIcon, {
                        size: iconSize,
                        className: 'transition-colors duration-300'
                    })}
                </span>
            )}
        </button>
    );
});

Button.propTypes = {
    isLoading: PropTypes.bool,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    children: PropTypes.node.isRequired,
    marginClass: PropTypes.string,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
};

Button.defaultProps = {
    isLoading: false,
    size: 'md',
    variant: 'primary'
};

Button.displayName = 'Button';

export default Button;