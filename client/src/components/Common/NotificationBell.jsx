import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotification } from '../../../context/NotificationContext';

const NotificationBell = () => {
    const { getUnreadCount } = useNotification();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Update count when notifications change
    useEffect(() => {
        const count = getUnreadCount();
        setUnreadCount(count);
        setIsLoading(false);
    }, [getUnreadCount]);

    return (
        <div className="relative">
            <button
                className="relative p-2 rounded-full bg-white text-gray-800 focus:outline-none hover:bg-gray-100 transition-colors duration-200"
                aria-label="Notifications"
            >
                <FaBell className="w-5 h-5" />

                {/* Unread Count Badge */}
                {!isLoading && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-gray-400 text-white text-xs font-bold rounded-full">
                        ...
                    </span>
                )}
            </button>
        </div>
    );
};

export default NotificationBell;