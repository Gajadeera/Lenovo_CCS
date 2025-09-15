import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useJobSocket } from '../../../context/JobSocketContext';
import { usePartsRequestSocket } from '../../../context/PartsSocketContext';
import { FiTool, FiPieChart, FiPackage, FiBell } from 'react-icons/fi';
import DashboardLayout from '../../components/Common/DashboardLayout';
import TechnicianOverview from '../OverviewPages/TechnicianOverview';
import MyJobs from '../../components/Jobs/Myjob';
import UserPartsRequests from '../../components/PartsRequest/UserPartsRequests';
import NotificationList from '../../components/Notifications/NotificationList';

const TechnicianDashboard = () => {
    const { user: currentUser } = useAuth();
    const { isConnected, joinRoom } = useSocket();
    const { jobNotifications = [], clearJobNotification } = useJobSocket();
    const { partsRequestNotifications = [], clearPartsRequestNotification } = usePartsRequestSocket();

    const [activeView, setActiveView] = useState('overview');
    const [clearedNotifications, setClearedNotifications] = useState([]);

    // Filter and combine notifications
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
            ...filterValidNotifications(partsRequestNotifications)
        ];
    };

    const allNotifications = getFilteredNotifications();

    // Join rooms when connected
    useEffect(() => {
        if (!isConnected || !currentUser?._id) return;

        const joinRooms = async () => {
            try {
                const technicianRoom = `technician-${currentUser._id}`;
                const roleRoom = `role-${currentUser.role.toLowerCase()}`;
                await joinRoom(technicianRoom);
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
        } else if (notificationId.startsWith('parts-')) {
            clearPartsRequestNotification(notificationId);
        }
    };

    const sidebarLinks = [
        { name: 'Overview', icon: FiPieChart, view: 'overview' },
        {
            name: 'My Jobs',
            icon: FiTool,
            view: 'jobs',
            badge: jobNotifications.filter(n => !clearedNotifications.includes(n.id)).length || null,
            badgeColor: 'bg-blue-500'
        },
        {
            name: 'Parts Requests',
            icon: FiPackage,
            view: 'parts',
            badge: partsRequestNotifications.filter(n => !clearedNotifications.includes(n.id)).length || null,
            badgeColor: 'bg-green-500'
        },
        {
            name: 'Notifications',
            icon: FiBell,
            view: 'notifications',
            badge: allNotifications.length || null,
            badgeColor: 'bg-red-500'
        }
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'overview':
                return (
                    <TechnicianOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
                        technicianId={currentUser?._id}
                    />
                );
            case 'jobs':
                return <MyJobs technicianId={currentUser?._id} />;
            case 'parts':
                return <UserPartsRequests currentUser={currentUser} />;
            case 'notifications':
                return (
                    <NotificationList
                        realTimeNotifications={allNotifications}
                        onClearNotification={handleClearNotification}
                    />
                );
            default:
                return (
                    <TechnicianOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
                        technicianId={currentUser?._id}
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

export default TechnicianDashboard;