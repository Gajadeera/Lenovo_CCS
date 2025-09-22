const { Job, Customer, Device, User, PartsRequest, ActivityLog } = require('../models');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const mongoose = require('mongoose');

class AnalyticsService {
    static emitAnalyticsEvent(eventType, data, options = {}) {
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
            analytics: data.analytics,
            metadata: data.metadata || {}
        };

        if (options.roles?.length) {
            RoomManager.emitToRoles(options.roles, `analytics-${eventType}`, baseEvent);
        }
    }

    static async executeAggregation(model, pipeline, eventType, user, roles = ['manager', 'administrator']) {
        try {
            const result = await model.aggregate(pipeline);

            this.emitAnalyticsEvent(eventType, {
                userId: user?._id || null,
                userName: user?.name || 'System',
                userRole: user?.role || 'system',
                analytics: result
            }, { roles });

            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async getDistribution(model, groupField, eventType, user, roles) {
        return this.executeAggregation(model, [
            { $group: { _id: `$${groupField}`, count: { $sum: 1 } } },
            { $project: { name: "$_id", value: "$count", _id: 0 } }
        ], eventType, user, roles);
    }

    static async getTimeSeries(model, dateField, format, eventType, user, roles) {
        return this.executeAggregation(model, [
            {
                $group: {
                    _id: { $dateToString: { format, date: `$${dateField}` } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $project: { date: "$_id", count: 1, _id: 0 } }
        ], eventType, user, roles);
    }

    static async getTopItems(model, groupField, limit = 5, eventType, user, roles) {
        return this.executeAggregation(model, [
            { $group: { _id: `$${groupField}`, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $project: { name: "$_id", value: "$count", _id: 0 } }
        ], eventType, user, roles);
    }

    static async getJobAnalytics(user) {
        try {
            const [statusDistribution, jobsOverTime, priorityDistribution] = await Promise.all([
                this.getDistribution(Job, 'status', 'job-status-distribution', user),
                this.getTimeSeries(Job, 'createdAt', '%Y-%m-%d', 'job-time-series', user),
                this.getDistribution(Job, 'priority', 'job-priority-distribution', user)
            ]);

            return {
                statusDistribution,
                jobsOverTime,
                priorityDistribution
            };
        } catch (error) {
            console.error('Job analytics error:', error);
            throw error;
        }
    }

    static async getCustomerAnalytics(user) {
        const [customerTypeDistribution, customersOverTime] = await Promise.all([
            this.getDistribution(Customer, 'customer_type', 'customer-type-distribution', user),
            this.getTimeSeries(Customer, 'created_at', '%Y-%m', 'customer-time-series', user)
        ]);

        return {
            customerTypeDistribution,
            customersOverTime
        };
    }

    static async getDeviceAnalytics(user) {
        const [deviceTypeDistribution, warrantyStatus, topManufacturers] = await Promise.all([
            this.getDistribution(Device, 'device_type', 'device-type-distribution', user),
            this.getDistribution(Device, 'warranty_status', 'device-warranty-distribution', user),
            this.getTopItems(Device, 'manufacturer', 5, 'device-top-manufacturers', user)
        ]);

        return {
            deviceTypeDistribution,
            warrantyStatus,
            topManufacturers
        };
    }

    static async getUserAnalytics(user) {
        const [roleDistribution, userActivity] = await Promise.all([
            this.getDistribution(User, 'role', 'user-role-distribution', user),
            this.executeAggregation(ActivityLog, [
                { $group: { _id: "$user_id", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" },
                { $project: { name: "$user.name", value: "$count", _id: 0 } }
            ], 'user-activity', user)
        ]);

        return {
            roleDistribution,
            userActivity
        };
    }

    static async getPartsAnalytics(user) {
        const [statusDistribution, partsOverTime, urgencyDistribution] = await Promise.all([
            this.getDistribution(PartsRequest, 'status', 'parts-status-distribution', user, ['manager', 'administrator', 'parts_team']),
            this.getTimeSeries(PartsRequest, 'requested_at', '%Y-%m', 'parts-time-series', user, ['manager', 'administrator', 'parts_team']),
            this.getDistribution(PartsRequest, 'urgency', 'parts-urgency-distribution', user, ['manager', 'administrator', 'parts_team'])
        ]);

        return {
            statusDistribution,
            partsOverTime,
            urgencyDistribution
        };
    }

    static async getActivityAnalytics(user) {
        const [activityTypes, activityOverTime, busiestHours] = await Promise.all([
            this.getDistribution(ActivityLog, 'action', 'activity-type-distribution', user),
            this.getTimeSeries(ActivityLog, 'timestamp', '%Y-%m-%d', 'activity-time-series', user),
            this.executeAggregation(ActivityLog, [
                {
                    $project: {
                        hour: { $hour: "$timestamp" }
                    }
                },
                { $group: { _id: "$hour", count: { $sum: 1 } } },
                { $sort: { "_id": 1 } },
                { $project: { name: { $concat: [{ $toString: "$_id" }, "-00"] }, value: "$count", _id: 0 } }
            ], 'activity-busy-hours', user)
        ]);

        return {
            activityTypes,
            activityOverTime,
            busiestHours
        };
    }

    static async getTechnicianPerformance(user) {
        const performanceData = await this.executeAggregation(Job, [
            {
                $match: {
                    assigned_to: { $exists: true, $ne: null },
                    status: "Closed"
                }
            },
            {
                $group: {
                    _id: "$assigned_to",
                    completedJobs: { $sum: 1 },
                    avgCompletionTime: {
                        $avg: {
                            $divide: [
                                { $subtract: ["$completed_date", "$created_at"] },
                                1000 * 60 * 60
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "technician"
                }
            },
            { $unwind: "$technician" },
            {
                $project: {
                    name: "$technician.name",
                    completedJobs: 1,
                    avgCompletionTime: { $round: ["$avgCompletionTime", 2] },
                    _id: 0
                }
            },
            { $sort: { completedJobs: -1 } }
        ], 'technician-performance-updated', user);

        return performanceData;
    }
}

module.exports = AnalyticsService;