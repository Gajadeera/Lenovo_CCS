import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useJobSocket } from '../../../context/JobSocketContext';
import { useDeviceSocket } from '../../../context/DeviceSocketContext';
import {
    FiUsers, FiBriefcase, FiSmartphone, FiPieChart, FiBell
} from 'react-icons/fi';
import DashboardLayout from '../../components/Common/DashboardLayout';
import CoordinatorOverview from '../OverviewPages/CoordinatorOverview';
import AllJobs from '../../components/Jobs/AllJobs';
import AllDevices from '../../components/Devices/AllDevices';
import AllCustomers from '../../components/Customers/AllCustomers';
import NotificationList from '../../components/Notifications/NotificationList';

const CoordinatorDashboard = () => {
    const { user: currentUser } = useAuth();
    const { isConnected, joinRoom } = useSocket();
    const { jobNotifications, clearJobNotification } = useJobSocket();
    const { deviceNotifications, clearDeviceNotification } = useDeviceSocket();

    const [activeView, setActiveView] = useState('overview');
    const [clearedNotifications, setClearedNotifications] = useState([]);

    const getFilteredNotifications = () => {
        const filterValidNotifications = (notifications) => {
            if (!notifications) return [];
            return notifications.filter(notification =>
                (notification.recipientId === currentUser._id ||
                    notification.broadcastToRoles?.includes(currentUser.role)) &&
                !clearedNotifications.includes(notification.id)
            );
        };

        return [
            ...filterValidNotifications(jobNotifications),
            ...filterValidNotifications(deviceNotifications)
        ];
    };

    const allNotifications = getFilteredNotifications();
    useEffect(() => {
        if (!isConnected || !currentUser?._id) return;

        const joinRooms = async () => {
            try {
                const coordinatorRoom = `coordinator-${currentUser._id}`;
                const roleRoom = `role-${currentUser.role.toLowerCase()}`;
                await joinRoom(coordinatorRoom);
                await joinRoom(roleRoom);
            } catch (error) {
                console.error('Error joining rooms:', error);
            }
        };

        joinRooms();
    }, [isConnected, currentUser, joinRoom]);

    const handleLinkClick = (view) => setActiveView(view);

    const handleClearNotification = (notificationId) => {
        setClearedNotifications(prev => [...prev, notificationId]);

        if (notificationId.startsWith('job-')) {
            clearJobNotification(notificationId);
        } else if (notificationId.startsWith('device-')) {
            clearDeviceNotification(notificationId);
        }
    };

    const sidebarLinks = [
        { name: 'Overview', icon: FiPieChart, view: 'overview' },
        { name: 'Jobs', icon: FiBriefcase, view: 'jobs' },
        { name: 'Devices', icon: FiSmartphone, view: 'devices' },
        { name: 'Customers', icon: FiUsers, view: 'customers' },
        {
            name: 'Notifications',
            icon: FiBell,
            view: 'notifications',
            badge: allNotifications.length > 0 ? allNotifications.length : null
        }
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'overview':
                return (
                    <CoordinatorOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
                    />
                );
            case 'jobs':
                return <AllJobs />;
            case 'devices':
                return <AllDevices />;
            case 'customers':
                return <AllCustomers />;
            case 'notifications':
                return (
                    <NotificationList
                        realTimeNotifications={allNotifications}
                        onClearNotification={handleClearNotification}
                    />
                );
            default:
                return (
                    <CoordinatorOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
                    />
                );
        }
    };

    return (
        <DashboardLayout
            sidebarLinks={sidebarLinks}
            activeView={activeView}
            onLinkClick={handleLinkClick}
            userRole={currentUser?.role}
            notificationCount={allNotifications.length}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default CoordinatorDashboard;