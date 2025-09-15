const { SystemIssue, User, Job } = require('../models');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');
const cloudinaryService = require('./cloudinaryService');
const { cleanupTempFiles } = require('../utils/fileHandler');

class SystemIssueService {
    static async validateAndCreateIssue(issueData) {
        const { title, description, category, priority = 'Medium' } = issueData;

        if (!title) throw new ApiError(httpStatus.BAD_REQUEST, 'Title is required');
        if (!description) throw new ApiError(httpStatus.BAD_REQUEST, 'Description is required');
        if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Category is required');

        return {
            title,
            description,
            category,
            priority,
            status: 'Open',
            created_at: new Date(),
            updated_at: new Date()
        };
    }

    static async handleScreenshotUploads(files, issueId) {
        if (!files || files.length === 0) return [];

        const folder = `Lenovo_CCS/System_Issues/${issueId}`;

        // Clean up any existing resources
        try {
            await cloudinaryService.deleteFolder(folder);
        } catch (folderError) {
            console.log('Folder cleanup not needed:', folderError.message);
        }

        const uploadPromises = files.map(async (file, index) => {
            const result = await cloudinaryService.uploadFile(file.path, folder, {
                public_id: `screenshot_${index}`,
                overwrite: false
            });

            return {
                url: result.secure_url,
                public_id: result.public_id,
                name: file.originalname,
                uploaded_at: new Date()
            };
        });

        return await Promise.all(uploadPromises);
    }

    static async createSystemIssueNotifications(issue, currentUser) {
        const notifications = [];

        // Admin notification
        notifications.push({
            targetRoles: ['administrator'],
            message: `New system issue reported: ${issue.title}`,
            type: 'system-issue',
            relatedId: issue._id,
            metadata: {
                action: 'system_issue_created',
                createdBy: currentUser._id,
                title: issue.title,
                category: issue.category,
                priority: issue.priority
            }
        });

        // User notification
        notifications.push({
            userId: currentUser._id,
            message: `Your system issue "${issue.title}" has been reported successfully`,
            type: 'system-issue',
            relatedId: issue._id,
            metadata: {
                action: 'system_issue_reported',
                title: issue.title
            }
        });

        // Manager notification for certain categories
        if (['hardware', 'software', 'network'].includes(issue.category)) {
            notifications.push({
                targetRoles: ['manager'],
                message: `New ${issue.category} system issue reported: ${issue.title}`,
                type: 'system-issue',
                relatedId: issue._id,
                metadata: {
                    action: 'system_issue_reported',
                    category: issue.category,
                    title: issue.title
                }
            });
        }

        await Promise.all(notifications.map(notification =>
            notificationService.createNotification(notification)
        ));
    }

