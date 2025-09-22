import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const JobSocketContext = createContext();

export const JobSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const { user } = useAuth();
    const [jobNotifications, setJobNotifications] = useState([]);

    useEffect(() => {
        if (!socket || !user) {
            console.log('No socket or user, skipping job socket setup');
            return;
        }

        console.log('Setting up job socket listeners for user:', user._id);

        // General job notifications
        const handleJobCreated = (data) => {
            console.log('Job created event:', data);
            const notification = {
                id: `job-created-${data.job._id}-${Date.now()}`,
                type: 'job-created',
                message: `New job created: ${data.job.job_number}`,
                jobId: data.job._id,
                priority: data.job.priority,
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast.success(`🆕 ${notification.message}`, {
                icon: data.job.priority === 'High' ? '🚨' : '📌'
            });
        };

        const handleJobUpdated = (data) => {
            console.log('Job updated event:', data);
            const notification = {
                id: `job-updated-${data.job._id}-${Date.now()}`,
                type: 'job-updated',
                message: `Job updated: ${data.job.job_number}`,
                jobId: data.job._id,
                changes: data.metadata?.updatedFields || [],
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast(`📝 ${notification.message}`);
        };

        const handleJobDeleted = (data) => {
            console.log('Job deleted event:', data);
            const jobNumber = data.job.job_number || data.job.jobNumber;
            const notification = {
                id: `job-deleted-${data.job._id}-${Date.now()}`,
                type: 'job-deleted',
                message: `Job deleted: ${jobNumber}`,
                jobId: data.job._id,
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast.error(`🗑️ ${notification.message}`);
        };

        const handleJobStatusChanged = (data) => {
            console.log('Job status changed event:', data);
            const notification = {
                id: `job-status-${data.job._id}-${Date.now()}`,
                type: 'job-status-changed',
                message: `Job ${data.job.job_number} status changed from ${data.metadata?.oldStatus} to ${data.metadata?.newStatus}`,
                jobId: data.job._id,
                oldStatus: data.metadata?.oldStatus,
                newStatus: data.metadata?.newStatus,
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast(`🔄 ${notification.message}`);
        };

        const handleJobClosed = (data) => {
            console.log('Job closed event:', data);
            const notification = {
                id: `job-closed-${data.job._id}-${Date.now()}`,
                type: 'job-closed',
                message: `Job completed: ${data.job.job_number}`,
                jobId: data.job._id,
                duration: data.metadata?.duration,
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast.success(`🏁 ${notification.message}`);
        };

        const handleJobAssigned = (data) => {
            console.log('Job assigned event:', data);
            const isAssignedToMe = data.job.assigned_to?._id === user._id;
            const notification = {
                id: `job-assigned-${data.job._id}-${Date.now()}`,
                type: 'job-assigned',
                message: isAssignedToMe
                    ? `You've been assigned to job: ${data.job.job_number}`
                    : `Job ${data.job.job_number} assigned to ${data.job.assigned_to?.name || 'technician'}`,
                jobId: data.job._id,
                isAssignedToMe,
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast.success(`👤 ${notification.message}`);
        };

        const handleJobUnassigned = (data) => {
            console.log('Job unassigned event:', data);
            const wasAssignedToMe = data.metadata?.previousAssignee === user._id;

            if (wasAssignedToMe) {
                const notification = {
                    id: `job-unassigned-${data.job._id}-${Date.now()}`,
                    type: 'job-unassigned',
                    message: `You've been unassigned from job: ${data.job.job_number}`,
                    jobId: data.job._id,
                    timestamp: new Date()
                };
                setJobNotifications(prev => [notification, ...prev]);
                toast(`❌ ${notification.message}`);
            }
        };

        const handleHighPriorityJob = (data) => {
            console.log('High priority job event:', data);
            if (user.role === 'manager' || user.role === 'coordinator') {
                const notification = {
                    id: `high-priority-job-${data.job._id}-${Date.now()}`,
                    type: 'high-priority-job',
                    message: `High priority job created: ${data.job.job_number}`,
                    jobId: data.job._id,
                    priority: 'High',
                    timestamp: new Date()
                };
                setJobNotifications(prev => [notification, ...prev]);
                toast.success(`🚨 ${notification.message}`);
            }
        };

        const handleWarrantyJobClosed = (data) => {
            console.log('Warranty job closed event:', data);
            if (user.role === 'customer_service') {
                const notification = {
                    id: `warranty-job-closed-${data.job._id}-${Date.now()}`,
                    type: 'warranty-job-closed',
                    message: `Warranty job completed: ${data.job.job_number}`,
                    jobId: data.job._id,
                    timestamp: new Date()
                };
                setJobNotifications(prev => [notification, ...prev]);
                toast.success(`✅ ${notification.message}`);
            }
        };

        const handleJobStatusChangedByOther = (data) => {
            console.log('Job status changed by other event:', data);
            const notification = {
                id: `job-status-changed-by-other-${data.job._id}-${Date.now()}`,
                type: 'job-status-changed-by-other',
                message: `Job ${data.job.job_number} status changed by ${data.initiatedBy.name}`,
                jobId: data.job._id,
                changedBy: data.initiatedBy.name,
                oldStatus: data.metadata?.oldStatus,
                newStatus: data.metadata?.newStatus,
                timestamp: new Date()
            };
            setJobNotifications(prev => [notification, ...prev]);
            toast(`👤 ${notification.message}`);
        };

        const unsubscribers = [
            subscribe('job-created', handleJobCreated),
            subscribe('job-updated', handleJobUpdated),
            subscribe('job-deleted', handleJobDeleted),
            subscribe('job-status-changed', handleJobStatusChanged),
            subscribe('job-closed', handleJobClosed),
            subscribe('job-assigned', handleJobAssigned),
            subscribe('job-unassigned', handleJobUnassigned),
            subscribe('high-priority-job', handleHighPriorityJob),
            subscribe('warranty-job-closed', handleWarrantyJobClosed),
            subscribe('job-status-changed-by-other', handleJobStatusChangedByOther)
        ];

        console.log('Job socket listeners setup complete');

        return () => {
            console.log('Cleaning up job socket listeners');
            unsubscribers.forEach(unsub => unsub());
        };
    }, [socket, subscribe, user]);

    const clearJobNotification = (id) => {
        setJobNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllJobNotifications = () => {
        setJobNotifications([]);
    };

    return (
        <JobSocketContext.Provider value={{
            jobNotifications,
            clearJobNotification,
            clearAllJobNotifications
        }}>
            {children}
        </JobSocketContext.Provider>
    );
};

export const useJobSocket = () => useContext(JobSocketContext);