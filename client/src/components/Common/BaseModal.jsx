import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useDarkMode } from '../../../context/DarkModeContext';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isContentVisible, setIsContentVisible] = useState(false);
    const { isDark } = useDarkMode();

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            setIsVisible(true);
            setTimeout(() => setIsContentVisible(true), 50);
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            setIsContentVisible(false);
            setTimeout(() => setIsVisible(false), 300);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsContentVisible(false);
        setTimeout(() => {
            onClose();
            setIsVisible(false);
        }, 300);
    };

    const handleOverlayClick = (e) => {
        // Check if the click is directly on the overlay (not a child element)
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen && !isVisible) return null;

    const getSizeClasses = () => {
        const sizeMap = {
            // Standard widths
            'xs': 'max-w-xs',
            'sm': 'max-w-sm',
            'md': 'max-w-md',
            'ml': 'max-w-lg',
            'lg': 'max-w-xl',
            'll': 'max-w-2xl',
            'xl': 'max-w-3xl',
            '2xl': 'max-w-4xl',
            '3xl': 'max-w-5xl',
            '4xl': 'max-w-6xl',
            '5xl': 'max-w-7xl',
            '6xl': 'max-w-[90rem]',

            // Full screen variants
            'full': 'w-[95vw] h-[95vh]',
            'full-width': 'w-[95vw] max-h-[90vh]',
            'full-height': 'max-w-4xl h-[95vh]',

            // Wide variants
            'wide-sm': 'w-[85vw] max-w-[800px]',
            'wide': 'w-[90vw] max-w-[1000px]',
            'wide-lg': 'w-[92vw] max-w-[1200px]',
            'wide-xl': 'w-[94vw] max-w-[1400px]',

            // Tall variants
            'tall-sm': 'max-w-md h-[70vh]',
            'tall': 'max-w-lg h-[80vh]',
            'tall-lg': 'max-w-xl h-[85vh]',
            'tall-xl': 'max-w-2xl h-[90vh]',

            // Custom aspect ratios
            'square-sm': 'w-80 h-80',
            'square': 'w-96 h-96',
            'square-lg': 'w-[32rem] h-[32rem]',

            // Percentage-based
            '90p': 'w-[90vw] h-[90vh]',
            '80p': 'w-[80vw] h-[80vh]',
            '75p': 'w-[75vw] h-[75vh]',

            // Specialized
            'dashboard': 'w-[85vw] h-[85vh]',
            'sidebar': 'w-80 h-full max-h-screen',
            'panel': 'w-[380px] h-full max-h-screen',
            'form': 'max-w-2xl h-auto max-h-[90vh]',
            'preview': 'max-w-5xl h-[85vh]',
            'media': 'max-w-7xl h-[90vh]'
        };

        return sizeMap[size] || 'max-w-lg';
    };

    const getModalClasses = () => {
        const baseClasses = `rounded-lg shadow-xl transform transition-all duration-300 ${isContentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${getSizeClasses()} w-full max-h-[90vh] flex flex-col`;

        return isDark
            ? `${baseClasses} bg-gray-800 border border-gray-700 text-white`
            : `${baseClasses} bg-white text-[#1E4065]`;
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDark ? 'bg-gray-900' : 'bg-[#1E4065]'} ${isVisible ? 'opacity-30' : 'opacity-0'}`}
                onClick={handleOverlayClick}
            />

            {/* Modal container */}
            {isVisible && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleOverlayClick}
                >
                    <div
                        className={getModalClasses()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 rounded-t-lg ${isDark ? 'bg-gray-900 border-b border-gray-700 text-white' : 'bg-[#1E4065] text-white'}`}>
                            <h3 className="text-lg font-semibold">{title}</h3>
                            <button
                                onClick={handleClose}
                                className={`p-1 rounded-md ${isDark ? 'text-white hover:bg-gray-700 focus:ring-gray-600' : 'text-white hover:bg-[#1E4065]/80 focus:ring-[#65C2CB]'} focus:outline-none focus:ring-2`}
                                aria-label="Close modal"
                            >
                                <IoClose className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    size: PropTypes.oneOf([
        // Standard widths
        'xs', 'sm', 'md', 'ml', 'lg', 'll', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl',

        // Full screen variants
        'full', 'full-width', 'full-height',

        // Wide variants
        'wide-sm', 'wide', 'wide-lg', 'wide-xl',

        // Tall variants
        'tall-sm', 'tall', 'tall-lg', 'tall-xl',

        // Custom aspect ratios
        'square-sm', 'square', 'square-lg',

        // Percentage-based
        '90p', '80p', '75p',

        // Specialized
        'dashboard', 'sidebar', 'panel', 'form', 'preview', 'media'
    ]),
};

export default Modal;