    static async emitSystemIssueEvent(eventName, issue, currentUser, metadata = {}) {
        const io = getIO();
        if (!io) return;

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: currentUser._id,
                name: currentUser.name,
                role: currentUser.role
            },
            systemIssue: issue,
            metadata
        };

        switch (eventName) {
            case 'created':
                RoomManager.emitToRoles(['administrator'], 'system-issue-created', eventData);
                if (['hardware', 'software', 'network'].includes(issue.category)) {
                    RoomManager.emitToRole('manager', 'system-issue-created', eventData);
                }
                io.to(`user-${currentUser._id}`).emit('your-system-issue-created', eventData);
                break;

            case 'updated':
                RoomManager.emitToRoles(['administrator'], 'system-issue-updated', eventData);
                if (issue.reported_by) {
                    io.to(`user-${issue.reported_by._id}`).emit('your-system-issue-updated', eventData);
                }
                if (issue.assigned_to) {
                    io.to(`user-${issue.assigned_to._id}`).emit('assigned-system-issue-updated', eventData);
                }
                break;

            case 'deleted':
                RoomManager.emitToRoles(['administrator'], 'system-issue-deleted', eventData);
                if (issue.reported_by) {
                    io.to(`user-${issue.reported_by._id}`).emit('your-system-issue-deleted', eventData);
                }
                if (issue.assigned_to) {
                    io.to(`user-${issue.assigned_to._id}`).emit('assigned-system-issue-deleted', eventData);
                }
                break;
        }
    }

    static async createSystemIssue(issueData, files, currentUser) {
        let tempFilePaths = files ? files.map(file => file.path) : [];

        try {
            // Validate request data
            const hasBodyData = issueData && Object.keys(issueData).length > 0;
            const hasFiles = files && files.length > 0;
            if (!hasBodyData && !hasFiles) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Request data is missing');
            }

            // Create issue
            const issuePayload = await this.validateAndCreateIssue(issueData);
            issuePayload.reported_by = currentUser._id;

            const systemIssue = await SystemIssue.create(issuePayload);

            // Handle screenshots
            if (hasFiles) {
                systemIssue.screenshots = await this.handleScreenshotUploads(files, systemIssue._id);
                await systemIssue.save();
            }

            const populatedIssue = await SystemIssue.findById(systemIssue._id)
                .populate('reported_by', 'name email')
                .populate('assigned_to', 'name email');

            // Create notifications and emit events
            await this.createSystemIssueNotifications(populatedIssue, currentUser);
            await this.emitSystemIssueEvent('created', populatedIssue, currentUser);

            return {
                success: true,
                data: populatedIssue
            };

        } catch (error) {
            console.error('Error in createSystemIssue:', error);

            await notificationService.createNotification({
                targetRoles: ['administrator'],
                message: `Failed to create system issue: ${error.message}`,
                type: 'system-issue-error',
                metadata: {
                    action: 'system_issue_creation_failed',
                    error: error.message,
                    userId: currentUser._id
                }
            });

            throw error;
        } finally {
            cleanupTempFiles(tempFilePaths);
        }
    }

    static async getAllSystemIssues(filters, currentUser) {
        try {
            const { status, priority, category, page = 1, limit = 10 } = filters;

            const filter = {};
            if (status) filter.status = status;
            if (priority) filter.priority = priority;
            if (category) filter.category = category;

            if (currentUser.role === 'technician') {
                filter.$or = [
                    { reported_by: currentUser._id },
                    { assigned_to: currentUser._id }
                ];
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const [docs, total] = await Promise.all([
                SystemIssue.find(filter)
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .populate('reported_by', 'name email')
                    .populate('assigned_to', 'name email')
                    .exec(),
                SystemIssue.countDocuments(filter)
            ]);

            return {
                success: true,
                data: docs,
                pagination: {
                    total,
                    pages: Math.ceil(total / limitNum),
                    page: pageNum,
                    limit: limitNum
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async getSystemIssue(issueId, currentUser) {
        try {
            const systemIssue = await SystemIssue.findById(issueId)
                .populate('reported_by', 'name email')
                .populate('assigned_to', 'name email')
                .populate('comments.user_id', 'name email');

            if (!systemIssue) throw new ApiError(404, 'System issue not found');

            if (currentUser.role === 'technician' &&
                !systemIssue.reported_by._id.equals(currentUser._id) &&
                (!systemIssue.assigned_to || !systemIssue.assigned_to._id.equals(currentUser._id))) {
                throw new ApiError(403, 'Not authorized to view this issue');
            }

            if (currentUser.role === 'administrator') {
                await notificationService.createNotification({
                    userId: currentUser._id,
                    message: `You viewed system issue: ${systemIssue.title}`,
                    type: 'system-issue',
                    relatedId: systemIssue._id,
                    metadata: {
                        action: 'system_issue_viewed',
                        title: systemIssue.title
                    }
                });
            }

            return {
                success: true,
                data: systemIssue
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateSystemIssue(issueId, updateData, files, currentUser) {
        let tempFilePaths = files ? files.map(file => file.path) : [];

        try {
            // Find and validate issue
            const systemIssue = await SystemIssue.findById(issueId);
            if (!systemIssue) throw new ApiError(404, 'System issue not found');

            // Permission check
            const isOwner = systemIssue.reported_by.equals(currentUser._id);
            const isAssigned = systemIssue.assigned_to && systemIssue.assigned_to.equals(currentUser._id);
            if (currentUser.role === 'technician' && !isOwner && !isAssigned) {
                throw new ApiError(403, 'Not authorized to update this issue');
            }

            const oldValues = {
                title: systemIssue.title,
                category: systemIssue.category,
                priority: systemIssue.priority,
                status: systemIssue.status
            };

            // Handle screenshot deletions
            if (updateData.screenshots_to_delete) {
                const screenshotsToDelete = typeof updateData.screenshots_to_delete === 'string' ?
                    JSON.parse(updateData.screenshots_to_delete) : updateData.screenshots_to_delete;

                const validPublicIds = Array.isArray(screenshotsToDelete) ?
                    screenshotsToDelete.filter(id => id && id !== 'default_public_id') :
                    [screenshotsToDelete].filter(id => id && id !== 'default_public_id');

                if (validPublicIds.length > 0) {
                    await cloudinaryService.deleteMultipleFiles(validPublicIds);
                    systemIssue.screenshots = systemIssue.screenshots.filter(
                        screenshot => !validPublicIds.includes(screenshot.public_id)
                    );
                }
            }

            // Handle new screenshot uploads
            if (files && files.length > 0) {
                const newScreenshots = await this.handleScreenshotUploads(files, systemIssue._id);
                systemIssue.screenshots.push(...newScreenshots);
            }

            // Prepare update data
            const { title, description, category, priority, status } = updateData;
            const updateDataObj = {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(category !== undefined && { category }),
                ...(priority !== undefined && { priority }),
                ...(status !== undefined && { status }),
                screenshots: systemIssue.screenshots,
                updated_at: new Date()
            };

            // Update issue
            const updatedIssue = await SystemIssue.findByIdAndUpdate(
                issueId,
                updateDataObj,
                { new: true, runValidators: true }
            ).populate('reported_by', 'name email')
                .populate('assigned_to', 'name email')
                .populate('comments.user_id', 'name email');

            // Determine changed fields
            const changedFields = [];
            if (title !== undefined && title !== oldValues.title) changedFields.push('title');
            if (category !== undefined && category !== oldValues.category) changedFields.push('category');
            if (priority !== undefined && priority !== oldValues.priority) changedFields.push('priority');
            if (status !== undefined && status !== oldValues.status) changedFields.push('status');
            if (files && files.length > 0) changedFields.push('screenshots');
            if (updateData.screenshots_to_delete) changedFields.push('screenshots');

            // Send notifications if fields changed
            if (changedFields.length > 0) {
                await this.createUpdateNotifications(updatedIssue, currentUser, changedFields);
                await this.emitSystemIssueEvent('updated', updatedIssue, currentUser, { changedFields, oldValues });
            }

            return {
                success: true,
                data: updatedIssue,
                changedFields
            };

        } catch (error) {
            console.error('Error in updateSystemIssue:', error);

            await notificationService.createNotification({
                targetRoles: ['administrator'],
                message: `Failed to update system issue: ${error.message}`,
                type: 'system-issue-error',
                metadata: {
                    action: 'system_issue_update_failed',
                    error: error.message,
                    userId: currentUser._id,
                    issueId
                }
            });

            throw error;
        } finally {
            cleanupTempFiles(tempFilePaths);
        }
    }

    static async createUpdateNotifications(issue, currentUser, changedFields) {
        const notifications = [];

        // Admin notification
        notifications.push({
            targetRoles: ['administrator'],
            message: `System issue updated: ${issue.title}`,
            type: 'system-issue',
            relatedId: issue._id,
            metadata: {
                action: 'system_issue_updated',
                updatedBy: currentUser._id,
                title: issue.title,
                changedFields
            }
        });

        // Reporter notification
        if (issue.reported_by && !issue.reported_by._id.equals(currentUser._id)) {
            notifications.push({
                userId: issue.reported_by._id,
                message: `Your system issue "${issue.title}" has been updated`,
                type: 'system-issue',
                relatedId: issue._id,
                metadata: {
                    action: 'system_issue_updated',
                    updatedBy: currentUser._id,
                    title: issue.title,
                    changedFields
                }
            });
        }

        // Assigned technician notification
        if (issue.assigned_to && !issue.assigned_to._id.equals(currentUser._id)) {
            notifications.push({
                userId: issue.assigned_to._id,
                message: `Assigned system issue "${issue.title}" has been updated`,
                type: 'system-issue',
                relatedId: issue._id,
                metadata: {
                    action: 'system_issue_updated',
                    updatedBy: currentUser._id,
                    title: issue.title,
                    changedFields
                }
            });
        }

        await Promise.all(notifications.map(notification =>
            notificationService.createNotification(notification)
        ));
    }

    static async deleteSystemIssue(issueId, currentUser) {
        try {
            const systemIssue = await SystemIssue.findById(issueId);
            if (!systemIssue) throw new ApiError(404, 'System issue not found');

            if (currentUser.role !== 'administrator' && !systemIssue.reported_by.equals(currentUser._id)) {
                throw new ApiError(403, 'Not authorized to delete this issue');
            }

            if (systemIssue.status !== 'Open' && currentUser.role !== 'administrator') {
                throw new ApiError(400, 'Cannot delete an issue that has been processed');
            }

            // Clean up screenshots
            if (systemIssue.screenshots && systemIssue.screenshots.length > 0) {
                const publicIds = systemIssue.screenshots.map(screenshot => screenshot.public_id);
                await cloudinaryService.deleteMultipleFiles(publicIds);

                try {
                    await cloudinaryService.deleteFolder(`Lenovo_CCS/System_Issues/${systemIssue._id}`);
                } catch (folderError) {
                    console.log(`Screenshots folder cleanup failed: ${folderError.message}`);
                }
            }

            await SystemIssue.findByIdAndDelete(systemIssue._id);

            // Create notifications
            await this.createDeleteNotifications(systemIssue, currentUser);

            // Emit events
            await this.emitSystemIssueEvent('deleted', systemIssue, currentUser);

            return {
                success: true,
                data: {}
            };

        } catch (error) {
            console.error('Error in deleteSystemIssue:', error);

            await notificationService.createNotification({
                targetRoles: ['administrator'],
                message: `Failed to delete system issue: ${error.message}`,
                type: 'system-issue-error',
                metadata: {
                    action: 'system_issue_deletion_failed',
                    error: error.message,
                    userId: currentUser._id,
                    issueId
                }
            });

            throw error;
        }
    }

    static async createDeleteNotifications(issue, currentUser) {
        const notifications = [];

        // Admin notification
        notifications.push({
            targetRoles: ['administrator'],
            message: `System issue deleted: ${issue.title}`,
            type: 'system-issue',
            relatedId: issue._id,
            metadata: {
                action: 'system_issue_deleted',
                deletedBy: currentUser._id,
                title: issue.title
            }
        });

        // Reporter notification
        if (issue.reported_by && !issue.reported_by.equals(currentUser._id)) {
            notifications.push({
                userId: issue.reported_by._id,
                message: `Your system issue "${issue.title}" has been deleted`,
                type: 'system-issue',
                relatedId: issue._id,
                metadata: {
                    action: 'system_issue_deleted',
                    deletedBy: currentUser._id,
                    title: issue.title
                }
            });
        }

        // Assigned technician notification
        if (issue.assigned_to && !issue.assigned_to.equals(currentUser._id)) {
            notifications.push({
                userId: issue.assigned_to._id,
                message: `Assigned system issue "${issue.title}" has been deleted`,
                type: 'system-issue',
                relatedId: issue._id,
                metadata: {
                    action: 'system_issue_deleted',
                    deletedBy: currentUser._id,
                    title: issue.title
                }
            });
        }

        await Promise.all(notifications.map(notification =>
            notificationService.createNotification(notification)
        ));
    }

    static async getIssueStats() {
        try {
            const stats = await SystemIssue.aggregate([
                {
                    $facet: {
                        totalCount: [{ $count: 'count' }],
                        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
                        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
                        recentIssues: [
                            { $sort: { created_at: -1 } },
                            { $limit: 5 },
                            { $project: { title: 1, status: 1, priority: 1, category: 1, created_at: 1 } }
                        ]
                    }
                }
            ]);

            const result = {
                total: stats[0].totalCount[0]?.count || 0,
                byStatus: stats[0].byStatus,
                byPriority: stats[0].byPriority,
                byCategory: stats[0].byCategory,
                recentIssues: stats[0].recentIssues
            };

            return {
                success: true,
                data: result
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SystemIssueService;