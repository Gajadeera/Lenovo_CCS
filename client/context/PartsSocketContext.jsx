import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';

const PartsRequestSocketContext = createContext();

export const PartsRequestSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const [partsRequestNotifications, setPartsRequestNotifications] = useState([]);

    const createNotification = (data, type, emoji, toastMethod = toast) => {
        // Extract job number safely - handle both populated and unpopulated job data
        let jobNumber = 'Unknown Job';

        if (data.job_id) {
            if (typeof data.job_id === 'object' && data.job_id.job_number) {
                jobNumber = data.job_id.job_number;
            } else if (typeof data.job_id === 'string') {
                jobNumber = 'Unknown Job';
            }
        }

        const requestId = data._id?.toString() || 'unknown';
        const requestNumber = `PR-${requestId.substring(0, 6)} (Job ${jobNumber})`;

        const notification = {
            id: `parts-${requestId}-${Date.now()}`,
            type: `parts-${type}`,
            message: `${emoji} Parts request ${type}: ${requestNumber}`,
            requestId: data._id,
            data,
            timestamp: new Date()
        };

        setPartsRequestNotifications(prev => [notification, ...prev]);

        if (toastMethod) {
            toastMethod(notification.message);
        }
    };

    useEffect(() => {
        if (!socket) return;

        console.log('Setting up parts request socket listeners...');

        const unsubscribers = [
            // Main parts request events
            subscribe('parts-request-created', (data) => {
                console.log('parts-request-created received:', data);
                createNotification(data, 'created', '🆕', toast.success);
            }),

            subscribe('parts-request-updated', (data) => {
                console.log('parts-request-updated received:', data);
                createNotification(data, 'updated', '📌');
            }),

            subscribe('parts-request-approved', (data) => {
                console.log('parts-request-approved received:', data);
                createNotification(data, 'approved', '✅', toast.success);
            }),

            subscribe('parts-request-rejected', (data) => {
                console.log('parts-request-rejected received:', data);
                createNotification(data, 'rejected', '❌', toast.error);
            }),

            subscribe('parts-request-fulfilled', (data) => {
                console.log('parts-request-fulfilled received:', data);
                createNotification(data, 'fulfilled', '📦', toast.success);
            }),

            subscribe('parts-request-deleted', (data) => {
                console.log('parts-request-deleted received:', data);
                createNotification(data, 'deleted', '🗑️', toast.error);
            }),

            // High urgency events
            subscribe('high-urgency-parts-request-created', (data) => {
                console.log('high-urgency-parts-request-created received:', data);
                createNotification(data, 'high urgency created', '🚨🆕', toast.error);
            }),

            subscribe('high-urgency-parts-request-approved', (data) => {
                console.log('high-urgency-parts-request-approved received:', data);
                createNotification(data, 'high urgency approved', '🚨✅', toast.success);
            }),

            // Debug all parts-related events
            subscribe('parts-request-*', (data, eventName) => {
                console.log(`Generic parts request event: ${eventName}`, data);
            })
        ];

        // Add error handling for socket events
        socket.on('error', (error) => {
            console.error('Socket error in parts request context:', error);
            toast.error('Socket connection error');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error in parts request context:', error);
            toast.error('Failed to connect to server');
        });

        return () => {
            console.log('Cleaning up parts request socket listeners...');
            unsubscribers.forEach(unsub => unsub && unsub());

            // Remove error listeners
            socket.off('error');
            socket.off('connect_error');
        };
    }, [socket, subscribe]);

    const clearPartsRequestNotification = (id) => {
        setPartsRequestNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllPartsRequestNotifications = () => {
        setPartsRequestNotifications([]);
    };

    const getUnreadCount = () => {
        return partsRequestNotifications.length;
    };

    const markAsRead = (id) => {
        setPartsRequestNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setPartsRequestNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const value = {
        partsRequestNotifications,
        clearPartsRequestNotification,
        clearAllPartsRequestNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead
    };

    return (
        <PartsRequestSocketContext.Provider value={value}>
            {children}
        </PartsRequestSocketContext.Provider>
    );
};

export const usePartsRequestSocket = () => {
    const context = useContext(PartsRequestSocketContext);
    if (!context) {
        throw new Error('usePartsRequestSocket must be used within a PartsRequestSocketProvider');
    }
    return context;
};

// Hook for easy access to parts request notifications
export const usePartsRequestNotifications = () => {
    const { partsRequestNotifications } = usePartsRequestSocket();
    return partsRequestNotifications;
};

// Hook for easy access to unread count
export const usePartsRequestUnreadCount = () => {
    const { getUnreadCount } = usePartsRequestSocket();
    return getUnreadCount();
};