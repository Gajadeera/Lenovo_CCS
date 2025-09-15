import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';

const UserSocketContext = createContext();

export const UserSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const [userNotifications, setUserNotifications] = useState([]);
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!socket) return;

        // Handle user creation
        const handleUserCreated = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-created',
                message: `👤 New user created: ${data.user.name}`,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata,
                link: `/users/${data.user._id}`
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
        };

        // Handle user updates
        const handleUserUpdated = (data) => {
            const changes = data.metadata?.changedFields?.join(', ') || 'details';
            const message = `✏️ ${data.initiatedBy.name} updated user: ${data.user.name} (${changes})`;

            const notification = {
                id: data.eventId,
                type: 'user-updated',
                message,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata,
                link: `/users/${data.user._id}`
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast(notification.message);
        };

        // Handle user deletion
        const handleUserDeleted = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-deleted',
                message: `🗑️ User deleted: ${data.user.name}`,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast.error(notification.message);
        };

        // Handle user login
        const handleUserLogin = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-login',
                message: `🔐 ${data.user.name} (${data.user.role}) logged in`,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast(notification.message, { icon: '🔐' });
        };

        // Handle user profile updates
        const handleUserProfileUpdated = (data) => {
            const changes = data.metadata?.changedFields?.join(', ') || 'profile';
            const message = `✏️ Your profile was updated: ${changes} changed`;

            const notification = {
                id: data.eventId,
                type: 'user-profile-updated',
                message,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata,
                link: `/profile`
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
        };

        // Handle password changes
        const handleUserPasswordChanged = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-password-changed',
                message: `🔒 Your password was changed successfully`,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
        };

        // Handle password reset requests
        const handleUserPasswordResetRequested = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-password-reset-requested',
                message: `🔐 Password reset requested for ${data.user.email}`,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast(notification.message, { icon: '🔐' });
        };

        // Handle password resets
        const handleUserPasswordReset = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-password-reset',
                message: `🔒 Password was successfully reset for ${data.user.name}`,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
        };

        // Handle user welcome
        const handleUserWelcome = (data) => {
            const notification = {
                id: data.eventId,
                type: 'user-welcome',
                message: `👋 Welcome to the system, ${data.user.name}!`,
                userId: data.user._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setUserNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
        };

        // Handle user stats updates
        const handleUserStatsUpdated = (data) => {
            const notification = {
                id: new Date().getTime().toString(),
                type: 'user-stats-updated',
                message: `📊 User statistics updated: ${data.total} total, ${data.active} active, ${data.newLast24Hours} new in last 24h`,
                timestamp: new Date(),
                metadata: data
            };
            setUserNotifications(prev => [notification, ...prev]);
        };

        // Handle user activity updates
        const handleUserActivityUpdated = (data) => {
            const notification = {
                id: new Date().getTime().toString(),
                type: 'user-activity-updated',
                message: `📈 User activity data has been updated`,
                timestamp: new Date(),
                metadata: { activities: data }
            };
            setUserNotifications(prev => [notification, ...prev]);
        };

        // Handle role distribution updates
        const handleRoleDistributionUpdated = (data) => {
            const notification = {
                id: new Date().getTime().toString(),
                type: 'role-distribution-updated',
                message: `👥 Role distribution has been updated`,
                timestamp: new Date(),
                metadata: { distribution: data }
            };
            setUserNotifications(prev => [notification, ...prev]);
        };

        // Handle user growth updates
        const handleUserGrowthUpdated = (data) => {
            const notification = {
                id: new Date().getTime().toString(),
                type: 'user-growth-updated',
                message: `📈 User growth data updated for ${data.period} period`,
                timestamp: new Date(),
                metadata: data
            };
            setUserNotifications(prev => [notification, ...prev]);
        };

        // Subscribe to user events
        const unsubCreated = subscribe('user-created', handleUserCreated);
        const unsubUpdated = subscribe('user-updated', handleUserUpdated);
        const unsubDeleted = subscribe('user-deleted', handleUserDeleted);
        const unsubLogin = subscribe('user-login', handleUserLogin);
        const unsubProfileUpdated = subscribe('user-profile-updated', handleUserProfileUpdated);
        const unsubPasswordChanged = subscribe('user-password-changed', handleUserPasswordChanged);
        const unsubPasswordResetRequested = subscribe('user-password-reset-requested', handleUserPasswordResetRequested);
        const unsubPasswordReset = subscribe('user-password-reset', handleUserPasswordReset);
        const unsubWelcome = subscribe('user-welcome', handleUserWelcome);
        const unsubStatsUpdated = subscribe('user-stats-updated', handleUserStatsUpdated);
        const unsubActivityUpdated = subscribe('user-activity-updated', handleUserActivityUpdated);
        const unsubRoleDistribution = subscribe('role-distribution-updated', handleRoleDistributionUpdated);
        const unsubGrowthUpdated = subscribe('user-growth-updated', handleUserGrowthUpdated);

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubDeleted();
            unsubLogin();
            unsubProfileUpdated();
            unsubPasswordChanged();
            unsubPasswordResetRequested();
            unsubPasswordReset();
            unsubWelcome();
            unsubStatsUpdated();
            unsubActivityUpdated();
            unsubRoleDistribution();
            unsubGrowthUpdated();
        };
    }, [socket, subscribe, userId, userRole]);

    const clearUserNotification = (id) => {
        setUserNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllUserNotifications = () => {
        setUserNotifications([]);
    };

    const getUserNotifications = (userId = null) => {
        if (userId) {
            return userNotifications.filter(n => n.userId === userId);
        }
        return userNotifications;
    };

    return (
        <UserSocketContext.Provider value={{
            userNotifications,
            getUserNotifications,
            clearUserNotification,
            clearAllUserNotifications
        }}>
            {children}
        </UserSocketContext.Provider>
    );
};

export const useUserSocket = () => {
    const context = useContext(UserSocketContext);
    if (!context) {
        throw new Error('useUserSocket must be used within a UserSocketProvider');
    }
    return context;
};