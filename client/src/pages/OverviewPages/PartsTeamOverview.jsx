import React, { useState, useEffect } from 'react';
import { FiPackage, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import toast from 'react-hot-toast';
import StatCard from '../../components/Common/StatCard';
import BaseAnalytics, { LoadingSpinner } from '../../components/Common/BaseAnalytics';
import { BarChartComponent, PieChartComponent } from '../../components/Common/ChartComponents';

const PartsTeamOverview = ({ notifications, onClearNotification }) => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();

    const [stats, setStats] = useState({
        pendingRequests: 0,
        approvedRequests: 0,
        fulfilledRequests: 0,
        rejectedRequests: 0,
        newRequests: 0,
        loading: true
    });

    const [analytics, setAnalytics] = useState({
        requestTrends: [],
        requestStatusDistribution: [],
        loading: true
    });

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
            const res = await axios.get('http://localhost:5000/parts-requests', {
                headers: { Authorization: `Bearer ${currentUser?.token}` },
                params: { all: true }
            });

            const requests = res.data?.data || [];

            // Get today's date normalized
            const today = normalizeDate(new Date());

            // Calculate new requests created today
            const newRequests = requests.filter(request => {
                if (!request.requested_at) return false;
                const requestDate = normalizeDate(request.requested_at);
                return requestDate.getTime() === today.getTime();
            }).length;

            setStats({
                pendingRequests: requests.filter(r => r.status === 'Pending').length,
                approvedRequests: requests.filter(r => r.status === 'Approved').length,
                fulfilledRequests: requests.filter(r => r.status === 'Fulfilled').length,
                rejectedRequests: requests.filter(r => r.status === 'Rejected').length,
                newRequests,
                loading: false
            });

        } catch (err) {
            console.error('Stats fetch error:', err);
            toast.error('Failed to load parts request stats');
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get('http://localhost:5000/parts-requests', {
                headers: { Authorization: `Bearer ${currentUser?.token}` },
                params: { all: true }
            });

            const requests = res.data?.data || [];

            // Process request trends data (last 7 days)
            const today = normalizeDate(new Date());
            const requestTrends = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - (6 - i));

                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);

                const count = requests.filter(request => {
                    if (!request.requested_at) return false;
                    const requestDate = new Date(request.requested_at);
                    return requestDate >= date && requestDate < nextDay;
                }).length;

                return {
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count
                };
            });

            // Process request status distribution
            const statusCounts = {};
            requests.forEach(request => {
                if (request.status) {
                    statusCounts[request.status] = (statusCounts[request.status] || 0) + 1;
                }
            });
            const requestStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
                name,
                value
            }));

            setAnalytics({
                requestTrends,
                requestStatusDistribution,
                loading: false
            });

        } catch (err) {
            console.error('Analytics fetch error:', err);
            toast.error('Failed to load parts analytics');
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
                    Parts Team Dashboard
                </h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={FiClock}
                    title="Pending"
                    value={stats.pendingRequests}
                    trend={stats.pendingRequests > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiCheckCircle}
                    title="Approved"
                    value={stats.approvedRequests}
                    trend={stats.approvedRequests > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiPackage}
                    title="Fulfilled"
                    value={stats.fulfilledRequests}
                    trend={stats.fulfilledRequests > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiAlertTriangle}
                    title="Today's Requests"
                    value={stats.newRequests}
                    trend={stats.newRequests > 0 ? "up" : "neutral"}
                    compact
                    isDark={isDark}
                />
            </div>

            {/* Charts */}
            <BaseAnalytics
                title="Parts Request Analytics"
                data={analytics}
                chartGrid="grid-cols-1 md:grid-cols-2"
                isDark={isDark}
            >
                <BarChartComponent
                    data={analytics.requestTrends}
                    dataKey="count"
                    nameKey="date"
                    title="Requests Per Day (Last 7 Days)"
                    barProps={{ fill: isDark ? "#65C2CB" : "#1E4065", radius: [4, 4, 0, 0] }}
                    tooltipFormatter={(value) => [`${value} requests`]}
                    isDark={isDark}
                />

                <PieChartComponent
                    data={analytics.requestStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    title="Request Status Distribution"
                    tooltipFormatter={(value, name) => [`${value} requests`, name]}
                    isDark={isDark}
                />
            </BaseAnalytics>
        </div>
    );
};

export default PartsTeamOverview;