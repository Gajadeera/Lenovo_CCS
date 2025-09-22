import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';

const IssueSocketContext = createContext();

export const IssueSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const [issueNotifications, setIssueNotifications] = useState([]);
    const [issueStats, setIssueStats] = useState(null);
    const [issueTrends, setIssueTrends] = useState([]);
    const [recentIssues, setRecentIssues] = useState([]);
    const [priorityDistribution, setPriorityDistribution] = useState([]);
    const createIssueNotification = (data, type, emoji, toastMethod = toast) => {
        const baseNotification = {
            id: `issue-${data.issue?._id || data.issueId}-${Date.now()}`,
            type: `issue-${type}`,
            timestamp: new Date()
        };

        let notification;

        switch (type) {
            case 'created':
                notification = {
                    ...baseNotification,
                    message: `${emoji} New issue reported: ${data.issue.title}`,
                    issueId: data.issue._id,
                    priority: data.issue.priority
                };
                break;
            case 'updated':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Issue updated: ${data.title}`,
                    issueId: data.issueId,
                    changes: data.changes
                };
                break;
            case 'status-changed':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Issue status changed to ${data.newStatus}: ${data.title}`,
                    issueId: data.issueId,
                    oldStatus: data.oldStatus,
                    newStatus: data.newStatus
                };
                break;
            case 'assigned':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Issue assigned to ${data.assigneeName}: ${data.title}`,
                    issueId: data.issueId,
                    assigneeId: data.assigneeId
                };
                break;
            case 'comment':
                notification = {
                    ...baseNotification,
                    message: `${emoji} New comment on issue: ${data.issueTitle}`,
                    issueId: data.issueId,
                    commentId: data.commentId
                };
                break;
            case 'resolved':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Issue resolved: ${data.title}`,
                    issueId: data.issueId,
                    resolvedBy: data.resolvedBy
                };
                break;
            default:
                return null;
        }

        if (notification) {
            setIssueNotifications(prev => [notification, ...prev]);
            if (toastMethod) toastMethod(notification.message);
        }

        return notification;
    };

    useEffect(() => {
        if (!socket) return;

        const handleIssueCreated = (data) => {
            createIssueNotification(data, 'created', '⚠️', toast.error);
        };

        const handleIssueUpdated = (data) => {
            createIssueNotification(data, 'updated', '✏️');
        };

        const handleStatusChanged = (data) => {
            createIssueNotification(data, 'status-changed', '🔄');
        };

        const handleIssueAssigned = (data) => {
            createIssueNotification(data, 'assigned', '👤', toast.success);
        };

        const handleCommentAdded = (data) => {
            createIssueNotification(data, 'comment', '💬');
        };

        const handleIssueResolved = (data) => {
            createIssueNotification(data, 'resolved', '✅', toast.success);
        };

        const handleStatsUpdated = (data) => {
            setIssueStats(data);
        };

        const handleTrendsUpdated = (data) => {
            setIssueTrends(data);
        };

        const handleRecentIssuesUpdated = (data) => {
            setRecentIssues(data);
        };

        const handlePriorityDistributionUpdated = (data) => {
            setPriorityDistribution(data);
        };

        const unsubCreated = subscribe('issue-created', handleIssueCreated);
        const unsubUpdated = subscribe('issue-updated', handleIssueUpdated);
        const unsubStatusChanged = subscribe('issue-status-changed', handleStatusChanged);
        const unsubAssigned = subscribe('issue-assigned', handleIssueAssigned);
        const unsubComment = subscribe('issue-comment-added', handleCommentAdded);
        const unsubResolved = subscribe('issue-resolved', handleIssueResolved);
        const unsubStatsUpdated = subscribe('issue-stats-updated', handleStatsUpdated);
        const unsubTrendsUpdated = subscribe('issue-trends-updated', handleTrendsUpdated);
        const unsubRecentIssues = subscribe('recent-issues-updated', handleRecentIssuesUpdated);
        const unsubPriorityDistribution = subscribe('priority-distribution-updated', handlePriorityDistributionUpdated);

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubStatusChanged();
            unsubAssigned();
            unsubComment();
            unsubResolved();
            unsubStatsUpdated();
            unsubTrendsUpdated();
            unsubRecentIssues();
            unsubPriorityDistribution();
        };
    }, [socket, subscribe]);

    const clearIssueNotification = (id) => {
        setIssueNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllIssueNotifications = () => {
        setIssueNotifications([]);
    };

    return (
        <IssueSocketContext.Provider value={{
            issueNotifications,
            issueStats,
            issueTrends,
            recentIssues,
            priorityDistribution,
            clearIssueNotification,
            clearAllIssueNotifications
        }}>
            {children}
        </IssueSocketContext.Provider>
    );
};

export const useIssueSocket = () => useContext(IssueSocketContext);