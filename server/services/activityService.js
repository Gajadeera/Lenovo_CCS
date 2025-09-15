const ActivityLog = require('../models/ActivityLog');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const mongoose = require('mongoose');

class ActivityService {
    static emitActivityEvent(eventType, data, options = {}) {
        const io = getIO();
        if (!io) return;

        const baseEvent = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: data.userId,
                name: data.userName,
                role: data.userRole
            },
            activity: data.activity,
            metadata: data.metadata || {}
        };

        if (options.roles?.length) {
            RoomManager.emitToRoles(options.roles, `activity-${eventType}`, baseEvent);
        }
    }

    static async buildActivityQuery(filters) {
        const { userId, action, entityType, startDate, endDate } = filters;
        const query = {};

        if (userId) query.user_id = userId;
        if (action) query.action = action;
        if (entityType) query.entity_type = entityType;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        return query;
    }

    static async emitAccessEvent(eventType, user, activityData, roles = ['administrator']) {
        this.emitActivityEvent(eventType, {
            userId: user?._id || null,
            userName: user?.name || 'System',
            userRole: user?.role || 'system',
            activity: activityData
        }, { roles });
    }

    static async getActivityLogs(filters, user) {
        try {
            const { page = 1, limit = 20 } = filters;
            const query = await this.buildActivityQuery(filters);

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { timestamp: -1 },
                populate: {
                    path: 'user_id',
                    select: 'name email role'
                }
            };

            const logs = await ActivityLog.paginate(query, options);

            await this.emitAccessEvent('accessed', user, {
                filters: {
                    userId: filters.userId,
                    action: filters.action,
                    entityType: filters.entityType,
                    startDate: filters.startDate,
                    endDate: filters.endDate
                },
                resultCount: logs.totalDocs
            });

            return logs;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async getUserActivitySummary(filters, user) {
        try {
            const { days = 30 } = filters;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            const summary = await ActivityLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            user_id: "$user_id",
                            action: "$action",
                            entity_type: "$entity_type"
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.user_id",
                        actions: {
                            $push: {
                                action: "$_id.action",
                                entity_type: "$_id.entity_type",
                                count: "$count"
                            }
                        },
                        total_actions: { $sum: "$count" }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $project: {
                        user_id: "$_id",
                        user_name: "$user.name",
                        user_role: "$user.role",
                        actions: 1,
                        total_actions: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { total_actions: -1 }
                }
            ]);

            await this.emitAccessEvent('summary-accessed', user, {
                days,
                resultCount: summary.length
            });

            return summary;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async logActivity(activityData) {
        try {
            const activity = await ActivityLog.create(activityData);
            return activity;
        } catch (error) {
            console.error('Failed to log activity:', error);
            throw new Error('Failed to log activity');
        }
    }

    static async getRecentActivities(limit = 10) {
        try {
            const activities = await ActivityLog.find()
                .populate('user_id', 'name email role')
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();

            return activities;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = ActivityService;