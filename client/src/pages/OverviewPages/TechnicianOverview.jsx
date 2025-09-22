import React, { useState, useEffect } from 'react';
import { FiTool, FiClock, FiCheckCircle, FiPackage, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext';
import { toast } from 'react-hot-toast';
import StatCard from '../../components/Common/StatCard';
import BaseAnalytics, { LoadingSpinner } from '../../components/Common/BaseAnalytics';

const TechnicianOverview = ({ technicianId }) => {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();

    const [stats, setStats] = useState({
        assigned: 0,
        inProgress: 0,
        completed: 0,
        partsNeeded: 0,
        loading: true
    });

    const [recentJobs, setRecentJobs] = useState([]);
    const [partsRequests, setPartsRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!technicianId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const [jobsRes, partsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/jobs/technician/${technicianId}`, {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    }),
                    axios.get(`http://localhost:5000/parts-requests/requester/${technicianId}`, {
                        headers: { Authorization: `Bearer ${currentUser?.token}` },
                        params: { status: 'Pending' }
                    })
                ]);

                const jobs = jobsRes.data.data?.jobs || jobsRes.data?.jobs || [];
                const pendingParts = partsRes.data?.data || partsRes.data?.partsRequests || [];

                setStats({
                    assigned: jobs.filter(job => job.status === 'Assigned').length,
                    inProgress: jobs.filter(job => job.status === 'In Progress').length,
                    completed: jobs.filter(job => job.status === 'Completed').length,
                    partsNeeded: pendingParts.length,
                    loading: false
                });

                const sortedJobs = [...jobs]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);

                const sortedParts = [...pendingParts]
                    .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
                    .slice(0, 5);

                setRecentJobs(sortedJobs);
                setPartsRequests(sortedParts);

            } catch (error) {
                console.error('Error loading data:', error);
                toast.error(error.response?.data?.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [technicianId, currentUser?.token]);

    const handleStartJob = async (jobId) => {
        try {
            await axios.patch(`http://localhost:5000/jobs/${jobId}/status`, {
                status: 'In Progress'
            }, {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });
            toast.success('Job started successfully');
            setLoading(true);
        } catch (error) {
            console.error('Error starting job:', error);
            toast.error('Failed to start job');
        }
    };

    const handleCompleteJob = async (jobId) => {
        try {
            await axios.patch(`http://localhost:5000/jobs/${jobId}/status`, {
                status: 'Completed'
            }, {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });
            toast.success('Job completed successfully');
            setLoading(true);
        } catch (error) {
            console.error('Error completing job:', error);
            toast.error('Failed to complete job');
        }
    };

    const getStatusColor = (status, isDark) => {
        const colors = {
            'Assigned': isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800',
            'In Progress': isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
            'Completed': isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
            'Pending': isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
            'Approved': isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800',
            'Rejected': isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800',
            'Fulfilled': isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        };
        return colors[status] || (isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800');
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={`p-4 space-y-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>
                        Technician Dashboard
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        Welcome back, {currentUser?.name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={FiTool}
                    title="Assigned"
                    value={stats.assigned}
                    trend={stats.assigned > 0 ? 'up' : 'neutral'}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiClock}
                    title="In Progress"
                    value={stats.inProgress}
                    trend="neutral"
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiCheckCircle}
                    title="Completed"
                    value={stats.completed}
                    trend={stats.completed > 0 ? 'up' : 'neutral'}
                    compact
                    isDark={isDark}
                />
                <StatCard
                    icon={FiPackage}
                    title="Parts Needed"
                    value={stats.partsNeeded}
                    trend={stats.partsNeeded > 0 ? 'up' : 'neutral'}
                    compact
                    isDark={isDark}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg shadow-sm border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>
                            Recent Jobs (5)
                        </h3>
                        <FiTool className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-sm`} />
                    </div>
                    <div className="space-y-2">
                        {recentJobs.map(job => (
                            <div key={job._id} className={`p-2 rounded border text-xs ${isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-100 bg-gray-50'
                                }`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        #{job.job_number}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(job.status, isDark)}`}>
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-500'} truncate max-w-[120px]`}>
                                        {job.description?.substring(0, 30)}...
                                    </span>
                                    <div className="flex gap-1">
                                        {job.status === 'Assigned' && (
                                            <button
                                                onClick={() => handleStartJob(job._id)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                                    }`}
                                            >
                                                Start
                                            </button>
                                        )}
                                        {job.status === 'In Progress' && (
                                            <button
                                                onClick={() => handleCompleteJob(job._id)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-100 hover:bg-green-200 text-green-800'
                                                    }`}
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentJobs.length === 0 && (
                            <p className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                                No recent jobs
                            </p>
                        )}
                    </div>
                </div>

                <div className={`p-3 rounded-lg shadow-sm border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>
                            Recent Parts (5)
                        </h3>
                        <FiPackage className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-sm`} />
                    </div>
                    <div className="space-y-2">
                        {partsRequests.map(request => (
                            <div key={request._id} className={`p-2 rounded border text-xs ${isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-100 bg-gray-50'
                                }`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} truncate max-w-[100px]`}>
                                        {request.parts_description?.substring(0, 20)}...
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(request.status, isDark)}`}>
                                        {request.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Job: {request.job_id?.job_number || 'N/A'}
                                    </span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {new Date(request.requested_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {partsRequests.length === 0 && (
                            <p className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                                No parts requests
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianOverview;