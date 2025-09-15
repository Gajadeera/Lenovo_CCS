// Updated ManagerOverview component with consistent dark mode text colors
import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiUsers, FiPackage, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import toast from 'react-hot-toast';
import StatCard from '../../components/Common/StatCard';
import { PieChartComponent, BarChartComponent } from '../../components/Common/ChartComponents';
import BaseAnalytics, { LoadingSpinner } from '../../components/Common/BaseAnalytics';

const ManagerOverview = ({ connectionStatus, onlineUsers, onlineUsersList }) => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();

    // State for all modals
    const [modalStates, setModalStates] = useState({
        createJob: false,
        assignJob: false,
    });

    const [stats, setStats] = useState({
        activeJobs: 0,
        pendingParts: 0,
        newJobs: 0,
        availableTechnicians: 0,
        totalCustomers: 0,
        loading: true
    });

    const [analytics, setAnalytics] = useState({
        jobTrends: [],
        jobStatusDistribution: [],
        partsStatusDistribution: [],
        loading: true
    });

    // Modal handlers
    const openModal = (modalName) => {
        setModalStates(prev => ({ ...prev, [modalName]: true }));
    };

    const closeModal = (modalName) => {
        setModalStates(prev => ({ ...prev, [modalName]: false }));
    };

    const handleCreateJob = () => openModal('createJob');
    const handleAssignJob = () => openModal('assignJob');

    // Improved date normalization function
    const normalizeDate = (date) => {
        if (!date) return new Date(NaN);
        const d = new Date(date);
        if (isNaN(d.getTime())) return new Date(NaN);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const fetchStats = async () => {
        try {
            const [jobsRes, partsRes, techniciansRes, customersRes] = await Promise.all([
                axios.get('http://localhost:5000/jobs?all=true', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                }),
                axios.get('http://localhost:5000/parts-requests?all=true', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` },
                    params: { status: 'Pending' }
                }),
                axios.get('http://localhost:5000/users', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` },
                    params: { role: 'technician', available: true }
                }),
                axios.get('http://localhost:5000/customers', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                })
            ]);

            // Get today's date normalized
            const today = normalizeDate(new Date());

            // Calculate new jobs created today
            const newJobs = jobsRes.data?.data?.filter(job => {
                if (!job.createdAt) return false;
                const jobDate = normalizeDate(job.createdAt);
                return jobDate.getTime() === today.getTime();
            }).length || 0;

            setStats({
                activeJobs: jobsRes.data?.data?.filter(job => job.status?.toLowerCase() !== 'closed').length || 0,
                pendingParts: partsRes.data.data?.length || 0,
                newJobs,
                availableTechnicians: techniciansRes.data?.users?.length || 0,
                totalCustomers: customersRes.data?.total || 0,
                loading: false
            });

        } catch (err) {
            console.error('Stats fetch error:', err);
            toast.error('Failed to load stats');
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchAnalytics = async () => {
        try {
            const [jobsRes, partsRes] = await Promise.all([
                axios.get('http://localhost:5000/jobs?all=true', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                }),
                axios.get('http://localhost:5000/parts-requests?all=true', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                })
            ]);

            const jobs = jobsRes.data?.data || [];
            const partsRequests = partsRes.data?.data || [];

            // Process job trends data (last 7 days)
            const today = normalizeDate(new Date());
            const jobTrends = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - (6 - i));

                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);

                const count = jobs.filter(job => {
                    if (!job.createdAt) return false;
                    const jobDate = new Date(job.createdAt);
                    return jobDate >= date && jobDate < nextDay;
                }).length;

                return {
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count
                };
            });

            // Process job status distribution
            const statusCounts = {};
            jobs.forEach(job => {
                if (job.status) {
                    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
                }
            });
            const jobStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
                name,
                value
            }));

            // Process parts status distribution
            const partsStatusCounts = {};
            partsRequests.forEach(request => {
                if (request.status) {
                    partsStatusCounts[request.status] = (partsStatusCounts[request.status] || 0) + 1;
                }
            });
            const partsStatusDistribution = Object.entries(partsStatusCounts).map(([name, value]) => ({
                name,
                value
            }));

            setAnalytics({
                jobTrends,
                jobStatusDistribution,
                partsStatusDistribution,
                loading: false
            });

        } catch (err) {
            console.error('Analytics fetch error:', err);
            toast.error('Failed to load analytics');
            setAnalytics(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        if (!currentUser?.token) return;
        fetchStats();
        const statsInterval = setInterval(fetchStats, 30000);
        return () => clearInterval(statsInterval);
    }, [currentUser?.token]);

    useEffect(() => {
        if (!currentUser?.token) return;
        fetchAnalytics();
        const analyticsInterval = setInterval(fetchAnalytics, 300000);
        return () => clearInterval(analyticsInterval);
    }, [currentUser?.token]);

    if (stats.loading || analytics.loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={`p-4 space-y-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>
                    Manager Dashboard
                </h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={FiBriefcase}
                    title="Active Jobs"
                    value={stats.activeJobs}
                    trend={stats.activeJobs > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiUsers}
                    title="Online Users"
                    value={onlineUsers}
                    trend={onlineUsers > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiClock}
                    title="Today's Jobs"
                    value={stats.newJobs}
                    trend={stats.newJobs > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiPackage}
                    title="Pending Parts"
                    value={stats.pendingParts}
                    trend={stats.pendingParts > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
            </div>

            {/* Analytics Charts */}
            <BaseAnalytics
                title="Analytics Overview"
                data={analytics}
                chartGrid="grid-cols-1 md:grid-cols-3"
                isDark={isDark}
            >
                <BarChartComponent
                    data={analytics.jobTrends}
                    dataKey="count"
                    nameKey="date"
                    title="Jobs Per Day (Last 7 Days)"
                    barProps={{ fill: isDark ? "#65C2CB" : "#1E4065", radius: [4, 4, 0, 0] }}
                    tooltipFormatter={(value) => [`${value} jobs`]}
                    isDark={isDark}
                />

                <PieChartComponent
                    data={analytics.jobStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    title="Job Status Distribution"
                    tooltipFormatter={(value, name) => [`${value} jobs`, name]}
                    isDark={isDark}
                />

                <PieChartComponent
                    data={analytics.partsStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    title="Parts Status Distribution"
                    tooltipFormatter={(value, name) => [`${value} parts`, name]}
                    isDark={isDark}
                />
            </BaseAnalytics>
        </div>
    );
};

export default ManagerOverview;