const Notification = require('../models/Notification');
const mongoose = require('mongoose');

class NotificationService {

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

    async markAsRead(notificationId) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
    }


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


    async deleteNotification(notificationId) {
        return await Notification.findByIdAndDelete(notificationId);
    }

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


    async bulkCreate(notificationsArray) {
        return await Notification.insertMany(notificationsArray);
    }


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