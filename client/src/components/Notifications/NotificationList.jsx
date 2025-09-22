// components/Notifications/NotificationList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import { useNotification } from '../../../context/NotificationContext';
import toast from 'react-hot-toast';
import DataTable from '../Common/DataTable';
import { FiCheckCircle, FiEye, FiTrash2 } from 'react-icons/fi';

const NotificationList = ({ onClearNotification }) => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();
    const { allNotifications: realTimeNotifications, markAsRead, markAllAsRead } = useNotification();

    const [persistedNotifications, setPersistedNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 5,
        totalCount: 0,
        totalPages: 1
    });

    const isAdminOrManager = currentUser?.role === 'administrator' || currentUser?.role === 'manager';

    useEffect(() => {
        fetchNotifications();
    }, [currentUser?._id, currentUser?.token, pagination.page, pagination.limit, isAdminOrManager]);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            let endpoint = isAdminOrManager
                ? 'http://localhost:5000/notifications/all/list'
                : 'http://localhost:5000/notifications';

            let params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(isAdminOrManager ? {} : { userId: currentUser._id })
            };

            const response = await axios.get(endpoint, {
                params,
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });

            setPersistedNotifications(response.data.data || response.data);
            setPagination(prev => ({
                ...prev,
                totalCount: response.data.totalCount || response.data.length,
                totalPages: response.data.totalPages || 1
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch notifications');
            toast.error('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRealtimeNotifications = realTimeNotifications.filter(notification =>
        notification.recipientId === currentUser._id ||
        (isAdminOrManager && notification.broadcastToRoles?.includes(currentUser.role))
    );

    const allNotifications = [
        ...persistedNotifications,
        ...filteredRealtimeNotifications.filter(rtNotif =>
            !persistedNotifications.some(pNotif => pNotif._id === rtNotif.id)
        )
    ];

    const handleMarkAsRead = async (notificationId) => {
        try {
            if (persistedNotifications.some(n => n._id === notificationId)) {
                await axios.patch(`http://localhost:5000/notifications/${notificationId}/read`, {}, {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                });

                setPersistedNotifications(prev =>
                    prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
                );
            } else {
                markAsRead(notificationId);
            }

            onClearNotification(notificationId);
            toast.success('Notification marked as read');
        } catch (err) {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleRowClick = (notification) => {
        const notificationId = notification._id || notification.id;
        const isRead = notification.isRead || notification.read;

        if (!isRead) {
            handleMarkAsRead(notificationId);
        }

    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(`http://localhost:5000/notifications/mark-all-read`, {
                userId: currentUser._id
            }, {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });

            markAllAsRead();
            setPersistedNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );

            toast.success('All notifications marked as read');
        } catch (err) {
            toast.error('Failed to mark all notifications as read');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const notificationColumns = [
        {
            key: 'message',
            header: 'Message',
            accessor: (notification) => {
                const isRead = notification.isRead || notification.read;
                return (
                    <div className="flex flex-col">
                        <span className={`font-medium ${isRead ? '' : 'font-bold'}`}>
                            {notification.message}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(notification.createdAt || notification.timestamp).toLocaleString()}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'type',
            header: 'Type',
            accessor: (notification) => {
                if (notification.type?.includes('parts-')) {
                    return 'Parts Request';
                } else if (notification.type?.includes('job-')) {
                    return 'Job';
                } else if (notification.type?.includes('device-')) {
                    return 'Device';
                } else if (notification.type?.includes('user-')) {
                    return 'User';
                } else if (notification.type?.includes('issue-')) {
                    return 'Issue';
                } else if (notification.type?.includes('customer-')) {
                    return 'Customer';
                }
                return notification.type || 'Notification';
            }
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (notification) => {
                const isRead = notification.isRead || notification.read;
                return (
                    <span className={isRead ? 'text-green-500' : 'text-blue-500'}>
                        {isRead ? 'Read' : 'Unread'}
                    </span>
                );
            }
        }
    ];

    const rowActions = [
        {
            icon: <FiCheckCircle className="h-4 w-4" />,
            title: 'Mark as Read',
            onClick: (notification) => handleMarkAsRead(notification._id || notification.id)
        }
    ];

    if (isLoading && pagination.page === 1) {
        return (
            <div className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Loading notifications...
            </div>
        );
    }

    return (
        <div className={`p-4 ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-700'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Notifications</h2>
                {allNotifications.length > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        Mark All as Read
                    </button>
                )}
            </div>

            {error ? (
                <div className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error}</div>
            ) : (
                <DataTable
                    data={allNotifications}
                    columns={notificationColumns}
                    loading={isLoading}
                    page={pagination.page}
                    limit={pagination.limit}
                    totalCount={pagination.totalCount + filteredRealtimeNotifications.length}
                    onPageChange={handlePageChange}
                    rowActions={rowActions}
                    emptyStateMessage="No notifications"
                    headerClassName={isDark ? 'bg-gray-700' : 'bg-gray-100'}
                    onRowClick={handleRowClick} // Add row click handler
                    rowClassName={(notification) => {
                        const isRead = notification.isRead || notification.read;
                        return `cursor-pointer ${isRead
                            ? (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                            : (isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-blue-50 hover:bg-blue-100')
                            }`;
                    }}
                />
            )}
        </div>
    );
};

export default NotificationList;