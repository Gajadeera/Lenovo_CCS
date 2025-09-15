const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

const populateNotification = (notificationQuery) => {
    return notificationQuery
        .populate({
            path: 'userId',
            select: 'name email role'
        })
        .lean();
};

const getAllNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isRead, type } = req.query;

        const filter = {};
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (type) filter.type = type;

        const totalCount = await Notification.countDocuments(filter);

        const notifications = await populateNotification(
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        );

        res.status(200).json({
            success: true,
            data: notifications,
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / limit),
            message: 'All notifications retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

const createNotification = async (req, res, next) => {
    try {
        const { userId, message, type = 'other', link, metadata } = req.body;

        if (!userId || !message) {
            throw new ApiError(400, 'userId and message are required');
        }

        const user = await mongoose.model('User').findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        const notification = await Notification.create({
            userId,
            message,
            type,
            link,
            metadata
        });

        const populatedNotification = await populateNotification(Notification.findById(notification._id));

        res.status(201).json({
            success: true,
            data: populatedNotification,
            message: 'Notification created successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getNotification = async (req, res, next) => {
    try {
        const notification = await populateNotification(Notification.findById(req.params.id));
        if (!notification) throw new ApiError(404, 'Notification not found');

        res.status(200).json({
            success: true,
            data: notification,
            message: 'Notification retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getUserNotifications = async (req, res, next) => {
    try {
        const { isRead, type, limit = 10, page = 1 } = req.query;
        const userId = req.params.userId || req.user._id;

        const filter = { userId };
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (type) filter.type = type;

        const totalCount = await Notification.countDocuments(filter);

        const notifications = await populateNotification(
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        );

        res.status(200).json({
            success: true,
            data: notifications,
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / limit),
            message: 'Notifications retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) throw new ApiError(404, 'Notification not found');

        const populatedNotification = await populateNotification(Notification.findById(notification._id));

        res.status(200).json({
            success: true,
            data: populatedNotification,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user._id;

        const result = await Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount
            },
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) throw new ApiError(404, 'Notification not found');

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const clearAllNotifications = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user._id;

        const result = await Notification.deleteMany({ userId });

        res.status(200).json({
            success: true,
            data: {
                deletedCount: result.deletedCount
            },
            message: `${result.deletedCount} notifications cleared`
        });
    } catch (error) {
        next(error);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user._id;

        const count = await Notification.countDocuments({
            userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: { count },
            message: 'Unread notifications count retrieved'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllNotifications,
    createNotification,
    getNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount
};