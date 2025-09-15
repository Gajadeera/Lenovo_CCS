import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';

const CustomerSocketContext = createContext();

export const CustomerSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const [customerNotifications, setCustomerNotifications] = useState([]);
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!socket) return;

        // Handle customer creation
        const handleCustomerCreated = (data) => {
            const notification = {
                id: data.eventId,
                type: 'customer-created',
                message: `👤 New customer created: ${data.customer.name}`,
                customerId: data.customer._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata,
                link: `/customers/${data.customer._id}`
            };
            setCustomerNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
        };

        // Handle customer updates
        const handleCustomerUpdated = (data) => {
            const changes = data.metadata?.changedFields?.join(', ') || 'details';
            const message = `✏️ ${data.initiatedBy.name} updated customer: ${data.customer.name} (${changes})`;

            const notification = {
                id: data.eventId,
                type: 'customer-updated',
                message,
                customerId: data.customer._id,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata,
                link: `/customers/${data.customer._id}`
            };
            setCustomerNotifications(prev => [notification, ...prev]);
            toast(notification.message);
        };

        // Handle customer deletion
        const handleCustomerDeleted = (data) => {
            const notification = {
                id: data.eventId,
                type: 'customer-deleted',
                message: `🗑️ Customer deleted: ${data.customer.name}`,
                initiatedBy: data.initiatedBy,
                timestamp: data.timestamp,
                metadata: data.metadata
            };
            setCustomerNotifications(prev => [notification, ...prev]);
            toast.error(notification.message);
        };

        // Subscribe to customer events
        const unsubCreated = subscribe('customer-created', handleCustomerCreated);
        const unsubUpdated = subscribe('customer-updated', handleCustomerUpdated);
        const unsubDeleted = subscribe('customer-deleted', handleCustomerDeleted);

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubDeleted();
        };
    }, [socket, subscribe, userId, userRole]);

    const clearCustomerNotification = (id) => {
        setCustomerNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllCustomerNotifications = () => {
        setCustomerNotifications([]);
    };

    const getCustomerNotifications = (customerId = null) => {
        if (customerId) {
            return customerNotifications.filter(n => n.customerId === customerId);
        }
        return customerNotifications;
    };

    return (
        <CustomerSocketContext.Provider value={{
            customerNotifications,
            getCustomerNotifications,
            clearCustomerNotification,
            clearAllCustomerNotifications
        }}>
            {children}
        </CustomerSocketContext.Provider>
    );
};

export const useCustomerSocket = () => {
    const context = useContext(CustomerSocketContext);
    if (!context) {
        throw new Error('useCustomerSocket must be used within a CustomerSocketProvider');
    }
    return context;
};