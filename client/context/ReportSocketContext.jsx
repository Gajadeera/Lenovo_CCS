// contexts/ReportSocketContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';

const ReportSocketContext = createContext();

export const ReportSocketProvider = ({ children }) => {
    const { socket, subscribe } = useSocket();
    const [reportNotifications, setReportNotifications] = useState([]);
    const [reportStats, setReportStats] = useState(null);
    const [reportTrends, setReportTrends] = useState([]);
    const [popularReports, setPopularReports] = useState([]);
    const [reportCompletion, setReportCompletion] = useState([]);

    // Helper function to create report notifications
    const createReportNotification = (data, type, emoji, toastMethod = toast) => {
        const baseNotification = {
            id: `report-${data.report?._id || data.reportId}-${Date.now()}`,
            type: `report-${type}`,
            timestamp: new Date()
        };

        let notification;

        switch (type) {
            case 'generated':
                notification = {
                    ...baseNotification,
                    message: `${emoji} New report generated: ${data.report.name}`,
                    reportId: data.report._id,
                    type: data.report.type
                };
                break;
            case 'scheduled':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Report scheduled: ${data.name}`,
                    reportId: data.reportId,
                    schedule: data.schedule
                };
                break;
            case 'failed':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Report generation failed: ${data.name}`,
                    reportId: data.reportId,
                    error: data.error
                };
                break;
            case 'completed':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Report completed: ${data.name}`,
                    reportId: data.reportId,
                    duration: data.duration
                };
                break;
            case 'downloaded':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Report downloaded: ${data.name}`,
                    reportId: data.reportId,
                    downloadedBy: data.userName
                };
                break;
            case 'shared':
                notification = {
                    ...baseNotification,
                    message: `${emoji} Report shared with ${data.recipientCount} recipients`,
                    reportId: data.reportId,
                    recipients: data.recipients
                };
                break;
            default:
                return null;
        }

        if (notification) {
            setReportNotifications(prev => [notification, ...prev]);
            if (toastMethod) toastMethod(notification.message);
        }

        return notification;
    };

    // Report lifecycle events
    useEffect(() => {
        if (!socket) return;

        // Report generated
        const handleReportGenerated = (data) => {
            createReportNotification(data, 'generated', '📊', toast.success);
        };

        // Report scheduled
        const handleReportScheduled = (data) => {
            createReportNotification(data, 'scheduled', '⏰');
        };

        // Report failed
        const handleReportFailed = (data) => {
            createReportNotification(data, 'failed', '❌', toast.error);
        };

        // Report completed
        const handleReportCompleted = (data) => {
            createReportNotification(data, 'completed', '✅');
        };

        // Report downloaded
        const handleReportDownloaded = (data) => {
            createReportNotification(data, 'downloaded', '📥');
        };

        // Report shared
        const handleReportShared = (data) => {
            createReportNotification(data, 'shared', '📤');
        };

        // Stats updates
        const handleStatsUpdated = (data) => {
            setReportStats(data);
        };

        // Trends updates
        const handleTrendsUpdated = (data) => {
            setReportTrends(data);
        };

        // Popular reports updates
        const handlePopularReportsUpdated = (data) => {
            setPopularReports(data);
        };

        // Completion metrics updates
        const handleCompletionUpdated = (data) => {
            setReportCompletion(data);
        };

        // Subscribe to all report-related events
        const unsubGenerated = subscribe('report-generated', handleReportGenerated);
        const unsubScheduled = subscribe('report-scheduled', handleReportScheduled);
        const unsubFailed = subscribe('report-failed', handleReportFailed);
        const unsubCompleted = subscribe('report-completed', handleReportCompleted);
        const unsubDownloaded = subscribe('report-downloaded', handleReportDownloaded);
        const unsubShared = subscribe('report-shared', handleReportShared);
        const unsubStatsUpdated = subscribe('report-stats-updated', handleStatsUpdated);
        const unsubTrendsUpdated = subscribe('report-trends-updated', handleTrendsUpdated);
        const unsubPopularReports = subscribe('popular-reports-updated', handlePopularReportsUpdated);
        const unsubCompletionUpdated = subscribe('report-completion-updated', handleCompletionUpdated);

        return () => {
            unsubGenerated();
            unsubScheduled();
            unsubFailed();
            unsubCompleted();
            unsubDownloaded();
            unsubShared();
            unsubStatsUpdated();
            unsubTrendsUpdated();
            unsubPopularReports();
            unsubCompletionUpdated();
        };
    }, [socket, subscribe]);

    const clearReportNotification = (id) => {
        setReportNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllReportNotifications = () => {
        setReportNotifications([]);
    };

    return (
        <ReportSocketContext.Provider value={{
            reportNotifications,
            reportStats,
            reportTrends,
            popularReports,
            reportCompletion,
            clearReportNotification,
            clearAllReportNotifications
        }}>
            {children}
        </ReportSocketContext.Provider>
    );
};

export const useReportSocket = () => useContext(ReportSocketContext);