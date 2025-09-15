import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../Common/Button';
import DataTable from '../../components/Common/DataTable';
import { format, parseISO, isValid } from 'date-fns';
import CreateJob from '../../components/Jobs/CreateJob';
import SingleJobModal from '../../components/Jobs/SingleJob';
import FilterModal from '../../components/Common/FilterModal';

const AllJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [technicians, setTechnicians] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [filters, setFilters] = useState({
        job_number: '',
        serial_number: '',
        status: '',
        priority: '',
        job_type: '',
        assigned_to: '',
        warranty_status: ''
    });
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [showCreateJobModal, setShowCreateJobModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Permission checks
    const canCreateJobs = ['administrator', 'manager', 'coordinator', 'customer_service'].includes(currentUser?.role);

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value => value !== '');

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

    // Fetch initial data (technicians, customers, devices)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [techResponse, custResponse, devResponse] = await Promise.all([
                    axios.get('http://localhost:5000/users?role=technician', {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    }),
                    axios.get('http://localhost:5000/customers?all=true', {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    }),
                    axios.get('http://localhost:5000/devices?all=true', {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    })
                ]);

                setTechnicians(techResponse.data?.users || []);
                setCustomers(custResponse.data || []);
                setDevices(devResponse.data || []);
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch initial data');
            }
        };

        if (currentUser?.token) {
            fetchInitialData();
        }
    }, [currentUser]);

    // Fetch jobs with filters
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const config = {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`
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

                const response = await axios.get('http://localhost:5000/jobs/', config);

                const validatedJobs = (response.data.data || []).map(job => ({
                    ...job,
                    created_at: job.created_at || null,
                    assigned_to: job.assigned_to || null,
                    customer: job.customer || null
                }));

                setJobs(validatedJobs);
                setTotalCount(response.data.totalCount || 0);
                setError(null);
            } catch (err) {
                console.error('Error fetching jobs:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch jobs');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchJobs();
        }
    }, [currentUser, page, limit, filters, navigate]);

    const handleRowClick = (job) => {
        setSelectedJob(job);
    };

    const handleCreateJob = (newJob) => {
        setJobs(prev => [newJob, ...prev]);
        setShowCreateJobModal(false);
        setTotalCount(prev => prev + 1);
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= Math.ceil(totalCount / limit)) {
            setPage(newPage);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            job_number: '',
            serial_number: '',
            status: '',
            priority: '',
            job_type: '',
            assigned_to: '',
            warranty_status: ''
        });
        setPage(1);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Closed': return 'text-green-600 dark:text-green-400';
            case 'Reopened': return 'text-orange-600 dark:text-orange-400';
            case 'Awaiting Workshop Repair': return 'text-purple-600 dark:text-purple-400';
            case 'On Hold': return 'text-yellow-600 dark:text-yellow-400';
            case 'In Progress': return 'text-blue-600 dark:text-blue-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return 'text-red-600 dark:text-red-400';
            case 'High': return 'text-orange-600 dark:text-orange-400';
            case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-green-600 dark:text-green-400';
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
            placeholder: 'Search by serial',
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
                { value: 'Urgent', label: 'Urgent' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
            ]
        },
        {
            key: 'job_type',
            label: 'Type',
            type: 'select',
            value: filters.job_type,
            options: [
                { value: '', label: 'All Types' },
                { value: 'workshop', label: 'Workshop' },
                { value: 'onsite', label: 'Onsite' },
                { value: 'remote', label: 'Remote' }
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
        },
        {
            key: 'assigned_to',
            label: 'Technician',
            type: 'select',
            value: filters.assigned_to,
            options: [
                { value: '', label: 'All Technicians' },
                ...technicians.map(tech => ({
                    value: tech._id,
                    label: tech.name
                }))
            ]
        }
    ];

    const columns = [
        {
            key: 'job_number',
            header: 'Job #',
            accessor: (job) => (
                <span className="text-gray-800 dark:text-gray-200">
                    {job.job_number}
                </span>
            ),
            sortable: true
        },
        {
            key: 'customer',
            header: 'Customer',
            accessor: (job) => (
                <span className="text-gray-800 dark:text-gray-200">
                    {job.customer?.name || 'Ad-hoc Customer'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'serial_number',
            header: 'Serial #',
            accessor: (job) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {job.serial_number || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'warranty_status',
            header: 'Warranty',
            accessor: (job) => (
                <span className={`capitalize ${job.warranty_status === 'In Warranty' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {job.warranty_status || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'job_type',
            header: 'Type',
            accessor: (job) => (
                <span className="capitalize text-gray-700 dark:text-gray-300">
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
            accessor: (job) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {safeFormatDate(job.createdAt)}
                </span>
            ),
            sortable: true
        },
        {
            key: 'assigned_to',
            header: 'Technician',
            accessor: (job) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {job.assigned_to?.name || 'Unassigned'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: (job) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
                >
                    View
                </button>
            )
        }
    ];

    return (
        <div className="px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h1>
                <div className="flex space-x-3">
                    {/* Filter Button */}
                    <Button
                        onClick={() => setShowFilterModal(true)}
                        leftIcon={<FiFilter />}
                        size="md"
                        variant="outline"
                        className={hasActiveFilters ? 'border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400' : ''}
                    >
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                                Active
                            </span>
                        )}
                    </Button>

                    {/* Create Job Button */}
                    {canCreateJobs && (
                        <Button
                            onClick={() => setShowCreateJobModal(true)}
                            leftIcon={<FiPlus />}
                            size="md"
                        >
                            Create Job
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded">
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
                rowClassName="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                headerClassName="bg-[#1e4065] text-white"
                emptyStateMessage="No jobs found"
                loadingMessage="Loading jobs..."
                error={error ? { message: error } : null}
            />

            {/* Filter Modal */}
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                title="Filter Jobs"
            />

            {showCreateJobModal && (
                <CreateJob
                    isOpen={showCreateJobModal}
                    onClose={() => setShowCreateJobModal(false)}
                    onCreateJob={handleCreateJob}
                    customers={customers}
                    devices={devices}
                    technicians={technicians}
                    currentUser={currentUser}
                />
            )}

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
                />
            )}
        </div>
    );
};

export default AllJobs;