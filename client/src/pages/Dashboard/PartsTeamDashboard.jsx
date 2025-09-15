import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useJobSocket } from '../../../context/JobSocketContext';
import { usePartsRequestSocket } from '../../../context/PartsSocketContext';
import { FiBriefcase, FiPackage, FiPieChart, FiBell } from 'react-icons/fi';
import DashboardLayout from '../../components/Common/DashboardLayout';
import PartsTeamOverview from '../OverviewPages/PartsTeamOverview';
import AllJobs from '../../components/Jobs/AllJobs';
import PartsRequests from '../../components/PartsRequest/AllPartsRequests';
import NotificationList from '../../components/Notifications/NotificationList';

const PartsTeamDashboard = () => {
    const { user: currentUser } = useAuth();
    const { isConnected, joinRoom } = useSocket();
    const { jobNotifications, clearJobNotification } = useJobSocket();
    const { partsRequestNotifications, clearPartsRequestNotification } = usePartsRequestSocket();

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
            ...filterValidNotifications(partsRequestNotifications)
        ];
    };

    const allNotifications = getFilteredNotifications();

    useEffect(() => {
        if (!isConnected || !currentUser?._id) return;

        const joinRooms = async () => {
            try {
                const partsTeamRoom = `partsteam-${currentUser._id}`;
                const roleRoom = `role-${currentUser.role.toLowerCase()}`;
                await joinRoom(partsTeamRoom);
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
        { name: 'Jobs', icon: FiBriefcase, view: 'jobs' },
        { name: 'Parts Requests', icon: FiPackage, view: 'parts' },
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
                    <PartsTeamOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
                    />
                );
            case 'jobs':
                return <AllJobs />;
            case 'parts':
                return <PartsRequests />;
            case 'notifications':
                return (
                    <NotificationList
                        realTimeNotifications={allNotifications}
                        onClearNotification={handleClearNotification}
                    />
                );
            default:
                return (
                    <PartsTeamOverview
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

export default PartsTeamDashboard;