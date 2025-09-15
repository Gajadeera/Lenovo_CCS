import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';

const DeviceSocketContext = createContext();

export const DeviceSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const [deviceNotifications, setDeviceNotifications] = useState([]);

    // Frontend - DeviceSocketContext.js
    useEffect(() => {
        if (!socket) return;

        const handleDeviceCreated = (data) => {
            const notification = {
                id: `device-${data.device._id}-${Date.now()}`,
                type: 'device-created',
                message: `New device: ${data.device.model_number}`, // Changed from model to model_number
                deviceId: data.device._id,
                timestamp: new Date()
            };
            setDeviceNotifications(prev => [notification, ...prev]);
            toast.success(`📱 ${notification.message}`);
        };

        const handleDeviceUpdated = (data) => {
            const notification = {
                id: `device-${data.device._id}-${Date.now()}`,
                type: 'device-updated',
                message: `Device updated: ${data.device.model_number}`, // Changed from model to model_number
                deviceId: data.device._id,
                timestamp: new Date()
            };
            setDeviceNotifications(prev => [notification, ...prev]);
            toast(`✏️ ${notification.message}`);
        };

        const handleDeviceDeleted = (data) => {
            const notification = {
                id: `device-${data.device._id}-${Date.now()}`,
                type: 'device-deleted',
                message: `Device deleted: ${data.device.model_number}`,
                deviceId: data.device._id,
                timestamp: new Date()
            };
            setDeviceNotifications(prev => [notification, ...prev]);
            toast.error(`🗑️ ${notification.message}`);
        };

        const handleWarrantyUpdated = (data) => {
            const notification = {
                id: `device-${data.device._id}-${Date.now()}`,
                type: 'warranty-updated',
                message: `Warranty updated for: ${data.device.model_number}`,
                deviceId: data.device._id,
                timestamp: new Date()
            };
            setDeviceNotifications(prev => [notification, ...prev]);
            toast(`📋 ${notification.message}`);
        };

        // Listen for the exact event names emitted by backend
        const unsubCreated = subscribe('device-created', handleDeviceCreated);
        const unsubUpdated = subscribe('device-updated', handleDeviceUpdated);
        const unsubDeleted = subscribe('device-deleted', handleDeviceDeleted);
        const unsubWarranty = subscribe('device-warranty-updated', handleWarrantyUpdated);

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubDeleted();
            unsubWarranty();
        };
    }, [socket, subscribe]);

    const clearDeviceNotification = (id) => {
        setDeviceNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <DeviceSocketContext.Provider value={{
            deviceNotifications,
            clearDeviceNotification
        }}>
            {children}
        </DeviceSocketContext.Provider>
    );
};

export const useDeviceSocket = () => useContext(DeviceSocketContext);