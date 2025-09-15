const Notification = require('../models/Notification');
const mongoose = require('mongoose');

class NotificationService {
    /**
     * Create a new notification
     * @param {Object} params
     * @param {String} [params.userId]
     * @param {String[]} [params.targetRoles]
     * @param {String} params.message
     * @param {String} [params.type]
     * @param {String} [params.relatedId]
     * @param {Object} [params.metadata]
     */
    async createNotification({ userId, targetRoles, message, type = 'general', relatedId = null, metadata = {} }) {
        if (!userId && (!targetRoles || targetRoles.length === 0)) {
            throw new Error('Either userId or targetRoles must be provided');
        }

        const notificationData = {
            message,
            type,
            relatedId,
            metadata,
            isRead: false,
        };

        if (userId) {
            notificationData.userId = userId;
        } else {
            notificationData.targetRoles = targetRoles;
        }

        return await Notification.create(notificationData);
    }

    /**
     * Get notifications for a user (including role-based ones)
     * @param {String} userId
     * @param {String} userRole
     * @param {Object} [options]
     * @param {Number} [options.limit]
     * @param {Boolean} [options.unreadOnly]
     * @param {Number} [options.page]
     */
    async getUserNotifications(userId, userRole, { limit = 20, unreadOnly = false, page = 1 } = {}) {
        const filter = {
            $or: [
                { userId },
                { targetRoles: userRole },
            ],
        };

        if (unreadOnly) filter.isRead = false;

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
        ]);

        return {
            notifications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Mark one notification as read
     * @param {String} notificationId
     */
    async markAsRead(notificationId) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
    }

    /**
     * Mark all notifications as read for a user (including role-based)
     * @param {String} userId
     * @param {String} userRole
     */
    async markAllAsRead(userId, userRole) {
        const filter = {
            $or: [
                { userId, isRead: false },
                { targetRoles: userRole, isRead: false },
            ],
        };

        const result = await Notification.updateMany(filter, { $set: { isRead: true } });
        return result.modifiedCount;
    }

    /**
     * Delete a notification
     * @param {String} notificationId
     */
    async deleteNotification(notificationId) {
        return await Notification.findByIdAndDelete(notificationId);
    }

    /**
     * Get notifications by role (for admins/managers)
     * @param {String} role
     * @param {Object} [options]
     * @param {Number} [options.limit]
     * @param {Boolean} [options.unreadOnly]
     * @param {Number} [options.page]
     */
    async getNotificationsByRole(role, { limit = 20, unreadOnly = false, page = 1 } = {}) {
        const filter = { targetRoles: role };
        if (unreadOnly) filter.isRead = false;

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
        ]);

        return {
            notifications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Bulk create notifications (e.g., for multiple users or roles)
     * @param {Array} notificationsArray
     */
    async bulkCreate(notificationsArray) {
        return await Notification.insertMany(notificationsArray);
    }

    /**
     * Clear all notifications for a user (including role-based)
     * @param {String} userId
     * @param {String} userRole
     */
    async clearAll(userId, userRole) {
        const filter = {
            $or: [
                { userId },
                { targetRoles: userRole },
            ],
        };

        const result = await Notification.deleteMany(filter);
        return result.deletedCount;
    }

    /**
     * Get unread count for a user
     * @param {String} userId
     * @param {String} userRole
     */
    async getUnreadCount(userId, userRole) {
        const filter = {
            $or: [
                { userId, isRead: false },
                { targetRoles: userRole, isRead: false },
            ],
        };

        return await Notification.countDocuments(filter);
    }
}

module.exports = new NotificationService();