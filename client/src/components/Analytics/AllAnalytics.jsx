import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import CustomerAnalytics from './CustomerAnalytics';
import DeviceAnalytics from './DeviceAnalytics';
import JobAnalytics from './JobAnalytics';
import PartsAnalytics from './PartsAnalytics';
import TechnicianPerformance from './TechnicianPerformance';
import ActivityAnalytics from './ActivityAnalytics';

const AnalyticsDashboard = () => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState({
        jobs: {
            statusDistribution: [],
            jobsOverTime: [],
            priorityDistribution: []
        },
        customers: {
            customerTypeDistribution: [],
            customersOverTime: []
        },
        devices: {
            deviceTypeDistribution: [],
            warrantyStatus: [],
            topManufacturers: []
        },
        technicians: [],
        parts: {
            statusDistribution: [],
            partsOverTime: [],
            urgencyDistribution: []
        },
        activity: {
            activityTypes: [],
            activityOverTime: [],
            userActivity: []
        }
    });

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                setError(null);

                const endpoints = [
                    'job-analytics',
                    'customer-analytics',
                    'device-analytics',
                    'technician-performance',
                    'parts-analytics',
                    'activity-analytics'
                ];

                const requests = endpoints.map(endpoint =>
                    axios.get(`http://localhost:5000/analytics/${endpoint}`, {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    })
                );

                const responses = await Promise.all(requests);

                setAnalyticsData({
                    jobs: {
                        statusDistribution: responses[0].data?.statusDistribution || [],
                        jobsOverTime: (responses[0].data?.jobsOverTime || []).map(item => ({
                            ...item,
                            date: item.date || 'All Time'
                        })),
                        priorityDistribution: responses[0].data?.priorityDistribution || []
                    },
                    customers: {
                        customerTypeDistribution: responses[1].data?.customerTypeDistribution || [],
                        customersOverTime: responses[1].data?.customersOverTime || []
                    },
                    devices: {
                        deviceTypeDistribution: responses[2].data?.deviceTypeDistribution || [],
                        warrantyStatus: responses[2].data?.warrantyStatus || [],
                        topManufacturers: responses[2].data?.topManufacturers || []
                    },
                    technicians: responses[3].data || [],
                    parts: {
                        statusDistribution: responses[4].data?.statusDistribution || [],
                        partsOverTime: responses[4].data?.partsOverTime || [],
                        urgencyDistribution: responses[4].data?.urgencyDistribution || []
                    },
                    activity: {
                        activityTypes: responses[5].data?.activityTypes || [],
                        activityOverTime: responses[5].data?.activityOverTime || [],
                        userActivity: responses[5].data?.userActivity || []
                    }
                });

            } catch (err) {
                console.error('Error fetching analytics data:', err);
                setError(err.response?.data?.message || 'Failed to fetch analytics data');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchAnalyticsData();
        }
    }, [currentUser?.token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className={`${isDark ? 'bg-red-900 border-red-700 text-red-100' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 w-full max-w-2xl`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-5 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen overflow-y-auto`}>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

                <JobAnalytics data={analyticsData.jobs} />
                <CustomerAnalytics data={analyticsData.customers} />
                <DeviceAnalytics data={analyticsData.devices} />
                <TechnicianPerformance data={analyticsData.technicians} />
                <PartsAnalytics data={analyticsData.parts} />
                <ActivityAnalytics data={analyticsData.activity} />
            </div>
        </div>
    );
};

export default AnalyticsDashboard;