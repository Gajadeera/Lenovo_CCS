// components/Notifications/NotificationList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import { useNotification } from '../../../context/NotificationContext'; // Import the new context
import toast from 'react-hot-toast';
import DataTable from '../Common/DataTable';
import { FiCheckCircle, FiEye, FiTrash2 } from 'react-icons/fi';

const NotificationList = ({ onClearNotification }) => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();
    const { allNotifications: realTimeNotifications, markAsRead, markAllAsRead } = useNotification(); // Use the context

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

    // Filter real-time notifications based on user role
    const filteredRealtimeNotifications = realTimeNotifications.filter(notification =>
        notification.recipientId === currentUser._id ||
        (isAdminOrManager && notification.broadcastToRoles?.includes(currentUser.role))
    );

    // Combine persisted and real-time notifications, avoiding duplicates
    const allNotifications = [
        ...persistedNotifications,
        ...filteredRealtimeNotifications.filter(rtNotif =>
            !persistedNotifications.some(pNotif => pNotif._id === rtNotif.id)
        )
    ];

    const handleClear = async (notificationId) => {
        try {
            // For persisted notifications, call the API
            if (persistedNotifications.some(n => n._id === notificationId)) {
                await axios.patch(`http://localhost:5000/notifications/${notificationId}/read`, {}, {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                });

                setPersistedNotifications(prev =>
                    prev.filter(n => n._id !== notificationId)
                );
            } else {
                // For real-time notifications, use the context method
                markAsRead(notificationId);
            }

            onClearNotification(notificationId);
            toast.success('Notification marked as read');
        } catch (err) {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Mark all persisted notifications as read via API
            await axios.patch(`http://localhost:5000/notifications/mark-all-read`, {
                userId: currentUser._id
            }, {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });

            // Mark all real-time notifications as read via context
            markAllAsRead();

            // Refresh persisted notifications
            fetchNotifications();
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
            accessor: (notification) => (
                <div className="flex flex-col">
                    <span className={`font-medium ${notification.isRead || notification.read ? '' : 'font-bold'}`}>
                        {notification.message}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(notification.createdAt || notification.timestamp).toLocaleString()}
                    </span>
                </div>
            )
        },
        {
            key: 'type',
            header: 'Type',
            accessor: (notification) => {
                // Format the type for display
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
            onClick: (notification) => handleClear(notification._id || notification.id)
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
                />
            )}
        </div>
    );
};

export default NotificationList;