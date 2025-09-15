const { User, Customer, Device, Job, Counter } = require('../models');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');
const cloudinaryService = require('./cloudinaryService');
const SkillMatcher = require('../utils/skillMatcher');
const { cleanupTempFiles } = require('../utils/fileHandler');

class JobService {
    static populateJob(jobQuery) {
        return jobQuery
            .populate({
                path: 'customer',
                select: 'name email phone customer_type is_ad_hoc'
            })
            .populate({
                path: 'device',
                select: 'model_number serial_number manufacturer device_type is_ad_hoc'
            })
            .populate('created_by', 'name email role')
            .populate('assigned_to', 'name email role')
            .populate('previous_assignments.technician', 'name email')
            .populate('attachments.uploaded_by', 'name')
            .lean();
    }

    static async handleReference(input, model, requiredFields, userId) {
        try {
            if (mongoose.isValidObjectId(input)) {
                const doc = await model.findById(input);
                if (!doc) throw new ApiError(404, `${model.modelName} not found`);
                return { id: doc._id, isAdHoc: doc.is_ad_hoc || false };
            }

            if (typeof input === 'object') {
                for (const field of requiredFields) {
                    if (!input[field]) {
                        throw new ApiError(400, `Missing required field: ${field}`);
                    }
                }

                const newDoc = await model.create({
                    ...input,
                    is_ad_hoc: true,
                    created_by: userId
                });
                return { id: newDoc._id, isAdHoc: true };
            }

            throw new ApiError(400, `Invalid ${model.modelName} reference`);
        } catch (error) {
            console.error(`Error handling ${model.modelName} reference:`, error);
            throw error;
        }
    }

    static async handleJobFileUploads(files, jobId, userId) {
        try {
            const uploadResults = await cloudinaryService.uploadMultipleFiles(
                files,
                `Lenovo_CCS/Job_Attachments/${jobId}`,
                (file, index) => `attachment_${Date.now()}_${index}`
            );

            return uploadResults.map((result, i) => ({
                url: result.url,
                public_id: result.public_id,
                type: files[i].mimetype.startsWith('image/') ? 'image' :
                    files[i].mimetype === 'application/pdf' ? 'document' : 'other',
                name: files[i].originalname,
                uploaded_by: userId
            }));
        } catch (error) {
            console.error('Error uploading job files:', error);
            throw new ApiError(500, 'Failed to upload job attachments');
        }
    }

    static async createNotification(options) {
        return notificationService.createNotification({
            type: 'job',
            relatedId: options.job._id,
            ...options,
            metadata: {
                jobNumber: options.job.job_number,
                ...options.metadata
            }
        });
    }

