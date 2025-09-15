import React, { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import DataTable from '../../components/Common/DataTable';
import { format, parseISO, isValid } from 'date-fns';
import SingleJobModal from '../../components/Jobs/SingleJob';

const MyJobs = ({ technicianId }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedJob, setSelectedJob] = useState(null);
    const [filters, setFilters] = useState({
        job_number: '',
        serial_number: '',
        status: '',
        priority: '',
        warranty_status: ''
    });
    const { user: currentUser } = useAuth();

    // Safe date parsing function
    const safeParseISO = (dateString) => {
        if (!dateString) return null;
        try {
            const date = parseISO(dateString);
            return isValid(date) ? date : null;
        } catch (error) {
            console.error('Error parsing date:', error);
            return null;
        }
    };

    // Format date safely
    const safeFormatDate = (dateString, formatString = 'MM/dd/yyyy') => {
        const date = safeParseISO(dateString);
        return date ? format(date, formatString) : 'N/A';
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const idToUse = technicianId || currentUser?.id;
                if (!idToUse) {
                    throw new Error('No technician ID available');
                }

                const config = {
                    headers: {
                        'Authorization': `Bearer ${currentUser?.token}`
                    },
                    params: {
                        page,
                        limit,
                        ...Object.fromEntries(
                            Object.entries(filters)
                                .filter(([_, value]) => value !== '')
                        )
                    }
                };

                const response = await axios.get(
                    `http://localhost:5000/jobs/technician/${idToUse}`,
                    config
                );

                const jobsData = response.data.data?.jobs || [];
                const total = response.data?.totalCount || 0;

                setJobs(jobsData);
                setTotalCount(total);
                setError(null);
            } catch (err) {
                console.error('Error fetching jobs:', err);
                setError(err.response?.data?.error || err.message || 'Failed to fetch jobs');
                if (err.response?.status === 401) {
                    setError('Unauthorized - Please login again');
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchJobs();
        }
    }, [currentUser, technicianId, page, limit, filters]);

    const handleRowClick = (job) => {
        setSelectedJob(job);
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= Math.ceil(totalCount / limit)) {
            setPage(newPage);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            job_number: '',
            serial_number: '',
            status: '',
            priority: '',
            warranty_status: ''
        });
        setPage(1);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Closed': return 'text-green-500';
            case 'Reopened': return 'text-orange-500';
            case 'Awaiting Workshop Repair': return 'text-purple-500';
            case 'On Hold': return 'text-yellow-500';
            case 'In Progress': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return 'text-red-500';
            case 'High': return 'text-orange-500';
            case 'Medium': return 'text-yellow-500';
            default: return 'text-green-500';
        }
    };

    const filterConfig = [
        {
            key: 'job_number',
            label: 'Job #',
            type: 'text',
            placeholder: 'Search by job number',
            value: filters.job_number
        },
        {
            key: 'serial_number',
            label: 'Serial #',
            type: 'text',
            placeholder: 'Search by serial number',
            value: filters.serial_number
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'Pending Assignment', label: 'Pending Assignment' },
                { value: 'Assigned', label: 'Assigned' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'On Hold', label: 'On Hold' },
                { value: 'Awaiting Workshop Repair', label: 'Awaiting Workshop' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Reopened', label: 'Reopened' }
            ]
        },
        {
            key: 'priority',
            label: 'Priority',
            type: 'select',
            value: filters.priority,
            options: [
                { value: '', label: 'All Priorities' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Urgent', label: 'Urgent' }
            ]
        },
        {
            key: 'warranty_status',
            label: 'Warranty',
            type: 'select',
            value: filters.warranty_status,
            options: [
                { value: '', label: 'All Warranty' },
                { value: 'In Warranty', label: 'In Warranty' },
                { value: 'Out of Warranty', label: 'Out of Warranty' }
            ]
        }
    ];

    const columns = [
        {
            key: 'job_number',
            header: 'Job #',
            accessor: (job) => (
                <span className="text-[#1E4065] font-medium">
                    {job.job_number}
                </span>
            ),
            sortable: true
        },
        {
            key: 'customer',
            header: 'Customer',
            accessor: (job) => job.customer_id?.name || 'Ad-hoc Customer',
            sortable: true
        },
        {
            key: 'serial_number',
            header: 'Serial #',
            accessor: (job) => job.serial_number || 'N/A',
            sortable: true
        },
        {
            key: 'warranty_status',
            header: 'Warranty',
            accessor: (job) => (
                <span className={`capitalize ${job.warranty_status === 'In Warranty' ? 'text-green-500' : 'text-red-500'}`}>
                    {job.warranty_status || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'job_type',
            header: 'Type',
            accessor: (job) => (
                <span className="capitalize">
                    {job.job_type || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'priority',
            header: 'Priority',
            accessor: (job) => (
                <span className={`capitalize ${getPriorityColor(job.priority)}`}>
                    {job.priority || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (job) => (
                <span className={`capitalize ${getStatusColor(job.status)}`}>
                    {job.status || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'created_at',
            header: 'Created',
            accessor: (job) => safeFormatDate(job.createdAt),
            sortable: true
        }
    ];

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {technicianId ? 'Technician Jobs' : 'My Assigned Jobs'}
                </h1>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <DataTable
                data={jobs}
                columns={columns}
                loading={loading}
                page={page}
                limit={limit}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
                rowClassName="cursor-pointer hover:bg-[#e6f7ff]"
                headerClassName="bg-[#1E4065] text-white"
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                emptyStateMessage="No jobs currently assigned to you."
                loadingMessage="Loading your jobs..."
            />

            {selectedJob && (
                <SingleJobModal
                    isOpen={!!selectedJob}
                    onClose={() => setSelectedJob(null)}
                    jobId={selectedJob._id}
                    onJobUpdate={(updatedJob) => {
                        setJobs(prev => prev.map(j =>
                            j._id === updatedJob._id ? updatedJob : j
                        ));
                        setSelectedJob(updatedJob);
                    }}
                    showEditButton={true}
                    showPartsRequest={true}
                    technicianView={true}
                />
            )}
        </div>
    );
};

export default MyJobs;