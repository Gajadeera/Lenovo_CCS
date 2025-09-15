const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');
const cloudinaryService = require('./cloudinaryService');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');
const { cleanupTempFiles } = require('../utils/fileHandler');
const { PartsRequest, Job, User } = require('../models');

class PartsRequestService {
    constructor() {
        this.models = { PartsRequest, Job, User };
    }

    // Common population configuration
    get populateConfig() {
        return [
            {
                path: 'job_id',
                select: 'job_number serial_number customer',
                populate: { path: 'customer', select: 'name email phone' }
            },
            { path: 'requested_by', select: 'name email role' },
            { path: 'approved_by', select: 'name email role' }
        ];
    }

    // Helper function for common parts request population
    populatePartsRequest(query) {
        return query.populate(this.populateConfig);
    }

    async handlePartsRequestFileUploads(files, requestId, userId) {
        try {
            const uploadResults = await cloudinaryService.uploadMultipleFiles(
                files,
                `Lenovo_CCS/Parts_Requests/${requestId}`,
                (file, index) => `attachment_${Date.now()}_${index}`
            );

            return uploadResults.map((result, i) => ({
                url: result.url,
                public_id: result.public_id,
                type: files[i].mimetype.startsWith('image/') ? 'image' :
                    files[i].mimetype === 'application/pdf' ? 'document' : 'other',
                name: files[i].originalname,
                uploaded_at: new Date(),
                uploaded_by: userId
            }));
        } catch (error) {
            console.error('Error uploading parts request files:', error);
            throw new ApiError(500, 'Failed to upload parts request attachments');
        }
    }

    async createNotification(target, message, type, metadata, relatedId) {
        const notificationData = {
            message,
            type,
            relatedId,
            metadata
        };

        if (target.userId) {
            notificationData.userId = target.userId;
        } else if (target.roles) {
            notificationData.targetRoles = target.roles;
        }

        await notificationService.createNotification(notificationData);
    }