    static async emitSocketEvent(eventName, data, target = null) {
        const io = getIO();
        if (!io) return;

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: data.userId,
                name: data.userId.name,
                role: data.userId.role
            },
            job: data.job,
            metadata: data.metadata || {}
        };

        if (target) {
            if (target.type === 'role') {
                RoomManager.emitToRoles(target.roles, eventName, eventData);
            } else if (target.type === 'user') {
                io.to(`user-${target.userId}`).emit(eventName, eventData);
            }
        } else {
            RoomManager.emitToRoles(['manager', 'coordinator'], eventName, eventData);
        }
    }

    static async validateTechnician(technicianId) {
        if (!technicianId) return null;

        const technician = await User.findById(technicianId);
        if (!technician || technician.role !== 'technician') {
            throw new ApiError(404, 'Technician not found or invalid role');
        }
        return technician;
    }

    static async handleAutoAssignment(description, autoAssignFlag) {
        if (autoAssignFlag === false) return null;

        const bestTechnician = await SkillMatcher.findBestTechnician(description);
        if (bestTechnician) {
            console.log(`Auto-assigning job to technician: ${bestTechnician.name} based on skill matching`);
            return bestTechnician._id;
        }
        return null;
    }

    static async processJobReferences(bodyData, userId) {
        const { customer, device, ...otherData } = bodyData;

        const customerRef = await this.handleReference(
            customer,
            Customer,
            ['name', 'email', 'phone'],
            userId
        );

        let deviceId = null;
        if (device) {
            const deviceRef = await this.handleReference(
                device,
                Device,
                ['model_number', 'manufacturer'],
                userId
            );
            deviceId = deviceRef.id;
        }

        return { customerId: customerRef.id, deviceId, otherData };
    }

    static async createJob(bodyData, files, userId) {
        let tempFilePaths = [];

        try {
            const requiredFields = ['customer', 'serial_number', 'job_type', 'description'];
            if (requiredFields.some(field => !bodyData[field])) {
                throw new ApiError(400, 'Missing required fields');
            }

            const { customerId, deviceId, otherData } = await this.processJobReferences(bodyData, userId);

            // Auto-assignment logic
            const assignedTechnicianId = otherData.assigned_to ||
                await this.handleAutoAssignment(otherData.description, otherData.auto_assign);

            const autoAssigned = !otherData.assigned_to && !!assignedTechnicianId;
            const jobStatus = assignedTechnicianId ? 'Assigned' : (otherData.status || 'Pending Assignment');

            await this.validateTechnician(assignedTechnicianId);

            // Create job
            const jobNumber = `JOB${(await Counter.getNextSequence('jobNumber')).toString().padStart(3, '0')}`;
            const job = await Job.create({
                job_number: jobNumber,
                ...otherData,
                customer: customerId,
                device: deviceId,
                assigned_to: assignedTechnicianId,
                status: jobStatus,
                created_by: userId,
                auto_assigned: autoAssigned
            });

            // Handle file uploads
            if (files?.length > 0) {
                tempFilePaths = files.map(file => file.path);
                job.attachments = await this.handleJobFileUploads(files, job._id, userId);
                await job.save();
            }

            const populatedJob = await this.populateJob(Job.findById(job._id));

            // Create notifications
            const notificationPromises = [];

            // Role-based notification
            notificationPromises.push(this.createNotification({
                targetRoles: ['manager', 'coordinator'],
                message: `New job created: ${populatedJob.job_number} by ${userId.name}` +
                    (autoAssigned ? ` (Auto-assigned to ${populatedJob.assigned_to?.name})` : ''),
                job: populatedJob,
                metadata: {
                    action: 'job_created',
                    createdBy: userId,
                    jobType: populatedJob.job_type,
                    autoAssigned,
                    assignedTechnician: populatedJob.assigned_to?._id,
                    status: populatedJob.status
                }
            }));

            // Notification for assigned technician
            if (populatedJob.assigned_to) {
                notificationPromises.push(this.createNotification({
                    userId: populatedJob.assigned_to._id,
                    message: `You've been ${autoAssigned ? 'auto-assigned' : 'assigned'} to job: ${populatedJob.job_number}`,
                    job: populatedJob,
                    metadata: {
                        action: autoAssigned ? 'job_auto_assigned' : 'job_assigned',
                        assignedBy: userId,
                        autoAssigned
                    }
                }));

                if (autoAssigned) {
                    notificationPromises.push(this.createNotification({
                        targetRoles: ['coordinator'],
                        message: `Job ${populatedJob.job_number} was auto-assigned to ${populatedJob.assigned_to.name} based on skill matching`,
                        job: populatedJob,
                        metadata: {
                            action: 'job_auto_assignment_notice',
                            technicianId: populatedJob.assigned_to._id,
                            reason: 'Skill-based auto-assignment'
                        }
                    }));
                }
            } else if (!autoAssigned && !assignedTechnicianId) {
                notificationPromises.push(this.createNotification({
                    targetRoles: ['coordinator'],
                    message: `Job ${populatedJob.job_number} requires manual assignment - no suitable technician found based on skills`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_requires_assignment',
                        reason: 'No matching technician found for auto-assignment'
                    }
                }));
            }

            await Promise.all(notificationPromises);

            // Emit socket events
            const eventData = { userId, job: populatedJob, metadata: { autoAssigned, status: populatedJob.status } };

            this.emitSocketEvent('job-created', eventData);

            if (populatedJob.assigned_to) {
                this.emitSocketEvent('job-assigned', eventData, { type: 'user', userId: populatedJob.assigned_to._id });

                if (autoAssigned) {
                    this.emitSocketEvent('job-auto-assigned', eventData, { type: 'role', roles: ['coordinator'] });
                }
            }

            if (populatedJob.priority === 'High') {
                this.emitSocketEvent('high-priority-job', eventData, { type: 'role', roles: ['manager', 'coordinator'] });
            }

            if (!populatedJob.assigned_to) {
                this.emitSocketEvent('job-requires-assignment', {
                    userId,
                    job: populatedJob,
                    metadata: { reason: 'No suitable technician found for auto-assignment' }
                }, { type: 'role', roles: ['coordinator'] });
            }

            if (autoAssigned) {
                this.emitSocketEvent('job-status-changed', {
                    userId,
                    job: populatedJob,
                    metadata: { oldStatus: 'Pending Assignment', newStatus: 'Assigned', reason: 'Auto-assignment' }
                }, { type: 'role', roles: ['manager', 'coordinator'] });
            }

            return {
                success: true,
                data: populatedJob,
                message: 'Job created successfully' +
                    (autoAssigned ? ' and auto-assigned based on skills' : '') +
                    (!assignedTechnicianId && !autoAssigned ? ' - requires manual assignment' : ''),
                autoAssigned,
                status: populatedJob.status
            };

        } catch (error) {
            throw error;
        } finally {
            cleanupTempFiles(tempFilePaths);
        }
    }

    static async updateJob(jobId, bodyData, files, userId) {
        let tempFilePaths = [];

        try {
            const job = await Job.findById(jobId);
            if (!job) throw new ApiError(404, 'Job not found');

            const { customer, device, assigned_to, documents_to_delete, ...updateFields } = bodyData;
            const oldValues = { ...job.toObject() };

            // Process references
            const customerId = customer ? (await this.handleReference(customer, Customer, ['name', 'email', 'phone'], userId)).id : job.customer;
            const deviceId = device ? (await this.handleReference(device, Device, ['model_number', 'manufacturer'], userId)).id : job.device;

            // Validate technician
            await this.validateTechnician(assigned_to);

            // Handle file deletions
            if (documents_to_delete) {
                let docsToDelete = Array.isArray(documents_to_delete) ? documents_to_delete :
                    typeof documents_to_delete === 'string' ? JSON.parse(documents_to_delete) : [documents_to_delete];

                const validPublicIds = docsToDelete.filter(publicId => publicId && publicId !== 'default_public_id' && publicId !== '');

                if (validPublicIds.length > 0) {
                    try {
                        await cloudinaryService.deleteMultipleFiles(validPublicIds);
                        job.attachments = job.attachments.filter(a => !validPublicIds.includes(a.public_id));
                    } catch (deleteError) {
                        console.error('Failed to delete some documents:', deleteError);
                    }
                }
            }

            // Handle new file uploads
            if (files?.length > 0) {
                tempFilePaths = files.map(file => file.path);
                const newAttachments = await this.handleJobFileUploads(files, job._id, userId);
                job.attachments.push(...newAttachments);
            }

            // Prepare update data
            const updateData = {
                ...updateFields,
                customer: customerId,
                device: deviceId,
                assigned_to: assigned_to || job.assigned_to,
                attachments: job.attachments,
                updated_at: new Date()
            };

            // Handle status change to Closed
            if (updateFields.status === 'Closed' && job.status !== 'Closed') {
                updateData.completed_date = updateFields.completed_date || new Date();
            }

            // Update job
            const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, { new: true, runValidators: true });
            const populatedJob = await this.populateJob(Job.findById(updatedJob._id));

            // Get changed fields
            const changedFields = Object.keys(updateFields).filter(key =>
                JSON.stringify(oldValues[key]) !== JSON.stringify(updateFields[key])
            );

            // Create notifications
            const notificationPromises = [
                this.createNotification({
                    targetRoles: ['manager', 'coordinator'],
                    message: `Job ${populatedJob.job_number} updated by ${userId.name}: ${changedFields.join(', ')} changed`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_updated',
                        updatedBy: userId,
                        changedFields
                    }
                })
            ];

            // Notification for assigned technician if changed
            if (assigned_to && String(assigned_to) !== String(job.assigned_to)) {
                notificationPromises.push(this.createNotification({
                    userId: assigned_to,
                    message: `You've been assigned to job: ${populatedJob.job_number}`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_assigned',
                        assignedBy: userId
                    }
                }));
            }

            await Promise.all(notificationPromises);

            // Emit socket events
            const eventData = { userId, job: populatedJob, metadata: { changedFields, oldValues } };

            this.emitSocketEvent('job-updated', eventData);

            if (assigned_to && String(assigned_to) !== String(job.assigned_to)) {
                this.emitSocketEvent('job-assigned', eventData, { type: 'user', userId: assigned_to });

                if (job.assigned_to) {
                    this.emitSocketEvent('job-unassigned', eventData, { type: 'user', userId: job.assigned_to });
                }
            }

            if (updateFields.status && updateFields.status !== job.status) {
                this.emitSocketEvent('job-status-changed', {
                    userId,
                    job: populatedJob,
                    metadata: { oldStatus: job.status, newStatus: updateFields.status }
                }, { type: 'role', roles: ['manager', 'coordinator'] });
            }

            return {
                success: true,
                data: populatedJob,
                message: 'Job updated successfully'
            };

        } catch (error) {
            throw error;
        } finally {
            cleanupTempFiles(tempFilePaths);
        }
    }

    static async deleteJob(jobId, userId) {
        try {
            const job = await this.populateJob(Job.findById(jobId));
            if (!job) throw new ApiError(404, 'Job not found');

            // Delete attachments
            if (job.attachments?.length > 0) {
                const publicIds = job.attachments.map(a => a.public_id);
                await cloudinaryService.deleteMultipleFiles(publicIds);
            }

            // Delete folder
            await cloudinaryService.deleteFolder(`Lenovo_CCS/Job_Attachments/${job._id}`);

            // Delete job
            await Job.findByIdAndDelete(jobId);

            // Create notification
            await this.createNotification({
                targetRoles: ['manager', 'coordinator'],
                message: `Job ${job.job_number} deleted by ${userId.name}`,
                job,
                metadata: {
                    action: 'job_deleted',
                    deletedBy: userId,
                    customer: job.customer?.name || 'Ad-hoc Customer'
                }
            });

            // Emit socket event
            const eventData = {
                userId,
                job: { _id: job._id, job_number: job.job_number, customer: job.customer?.name || 'Ad-hoc Customer' },
                metadata: {}
            };

            this.emitSocketEvent('job-deleted', eventData);

            if (job.assigned_to) {
                this.emitSocketEvent('job-deleted', eventData, { type: 'user', userId: job.assigned_to._id });
            }

            return {
                success: true,
                message: 'Job and attachments deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    static async assignJobToTechnician(jobId, assignmentData, userId) {
        try {
            const { assigned_to, status = 'Assigned', scheduled_date, is_reassignment = false, warranty_status } = assignmentData;

            if (!assigned_to) throw new ApiError(400, 'Technician ID is required');

            const existingJob = await Job.findById(jobId);
            if (!existingJob) throw new ApiError(404, 'Job not found');

            await this.validateTechnician(assigned_to);

            // Prepare update data
            const updateData = {
                assigned_to,
                status,
                scheduled_date: scheduled_date || existingJob.scheduled_date,
                warranty_status: warranty_status || existingJob.warranty_status,
                updated_at: new Date()
            };

            // Handle reassignment history
            if (is_reassignment && existingJob.assigned_to) {
                updateData.previous_assignments = [
                    ...(existingJob.previous_assignments || []),
                    {
                        technician: existingJob.assigned_to,
                        assigned_at: existingJob.updated_at,
                        unassigned_at: new Date()
                    }
                ];
            }

            // Update job
            const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, { new: true, runValidators: true });
            const populatedJob = await this.populateJob(Job.findById(updatedJob._id));

            // Create notifications
            const notificationPromises = [
                this.createNotification({
                    targetRoles: ['manager', 'coordinator'],
                    message: `Job ${populatedJob.job_number} ${is_reassignment ? 'reassigned' : 'assigned'} to ${populatedJob.assigned_to.name} by ${userId.name}`,
                    job: populatedJob,
                    metadata: {
                        action: is_reassignment ? 'job_reassigned' : 'job_assigned',
                        assignedBy: userId,
                        technicianId: assigned_to,
                        isReassignment: is_reassignment
                    }
                }),
                this.createNotification({
                    userId: assigned_to,
                    message: `You've been ${is_reassignment ? 'reassigned' : 'assigned'} to job: ${populatedJob.job_number}`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_assigned',
                        assignedBy: userId,
                        isReassignment: is_reassignment
                    }
                })
            ];

            // Notification for previous technician if reassignment
            if (is_reassignment && existingJob.assigned_to) {
                notificationPromises.push(this.createNotification({
                    userId: existingJob.assigned_to,
                    message: `You've been unassigned from job: ${populatedJob.job_number}`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_unassigned',
                        unassignedBy: userId
                    }
                }));
            }

            await Promise.all(notificationPromises);

            // Emit socket events
            const eventData = { userId, job: populatedJob, metadata: { isReassignment: is_reassignment, previousTechnician: existingJob.assigned_to?.name } };

            this.emitSocketEvent('job-assigned', eventData, { type: 'role', roles: ['manager', 'coordinator'] });
            this.emitSocketEvent('job-assigned', eventData, { type: 'user', userId: assigned_to });

            if (is_reassignment && existingJob.assigned_to) {
                this.emitSocketEvent('job-unassigned', eventData, { type: 'user', userId: existingJob.assigned_to });
            }

            return {
                success: true,
                data: populatedJob,
                message: is_reassignment ? 'Job reassigned successfully' : 'Job assigned successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateJobStatus(jobId, statusData, userId) {
        try {
            const { status, warranty_status } = statusData;
            const job = await Job.findById(jobId);
            if (!job) throw new ApiError(404, 'Job not found');

            const oldStatus = job.status;

            // Prepare update data
            const updateData = { status, updated_at: new Date() };
            if (warranty_status) updateData.warranty_status = warranty_status;

            // Set completed date if closing
            if (status === 'Closed' && job.status !== 'Closed') {
                updateData.completed_date = new Date();
            }

            // Update job
            const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, { new: true, runValidators: true });
            const populatedJob = await this.populateJob(Job.findById(updatedJob._id));

            // Create notifications
            const notificationPromises = [
                this.createNotification({
                    targetRoles: ['manager', 'coordinator'],
                    message: `Job ${populatedJob.job_number} status changed from ${oldStatus} to ${populatedJob.status} by ${userId.name}`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_status_changed',
                        changedBy: userId,
                        oldStatus,
                        newStatus: populatedJob.status
                    }
                })
            ];

            // Notification for assigned technician
            if (populatedJob.assigned_to) {
                notificationPromises.push(this.createNotification({
                    userId: populatedJob.assigned_to._id,
                    message: `Job ${populatedJob.job_number} status changed to ${populatedJob.status}`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_status_changed',
                        changedBy: userId,
                        oldStatus,
                        newStatus: populatedJob.status
                    }
                }));
            }

            // Special notifications for closed jobs
            if (populatedJob.status === 'Closed') {
                notificationPromises.push(this.createNotification({
                    targetRoles: ['manager'],
                    message: `Job ${populatedJob.job_number} has been closed by ${userId.name}`,
                    job: populatedJob,
                    metadata: {
                        action: 'job_closed',
                        closedBy: userId,
                        completedDate: populatedJob.completed_date
                    }
                }));

                if (populatedJob.warranty_status === 'In Warranty') {
                    notificationPromises.push(this.createNotification({
                        targetRoles: ['customer_service'],
                        message: `Warranty job ${populatedJob.job_number} has been closed`,
                        job: populatedJob,
                        metadata: {
                            action: 'warranty_job_closed',
                            completedDate: populatedJob.completed_date
                        }
                    }));
                }
            }

            await Promise.all(notificationPromises);

            // Emit socket events
            const eventData = { userId, job: populatedJob, metadata: { oldStatus, newStatus: populatedJob.status } };

            this.emitSocketEvent('job-status-changed', eventData, { type: 'role', roles: ['manager', 'coordinator'] });

            if (populatedJob.assigned_to) {
                this.emitSocketEvent('job-status-changed', eventData, { type: 'user', userId: populatedJob.assigned_to._id });
            }

            if (populatedJob.status === 'Closed') {
                this.emitSocketEvent('job-closed', eventData, { type: 'role', roles: ['manager'] });

                if (populatedJob.warranty_status === 'In Warranty') {
                    this.emitSocketEvent('warranty-job-closed', eventData, { type: 'role', roles: ['customer_service'] });
                }
            }

            return {
                success: true,
                data: populatedJob,
                message: 'Job status updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    static async getAllJobs(filters) {
        try {
            const { job_number, serial_number, status, priority, job_type, assigned_to, created_at, warranty_status, page = 1, limit = 10, all = false } = filters;

            // Build filter object
            const filter = {};

            if (job_number) filter.job_number = { $regex: job_number, $options: 'i' };
            if (serial_number) filter.serial_number = { $regex: serial_number, $options: 'i' };
            if (status) filter.status = status;
            if (priority) filter.priority = priority;
            if (job_type) filter.job_type = job_type;
            if (warranty_status) filter.warranty_status = warranty_status;

            // Handle assigned_to filter
            if (assigned_to) {
                if (mongoose.Types.ObjectId.isValid(assigned_to)) {
                    filter.assigned_to = assigned_to;
                } else {
                    const technicians = await User.find({
                        name: { $regex: assigned_to, $options: 'i' },
                        role: 'technician'
                    }).select('_id');
                    filter.assigned_to = { $in: technicians.map(t => t._id) };
                }
            }

            // Handle date filtering
            if (created_at) {
                const startDate = new Date(created_at);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(created_at);
                endDate.setHours(23, 59, 59, 999);
                filter.created_at = { $gte: startDate, $lte: endDate };
            }

            // Get total count
            const totalCount = await Job.countDocuments(filter);

            // Handle "all" flag
            if (all === 'true') {
                const allJobs = await this.populateJob(Job.find(filter)).sort({ created_at: -1 }).lean();
                return {
                    success: true,
                    data: allJobs,
                    totalCount,
                    message: 'All jobs returned without pagination'
                };
            }

            // Apply pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.max(1, parseInt(limit));

            const jobs = await this.populateJob(Job.find(filter))
                .sort({ created_at: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean();

            return {
                success: true,
                data: jobs,
                totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCount / limitNum)
            };
        } catch (error) {
            throw error;
        }
    }

    static async getJobsByCustomer(customerId) {
        try {
            const filter = { customer: mongoose.Types.ObjectId(customerId) };
            const jobs = await this.populateJob(Job.find(filter)).sort({ created_at: -1 });

            return {
                success: true,
                data: jobs,
                message: 'Jobs retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    static async getJobsByTechnician(technicianId, page = 1, limit = 10) {
        try {
            if (!technicianId) throw new ApiError(400, 'Technician ID is required');

            // Verify the technician exists
            const technician = await User.findById(technicianId);
            if (!technician) throw new ApiError(404, 'Technician not found');

            const filter = { assigned_to: technicianId };
            const totalCount = await Job.countDocuments(filter);

            const jobs = await this.populateJob(Job.find(filter))
                .sort({ scheduled_date: 1 })
                .skip((page - 1) * limit)
                .limit(limit);

            return {
                success: true,
                data: { jobs, totalCount, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(totalCount / limit) },
                message: 'Technician jobs retrieved successfully'
            };
        } catch (error) {
            console.error('Error in getJobsByTechnician:', error);
            throw error;
        }
    }

    static async getJob(jobId) {
        try {
            const job = await this.populateJob(Job.findById(jobId));
            if (!job) throw new ApiError(404, 'Job not found');

            return {
                success: true,
                data: job,
                message: 'Job retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = JobService;