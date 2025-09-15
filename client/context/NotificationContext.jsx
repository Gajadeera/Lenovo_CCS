// contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useDeviceSocket } from './DeviceSocketContext';
import { useJobSocket } from './JobSocketContext';
import { usePartsRequestSocket } from './PartsSocketContext';
import { useUserSocket } from './UserSocketContext';
import { useReportSocket } from './ReportSocketContext';
import { useIssueSocket } from './IssueSocketContext';
import { useCustomerSocket } from './CustomerSocketContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [allNotifications, setAllNotifications] = useState([]);

    // Get notifications from all socket contexts
    const deviceNotifications = useDeviceSocket()?.deviceNotifications || [];
    const jobNotifications = useJobSocket()?.jobNotifications || [];
    const partsNotifications = usePartsRequestSocket()?.partsRequestNotifications || [];
    const userNotifications = useUserSocket()?.userNotifications || [];
    const reportNotifications = useReportSocket()?.reportNotifications || [];
    const issueNotifications = useIssueSocket()?.issueNotifications || [];
    const customerNotifications = useCustomerSocket()?.customerNotifications || [];

    // Combine all notifications
    useEffect(() => {
        const combined = [
            ...deviceNotifications,
            ...jobNotifications,
            ...partsNotifications,
            ...userNotifications,
            ...reportNotifications,
            ...issueNotifications,
            ...customerNotifications
        ];

        setAllNotifications(combined);
    }, [
        deviceNotifications,
        jobNotifications,
        partsNotifications,
        userNotifications,
        reportNotifications,
        issueNotifications,
        customerNotifications
    ]);

    const getUnreadCount = () => {
        return allNotifications.filter(notification => !notification.read).length;
    };

    const markAsRead = (id) => {
        // This would need to be implemented in each individual socket context
        console.log('Mark as read not implemented for all contexts yet');
    };

    const markAllAsRead = () => {
        // This would need to be implemented in each individual socket context
        console.log('Mark all as read not implemented for all contexts yet');
    };

    const value = {
        allNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};