    async emitPartsRequestEvent(eventName, partsRequest, user, metadata = {}) {
        const io = getIO();
        if (!io) return;

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: user._id,
                name: user.name,
                role: user.role
            },
            partsRequest: partsRequest.toObject ? partsRequest.toObject() : partsRequest,
            metadata
        };

        const events = {
            'created': () => {
                RoomManager.emitToRoles(['manager', 'parts_team'], 'parts-request-created', eventData);
                io.to(`user-${user._id}`).emit('parts-request-created', eventData);

                if (partsRequest.urgency === 'High') {
                    RoomManager.emitToRole('manager', 'high-urgency-parts-request-created', {
                        ...eventData,
                        metadata: { isHighUrgency: true }
                    });
                }
            },
            'updated': () => {
                RoomManager.emitToRoles(['manager', 'parts_team'], 'parts-request-updated', eventData);
                io.to(`user-${partsRequest.requested_by}`).emit('parts-request-updated', eventData);
            },
            'approved': () => {
                RoomManager.emitToRoles(['manager', 'parts_team'], 'parts-request-approved', eventData);
                io.to(`user-${partsRequest.requested_by}`).emit('parts-request-approved', eventData);

                if (partsRequest.urgency === 'High') {
                    RoomManager.emitToRole('manager', 'high-urgency-parts-request-approved', eventData);
                }
            },
            'rejected': () => {
                RoomManager.emitToRoles(['manager', 'parts_team'], 'parts-request-rejected', eventData);
                io.to(`user-${partsRequest.requested_by}`).emit('parts-request-rejected', eventData);
            },
            'fulfilled': () => {
                RoomManager.emitToRoles(['manager', 'parts_team'], 'parts-request-fulfilled', eventData);
                io.to(`user-${partsRequest.requested_by}`).emit('parts-request-fulfilled', eventData);
            },
            'deleted': () => {
                RoomManager.emitToRoles(['manager', 'parts_team'], 'parts-request-deleted', eventData);
                if (partsRequest.requested_by.equals(user._id)) {
                    io.to(`user-${user._id}`).emit('parts-request-deleted', eventData);
                }
            }
        };

        if (events[eventName]) {
            events[eventName]();
        }
    }

    async validatePartsRequestData(data) {
        const { job_id, parts_description } = data;

        if (!job_id) throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
        if (!parts_description) throw new ApiError(httpStatus.BAD_REQUEST, 'Parts description is required');

        const job = await this.models.Job.findById(job_id).lean();
        if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');

        return job;
    }

    async createPartsRequest(data, files, user) {
        let tempFilePaths = [];
        try {
            await this.validatePartsRequestData(data);

            const partsRequest = await this.models.PartsRequest.create({
                ...data,
                requested_by: user._id,
                status: 'Pending',
                attachments: [],
                requested_at: new Date(),
                updated_at: new Date()
            });

            // Handle file uploads
            if (files?.length > 0) {
                tempFilePaths = files.map(file => file.path);
                partsRequest.attachments = await this.handlePartsRequestFileUploads(files, partsRequest._id, user._id);
                await partsRequest.save();
            }

            const populatedRequest = await this.populatePartsRequest(
                this.models.PartsRequest.findById(partsRequest._id)
            );

            // Create notifications
            await Promise.all([
                this.createNotification(
                    { roles: ['manager', 'parts_team'] },
                    `New parts request created for job ${populatedRequest.job_id?.job_number || 'Unknown'}`,
                    'parts-request',
                    {
                        action: 'parts_request_created',
                        createdBy: user._id,
                        jobNumber: populatedRequest.job_id?.job_number,
                        partsDescription: populatedRequest.parts_description,
                        urgency: populatedRequest.urgency
                    },
                    populatedRequest._id
                ),
                this.createNotification(
                    { userId: user._id },
                    `Your parts request has been submitted successfully`,
                    'parts-request',
                    {
                        action: 'parts_request_submitted',
                        jobNumber: populatedRequest.job_id?.job_number,
                        partsDescription: populatedRequest.parts_description
                    },
                    populatedRequest._id
                )
            ]);

            // Emit socket events
            await this.emitPartsRequestEvent('created', populatedRequest, user);

            return {
                success: true,
                data: populatedRequest,
                message: 'Parts request created successfully'
            };

        } catch (error) {
            throw error;
        } finally {
            cleanupTempFiles(tempFilePaths);
        }
    }

    async buildPartsRequestFilter(query, user) {
        const { status, urgency, job_number, request_number, requested_by } = query;
        const filter = {};

        if (status) filter.status = status;
        if (urgency) filter.urgency = urgency;
        if (requested_by) filter.requested_by = requested_by;
        if (request_number) filter._id = request_number;

        // Handle job number filter
        if (job_number) {
            const matchingJobs = await this.models.Job.find({
                job_number: { $regex: job_number, $options: 'i' }
            }).select('_id');

            filter.job_id = { $in: matchingJobs.map(job => job._id) };
        }

        if (user.role === 'technician') {
            filter.requested_by = user._id;
        }

        return filter;
    }

    async getAllPartsRequests(query, user) {
        try {
            const filter = await this.buildPartsRequestFilter(query, user);
            const pageNum = Math.max(1, parseInt(query.page) || 1);
            const limitNum = Math.max(1, parseInt(query.limit) || 20);

            const [total, partsRequests] = await Promise.all([
                this.models.PartsRequest.countDocuments(filter),
                this.models.PartsRequest.find(filter)
                    .populate({
                        path: 'job_id',
                        select: 'job_number serial_number',
                        options: { retainNullValues: true }
                    })
                    .populate('requested_by', 'name email role')
                    .populate('approved_by', 'name email role')
                    .sort({ requested_at: -1 })
                    .skip((pageNum - 1) * limitNum)
                    .limit(limitNum)
                    .lean()
            ]);

            return {
                success: true,
                data: partsRequests,
                totalCount: total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            };

        } catch (error) {
            throw error;
        }
    }

    async getPartsRequest(requestId, user) {
        try {
            const partsRequest = await this.populatePartsRequest(
                this.models.PartsRequest.findById(requestId)
            );

            if (!partsRequest) throw new ApiError(404, 'Parts request not found');

            if (user.role === 'technician' && !partsRequest.requested_by._id.equals(user._id)) {
                throw new ApiError(403, 'Not authorized to view this request');
            }

            await this.createNotification(
                { userId: user._id },
                `You viewed parts request for job ${partsRequest.job_id?.job_number || 'Unknown'}`,
                'parts-request',
                {
                    action: 'parts_request_viewed',
                    jobNumber: partsRequest.job_id?.job_number
                },
                partsRequest._id
            );

            return {
                success: true,
                data: partsRequest,
                message: 'Parts request retrieved successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    async getPartsRequestsByJob(jobId, user) {
        try {
            if (!mongoose.Types.ObjectId.isValid(jobId)) {
                throw new ApiError(400, 'Invalid job ID');
            }

            const filter = { job_id: jobId };
            if (user.role === 'technician') {
                filter.requested_by = user._id;
            }

            const partsRequests = await this.populatePartsRequest(
                this.models.PartsRequest.find(filter)
            ).sort({ requested_at: -1 });

            return {
                success: true,
                data: partsRequests,
                message: 'Parts requests retrieved successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    async getPartsRequestsByRequester(userId, currentUser) {
        try {
            const user = await this.models.User.findById(userId);
            if (!user) throw new ApiError(404, 'User not found');

            if ((currentUser.role === 'technician' && !currentUser._id.equals(userId)) ||
                (['technician', 'manager'].includes(currentUser.role) && !currentUser._id.equals(userId))) {
                throw new ApiError(403, 'Not authorized to view these requests');
            }

            const partsRequests = await this.populatePartsRequest(
                this.models.PartsRequest.find({ requested_by: userId })
            ).sort({ requested_at: -1 });

            return {
                success: true,
                data: partsRequests,
                message: 'Parts requests retrieved successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    async updatePartsRequest(requestId, data, files, user) {
        let tempFilePaths = [];
        try {
            const partsRequest = await this.models.PartsRequest.findById(requestId);
            if (!partsRequest) throw new ApiError(404, 'Parts request not found');

            const oldStatus = partsRequest.status;
            const canUpdateStatus = ['administrator', 'manager', 'parts_team'].includes(user.role);

            // Handle status updates
            if (data.status && data.status !== oldStatus) {
                if (!canUpdateStatus) {
                    throw new ApiError(403, 'Not authorized to update status');
                }

                this.validateStatusTransition(oldStatus, data.status);

                if (data.status === 'Approved') {
                    partsRequest.approved_by = user._id;
                    partsRequest.approved_at = new Date();
                    partsRequest.rejection_reason = undefined;
                } else if (data.status === 'Rejected') {
                    if (!data.rejection_reason) {
                        throw new ApiError(400, 'Rejection reason is required when rejecting a request');
                    }
                    partsRequest.approved_by = user._id;
                    partsRequest.approved_at = new Date();
                    partsRequest.rejection_reason = data.rejection_reason;
                } else if (data.status === 'Fulfilled') {
                    partsRequest.fulfillment_date = new Date();
                }

                partsRequest.status = data.status;
            }

            // Handle file operations
            if (data.documents_to_delete) {
                const docsToDelete = this.parseDocumentsToDelete(data.documents_to_delete);
                await cloudinaryService.deleteMultipleFiles(docsToDelete);
                partsRequest.attachments = partsRequest.attachments.filter(
                    attachment => !docsToDelete.includes(attachment.public_id)
                );
            }

            if (files?.length > 0) {
                tempFilePaths = files.map(file => file.path);
                const newAttachments = await this.handlePartsRequestFileUploads(files, partsRequest._id, user._id);
                partsRequest.attachments.push(...newAttachments);
            }

            // Update other fields
            Object.assign(partsRequest, {
                parts_description: data.parts_description || partsRequest.parts_description,
                urgency: data.urgency || partsRequest.urgency,
                notes: data.notes || partsRequest.notes,
                updated_at: new Date()
            });

            await partsRequest.save();
            const populatedRequest = await this.populatePartsRequest(
                this.models.PartsRequest.findById(partsRequest._id)
            );

            // Handle notifications for status changes
            if (data.status && data.status !== oldStatus) {
                await this.handleStatusChangeNotifications(populatedRequest, user, oldStatus, data.status);
            }

            // Emit socket events
            await this.emitPartsRequestEvent('updated', populatedRequest, user, {
                oldStatus,
                newStatus: data.status || partsRequest.status
            });

            return {
                success: true,
                data: populatedRequest,
                message: 'Parts request updated successfully'
            };

        } catch (error) {
            throw error;
        } finally {
            cleanupTempFiles(tempFilePaths);
        }
    }

    validateStatusTransition(oldStatus, newStatus) {
        const validTransitions = {
            'Pending': ['Approved', 'Rejected'],
            'Approved': ['Fulfilled'],
            'Rejected': [],
            'Fulfilled': []
        };

        if (!validTransitions[oldStatus].includes(newStatus)) {
            throw new ApiError(400, `Invalid status transition from ${oldStatus} to ${newStatus}`);
        }
    }

    parseDocumentsToDelete(documents_to_delete) {
        try {
            const docs = JSON.parse(documents_to_delete);
            return Array.isArray(docs) ? docs : [docs];
        } catch (e) {
            throw new ApiError(400, 'Invalid documents_to_delete format');
        }
    }

    async handleStatusChangeNotifications(partsRequest, user, oldStatus, newStatus) {
        await Promise.all([
            this.createNotification(
                { roles: ['manager', 'parts_team'] },
                `Parts request status changed from ${oldStatus} to ${newStatus}`,
                'parts-request',
                {
                    action: 'parts_request_status_changed',
                    changedBy: user._id,
                    oldStatus,
                    newStatus,
                    jobNumber: partsRequest.job_id?.job_number
                },
                partsRequest._id
            ),
            this.createNotification(
                { userId: partsRequest.requested_by },
                `Your parts request status changed to ${newStatus}`,
                'parts-request',
                {
                    action: 'parts_request_status_changed',
                    oldStatus,
                    newStatus,
                    jobNumber: partsRequest.job_id?.job_number
                },
                partsRequest._id
            )
        ]);
    }

    async updatePartsRequestStatus(requestId, status, user, additionalData = {}) {
        try {
            const partsRequest = await this.models.PartsRequest.findById(requestId);
            if (!partsRequest) throw new ApiError(404, 'Parts request not found');

            if (partsRequest.status !== 'Pending') {
                throw new ApiError(400, 'Request has already been processed');
            }

            Object.assign(partsRequest, {
                status,
                approved_by: user._id,
                approved_at: new Date(),
                updated_at: new Date(),
                ...additionalData
            });

            await partsRequest.save();
            const populatedRequest = await this.populatePartsRequest(
                this.models.PartsRequest.findById(partsRequest._id)
            );

            await this.emitPartsRequestEvent(status.toLowerCase(), populatedRequest, user);

            return {
                success: true,
                data: populatedRequest,
                message: `Parts request ${status.toLowerCase()} successfully`
            };

        } catch (error) {
            throw error;
        }
    }

    async approvePartsRequest(requestId, user) {
        return this.updatePartsRequestStatus(requestId, 'Approved', user, {
            rejection_reason: undefined
        });
    }

    async rejectPartsRequest(requestId, rejection_reason, user) {
        if (!rejection_reason) throw new ApiError(400, 'Rejection reason is required');

        return this.updatePartsRequestStatus(requestId, 'Rejected', user, {
            rejection_reason,
            fulfillment_date: undefined
        });
    }

    async fulfillPartsRequest(requestId, user) {
        try {
            const partsRequest = await this.models.PartsRequest.findById(requestId);
            if (!partsRequest) throw new ApiError(404, 'Parts request not found');

            if (partsRequest.status !== 'Approved') {
                throw new ApiError(400, 'Only approved requests can be marked as fulfilled');
            }

            partsRequest.status = 'Fulfilled';
            partsRequest.fulfillment_date = new Date();
            partsRequest.updated_at = new Date();

            await partsRequest.save();
            const populatedRequest = await this.populatePartsRequest(
                this.models.PartsRequest.findById(partsRequest._id)
            );

            await this.emitPartsRequestEvent('fulfilled', populatedRequest, user);

            return {
                success: true,
                data: populatedRequest,
                message: 'Parts request fulfilled successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    async deletePartsRequest(requestId, user) {
        try {
            const partsRequest = await this.models.PartsRequest.findById(requestId);
            if (!partsRequest) throw new ApiError(404, 'Parts request not found');

            if (user.role !== 'administrator' && !partsRequest.requested_by.equals(user._id)) {
                throw new ApiError(403, 'Not authorized to delete this request');
            }

            if (partsRequest.status !== 'Pending' && user.role !== 'administrator') {
                throw new ApiError(400, 'Cannot delete a request that has been processed');
            }

            // Delete attachments
            if (partsRequest.attachments?.length > 0) {
                const publicIds = partsRequest.attachments.map(attachment => attachment.public_id);
                await cloudinaryService.deleteMultipleFiles(publicIds);
                await cloudinaryService.deleteFolder(`Lenovo_CCS/Parts_Requests/${partsRequest._id}`);
            }

            await this.models.PartsRequest.findByIdAndDelete(partsRequest._id);

            await this.emitPartsRequestEvent('deleted', partsRequest, user);

            return {
                success: true,
                message: 'Parts request deleted successfully',
                data: { _id: partsRequest._id }
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new PartsRequestService();