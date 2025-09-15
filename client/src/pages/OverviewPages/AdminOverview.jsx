import React, { useState, useEffect } from 'react';
import { FiUsers, FiAlertCircle, FiTool, FiClock, FiList } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import toast from 'react-hot-toast';
import StatCard from '../../components/Common/StatCard';
import BaseAnalytics, { LoadingSpinner } from '../../components/Common/BaseAnalytics';
import { BarChartComponent, LineChartComponent } from '../../components/Common/ChartComponents';

const AdminOverview = ({ onlineUsers, connectionStatus }) => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();

    const [stats, setStats] = useState({
        totalUsers: 0,
        issuesCount: 0,
        openIssues: 0,
        newUsers: 0,
        loading: true
    });

    const [analytics, setAnalytics] = useState({
        recentActivity: [],
        activitySummary: [],
        users: [],
        loading: true
    });

    // Fetch stats and analytics
    const fetchData = async () => {
        try {
            const [countsRes, logsRes, summaryRes, usersRes, issuesRes, issuesStatsRes] = await Promise.all([
                axios.get('http://localhost:5000/users/counts', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                }),
                axios.get('http://localhost:5000/users/activity-logs', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` },
                    params: { limit: 5 }
                }),
                axios.get('http://localhost:5000/users/activity-summary', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                }),
                axios.get('http://localhost:5000/users', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` },
                    params: { all: 'true' }
                }),
                axios.get('http://localhost:5000/system-issues/', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                }),
                axios.get('http://localhost:5000/system-issues/stats', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                })
            ]);

            // Get open issues count from stats
            const openIssuesCount = issuesStatsRes.data.data?.byStatus?.find(s => s._id === 'Open')?.count || 0;

            setStats({
                totalUsers: countsRes.data.total || 0,
                issuesCount: issuesStatsRes.data.data?.total || 0,
                openIssues: openIssuesCount,
                newUsers: countsRes.data.newLast24Hours || 0,
                loading: false
            });

            setAnalytics({
                recentActivity: logsRes.data.docs || logsRes.data,
                activitySummary: summaryRes.data,
                users: usersRes.data.users || usersRes.data,
                issues: issuesRes.data.data || issuesRes.data,
                loading: false
            });

        } catch (err) {
            console.error('Data fetch error:', err);
            toast.error('Failed to load dashboard data');
        }
    };

    // Data polling
    useEffect(() => {
        if (!currentUser?.token) return;
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [currentUser?.token]);

    // Prepare activity summary chart data
    const prepareActivityData = () => {
        return analytics.activitySummary.map(user => ({
            name: user.user_name,
            actions: user.total_actions,
            ...user.actions.reduce((acc, action) => {
                acc[`${action.entity_type}_${action.action}`] = action.count;
                return acc;
            }, {})
        }));
    };

    // Prepare last login chart data from users data
    const prepareLoginData = () => {
        const sortedUsers = [...analytics.users]
            .filter(user => user.last_login)
            .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
            .slice(0, 7);

        return sortedUsers.map(user => {
            const daysSinceLogin = user.last_login
                ? Math.floor((new Date() - new Date(user.last_login)) / (1000 * 60 * 60 * 24))
                : null;

            return {
                name: user.name || user.email.split('@')[0],
                lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
                daysSinceLogin: daysSinceLogin !== null ? daysSinceLogin.toFixed(1) : null
            };
        });
    };

    if (stats.loading || analytics.loading) {
        return <LoadingSpinner />;
    }

    const activityData = prepareActivityData();
    const loginData = prepareLoginData();

    return (
        <div className={`p-4 space-y-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>
                    Admin Dashboard
                </h2>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={FiUsers}
                    title="Total Users"
                    value={stats.totalUsers}
                    trend="neutral"
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiAlertCircle}
                    title="System Issues"
                    value={stats.issuesCount}
                    trend={stats.issuesCount > 0 ? 'up' : 'neutral'}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiTool}
                    title="Open Issues"
                    value={stats.openIssues}
                    trend={stats.openIssues > 0 ? 'up' : 'neutral'}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiClock}
                    title="New Users (24h)"
                    value={stats.newUsers}
                    trend={stats.newUsers > 0 ? 'up' : 'neutral'}
                    compact
                    isDark={isDark}
                />
            </div>

            {/* Activity Charts */}
            <BaseAnalytics
                title="User Analytics"
                data={analytics}
                chartGrid="grid-cols-1 md:grid-cols-2"
                isDark={isDark}
            >
                <BarChartComponent
                    data={activityData}
                    dataKey="actions"
                    nameKey="name"
                    title="User Activity Summary"
                    barProps={{
                        name: "Total Actions",
                        fill: isDark ? "#65C2CB" : "#1E4065",
                        radius: [4, 4, 0, 0]
                    }}
                    tooltipFormatter={(value) => [`${value} actions`]}
                    headerChildren={
                        <button
                            className={`text-xs flex items-center ${isDark ? 'text-blue-300 hover:text-blue-100' : 'text-blue-500 hover:text-blue-700'}`}
                            onClick={() => window.location.href = '/users/activity-summary'}
                        >
                            <FiList className="mr-1" /> View Full Summary
                        </button>
                    }
                    isDark={isDark}
                />

                <LineChartComponent
                    data={loginData}
                    dataKey="daysSinceLogin"
                    nameKey="name"
                    title="Recent User Logins"
                    lineProps={{
                        name: "Days Since Last Login",
                        stroke: isDark ? "#65C2CB" : "#FF6384",
                        activeDot: { r: 8 }
                    }}
                    tooltipFormatter={(value) => [`${value} days`]}
                    yAxisProps={{ label: { value: 'Days', angle: -90, position: 'insideLeft' } }}
                    headerChildren={
                        <button
                            className={`text-xs flex items-center ${isDark ? 'text-blue-300 hover:text-blue-100' : 'text-blue-500 hover:text-blue-700'}`}
                            onClick={() => window.location.href = '/users'}
                        >
                            <FiList className="mr-1" /> View All Users
                        </button>
                    }
                    isDark={isDark}
                />
            </BaseAnalytics>
        </div>
    );
};

export default AdminOverview;