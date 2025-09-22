import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useUserSocket } from '../../../context/UserSocketContext';
import { useIssueSocket } from '../../../context/IssueSocketContext';
import { useReportSocket } from '../../../context/ReportSocketContext';
import {
    FiUsers, FiAlertCircle, FiFileText, FiPieChart, FiBell
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/Common/DashboardLayout';
import AdminOverview from '../OverviewPages/AdminOverview';
import AllUsers from '../../components/Users/AllUsers';
import AllIssues from '../../components/Issues/AllIssues';
import AllReports from '../../components/Reports/AllReports';
import NotificationList from '../../components/Notifications/NotificationList';

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const {
        isConnected,
        joinRoom,
        onlineUsers: { count: onlineUsersCount, users: onlineUsersList }
    } = useSocket();
    const { userNotifications, clearUserNotification } = useUserSocket();
    const { issueNotifications, clearIssueNotification } = useIssueSocket();
    const { reportNotifications, clearReportNotification } = useReportSocket();

    const [activeView, setActiveView] = useState('overview');
    const [clearedNotifications, setClearedNotifications] = useState([]);
    const prevOnlineUsersRef = useRef([]);

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
            ...filterValidNotifications(userNotifications),
            ...filterValidNotifications(issueNotifications),
            ...filterValidNotifications(reportNotifications)
        ];
    };

    const allNotifications = getFilteredNotifications();

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
                const adminRoom = `admin-${currentUser._id}`;
                const roleRoom = `role-${currentUser.role.toLowerCase()}`;
                const priorityRoom = 'priority-channel';

                await joinRoom(adminRoom);
                await joinRoom(roleRoom);
                await joinRoom(priorityRoom);
            } catch (error) {
                console.error('Error joining rooms:', error);
            }
        };

        joinRooms();
    }, [isConnected, currentUser, joinRoom]);

    const handleLinkClick = (view) => setActiveView(view);

    const handleClearNotification = (notificationId) => {
        setClearedNotifications(prev => [...prev, notificationId]);

        if (notificationId.startsWith('user-')) {
            clearUserNotification(notificationId);
        } else if (notificationId.startsWith('issue-')) {
            clearIssueNotification(notificationId);
        } else if (notificationId.startsWith('report-')) {
            clearReportNotification(notificationId);
        }
    };

    const sidebarLinks = [
        { name: 'Overview', icon: FiPieChart, view: 'overview' },
        { name: 'Users', icon: FiUsers, view: 'users' },
        { name: 'Issues', icon: FiAlertCircle, view: 'issues' },
        { name: 'Reports', icon: FiFileText, view: 'reports' },
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
                    <AdminOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
                        onlineUsers={onlineUsersCount}
                        onlineUsersList={onlineUsersList}
                    />
                );
            case 'users':
                return <AllUsers onlineUsersCount={onlineUsersCount} />;
            case 'issues':
                return <AllIssues />;
            case 'reports':
                return <AllReports />;
            case 'notifications':
                return (
                    <NotificationList
                        realTimeNotifications={[
                            ...(userNotifications || []),
                            ...(issueNotifications || []),
                            ...(reportNotifications || [])
                        ]}
                        onClearNotification={handleClearNotification}
                    />
                );
            default:
                return (
                    <AdminOverview
                        notifications={allNotifications}
                        onClearNotification={handleClearNotification}
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

export default AdminDashboard;