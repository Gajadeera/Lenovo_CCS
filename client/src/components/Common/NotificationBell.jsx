import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotification } from '../../../context/NotificationContext';

const NotificationBell = ({ userId, onNotificationsClick }) => {
    const { getUnreadCount } = useNotification();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const count = getUnreadCount();
        setUnreadCount(count);
        setIsLoading(false);
    }, [getUnreadCount]);

    const handleBellClick = () => {
        onNotificationsClick();
    };

    return (
        <div className="relative">
            <button
                className="relative p-2 rounded-full bg-white text-gray-800 focus:outline-none hover:bg-gray-100 transition-colors duration-200"
                aria-label="Notifications"
                onClick={handleBellClick}
            >
                <FaBell className="w-5 h-5" />
                {!isLoading && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default NotificationBell;