import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useJobSocket } from '../../../context/JobSocketContext';
import { useDeviceSocket } from '../../../context/DeviceSocketContext';
import { usePartsRequestSocket } from '../../../context/PartsSocketContext';
import { useUserSocket } from '../../../context/UserSocketContext';
import { useCustomerSocket } from '../../../context/CustomerSocketContext';
import {
    FiUsers, FiBriefcase, FiSmartphone, FiPieChart,
    FiPackage, FiFileText, FiTrendingUp, FiBell
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/Common/DashboardLayout';
import ManagerOverview from '../OverviewPages/ManagerOverview';
import AllJobs from '../../components/Jobs/AllJobs';
import AllDevices from '../../components/Devices/AllDevices';
import AllCustomers from '../../components/Customers/AllCustomers';
import AllUsers from '../../components/Users/AllUsers';
import PartsRequests from '../../components/PartsRequest/AllPartsRequests';
import Reports from '../../components/Reports/AllReports';
import Analytics from '../../components/Analytics/AllAnalytics';
import NotificationList from '../../components/Notifications/NotificationList';

const ManagerDashboard = () => {
    const { user: currentUser } = useAuth();
    const {
        isConnected,
        joinRoom,
        leaveRoom,
        onlineUsers: { count: onlineUsersCount, users: onlineUsersList }
    } = useSocket();

    const { jobNotifications, clearJobNotification } = useJobSocket();
    const { partsRequestNotifications, clearPartsRequestNotification } = usePartsRequestSocket();
    const { deviceNotifications, clearDeviceNotification } = useDeviceSocket();
    const { userNotifications, clearUserNotification } = useUserSocket();
    const { customerNotifications, clearCustomerNotification } = useCustomerSocket();

    const [activeView, setActiveView] = useState('overview');
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const prevOnlineUsersRef = useRef([]);

    const filterNotifications = (notifications) => {
        if (!notifications) return [];
        return notifications.filter(notification =>
            notification.recipientId === currentUser._id ||
            (['administrator', 'manager'].includes(currentUser.role) ||
                notification.broadcastToRoles?.includes(currentUser.role)
            ));
    };

    const allNotifications = [
        ...filterNotifications(jobNotifications),
        ...filterNotifications(deviceNotifications),
        ...filterNotifications(partsRequestNotifications),
        ...filterNotifications(userNotifications),
        ...filterNotifications(customerNotifications)
    ];

    useEffect(() => {
        const newUsers = onlineUsersList.filter(user =>
            !prevOnlineUsersRef.current.some(u => u.userId === user.userId)
        );

        if (newUsers.length > 0) {
            newUsers.forEach(user => {
                if (user.userId !== currentUser?._id) {
                    toast(`${user.userName} is now online`, { icon: '👋' });
                }
            });
        }

        prevOnlineUsersRef.current = onlineUsersList;
    }, [onlineUsersList, currentUser?._id]);

    useEffect(() => {
        if (!isConnected || !currentUser?._id) return;

        const joinRooms = async () => {
            try {
                const managerRoom = `manager-${currentUser._id}`;
                const roleRoom = `role-${currentUser.role.toLowerCase()}`;
                const priorityRoom = 'priority-channel';
                await joinRoom(managerRoom);
                await joinRoom(roleRoom);
                await joinRoom(priorityRoom);
            } catch (error) {
                console.error('Error joining rooms:', error);
            }
        };

        joinRooms();

        return () => {
        };
    }, [isConnected, currentUser, joinRoom]);

    const handleLinkClick = (view) => setActiveView(view);

    const clearNotification = async (notificationId) => {
        try {
            if (notificationId.startsWith('job-')) {
                clearJobNotification(notificationId);
            } else if (notificationId.startsWith('device-')) {
                clearDeviceNotification(notificationId);
            } else if (notificationId.startsWith('parts-')) {
                clearPartsRequestNotification(notificationId);
            } else if (notificationId.startsWith('user-')) {
                clearUserNotification(notificationId);
            } else if (notificationId.startsWith('customer-')) {
                clearCustomerNotification(notificationId);
            }
        } catch (err) {
            toast.error('Failed to clear notification');
            console.error('Clear notification error:', err);
        }
    };

    const sidebarLinks = [
        { name: 'Overview', icon: FiPieChart, view: 'overview' },
        { name: 'Jobs', icon: FiBriefcase, view: 'jobs' },
        { name: 'Devices', icon: FiSmartphone, view: 'devices' },
        { name: 'Customers', icon: FiUsers, view: 'customers' },
        { name: 'Users', icon: FiUsers, view: 'users' },
        { name: 'Parts Requests', icon: FiPackage, view: 'parts' },
        { name: 'Reports', icon: FiFileText, view: 'reports' },
        { name: 'Analytics', icon: FiTrendingUp, view: 'analytics' },
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
                    <ManagerOverview
                        notifications={allNotifications}
                        onClearNotification={clearNotification}
                        onlineUsers={onlineUsersCount}
                        onlineUsersList={onlineUsersList}
                    />
                );
            case 'jobs':
                return <AllJobs />;
            case 'devices':
                return <AllDevices />;
            case 'customers':
                return <AllCustomers />;
            case 'users':
                return <AllUsers onlineUsersCount={onlineUsersCount} />;
            case 'parts':
                return <PartsRequests />;
            case 'reports':
                return <Reports />;
            case 'analytics':
                return <Analytics />;
            case 'notifications':
                return (
                    <NotificationList
                        realTimeNotifications={[
                            ...(jobNotifications || []),
                            ...(deviceNotifications || []),
                            ...(partsRequestNotifications || []),
                            ...(userNotifications || [])
                        ]}
                        onClearNotification={clearNotification}
                    />
                );
            default:
                return (
                    <ManagerOverview
                        notifications={allNotifications}
                        onClearNotification={clearNotification}
                        onlineUsers={onlineUsersCount}
                        onlineUsersList={onlineUsersList}
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
            onlineUsersCount={onlineUsersCount}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default ManagerDashboard;