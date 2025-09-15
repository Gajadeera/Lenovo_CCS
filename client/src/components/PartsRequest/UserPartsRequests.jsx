import React, { useState, useEffect } from 'react';
import { FiPackage } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/Common/DataTable';
import { format, parseISO, isValid } from 'date-fns';
import SingleRequest from './SingleRequest';
import StatusBadge from '../../components/Common/StatusBadge';
import PriorityBadge from '../../components/Common/PriorityBadge';

const UserPartsRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [jobs, setJobs] = useState([]);
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [filters, setFilters] = useState({
        request_number: '',
        job_number: '',
        status: '',
        urgency: ''
    });

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

    // Fetch initial data (jobs)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const jobsResponse = await axios.get('http://localhost:5000/jobs?all=true', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                });
                setJobs(jobsResponse.data?.data || []);
            } catch (err) {
                console.error('Error fetching jobs:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch jobs data');
            }
        };

        if (currentUser?.token) {
            fetchInitialData();
        }
    }, [currentUser]);

    // Fetch requests with filters (only for current user)
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                const config = {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`
                    },
                    params: {
                        page,
                        limit,
                        requested_by: currentUser._id, // Only show requests for current user
                        ...Object.fromEntries(
                            Object.entries(filters)
                                .filter(([_, value]) => value !== '')
                        )
                    }
                };

                const response = await axios.get('http://localhost:5000/parts-requests', config);

                setRequests(response.data.data || []);
                setTotalCount(response.data.totalCount || 0);
                setError(null);
            } catch (err) {
                console.error('Error fetching parts requests:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch parts requests');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchRequests();
        }
    }, [currentUser, page, limit, filters, navigate]);

    const handleRowClick = (request) => {
        setSelectedRequest(request);
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
            request_number: '',
            job_number: '',
            status: '',
            urgency: ''
        });
        setPage(1);
    };

    const filterConfig = [
        {
            key: 'request_number',
            label: 'Request #',
            type: 'text',
            placeholder: 'Search by request number',
            value: filters.request_number
        },
        {
            key: 'job_number',
            label: 'Job #',
            type: 'text',
            placeholder: 'Search by job number',
            value: filters.job_number
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' },
                { value: 'Fulfilled', label: 'Fulfilled' }
            ]
        },
        {
            key: 'urgency',
            label: 'Priority',
            type: 'select',
            value: filters.urgency,
            options: [
                { value: '', label: 'All Priorities' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
            ]
        }
    ];

    const columns = [
        {
            key: 'request_number',
            header: 'Request #',
            accessor: (request) => (
                <span className="text-[#1E4065] font-medium">
                    {request.request_number}
                </span>
            ),
            sortable: true
        },
        {
            key: 'job_id',
            header: 'Job #',
            accessor: (request) => {
                const job = request.job_id?.job_number
                    ? request.job_id
                    : jobs.find(j => j._id === request.job_id);
                return job?.job_number || 'N/A';
            },
            sortable: true
        },
        {
            key: 'urgency',
            header: 'Priority',
            accessor: (request) => <PriorityBadge priority={request.urgency} />,
            sortable: true
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (request) => <StatusBadge status={request.status} type="part" />,
            sortable: true
        },
        {
            key: 'requested_at',
            header: 'Request Date',
            accessor: (request) => safeFormatDate(request.requested_at),
            sortable: true
        },
        {
            key: 'parts_description',
            header: 'Description',
            accessor: (request) => (
                <span className="truncate max-w-xs inline-block">
                    {request.parts_description?.substring(0, 30) || 'No description'}...
                </span>
            )
        },
        {
            key: 'approved_by',
            header: 'Approver',
            accessor: (request) => (
                request.approved_by ?
                    request.approved_by?.name || 'System' :
                    'Pending'
            )
        }
    ];

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiPackage className="mr-2" /> My Parts Requests
                </h1>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <DataTable
                data={requests}
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
                emptyStateMessage="No parts requests found"
                loadingMessage="Loading your parts requests..."
            />

            {selectedRequest && (
                <SingleRequest
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    requestId={selectedRequest._id}
                    onRequestUpdate={(updatedRequest) => {
                        setRequests(prev => prev.map(r =>
                            r._id === updatedRequest._id ? updatedRequest : r
                        ));
                        setSelectedRequest(updatedRequest);
                    }}
                />
            )}
        </div>
    );
};

export default UserPartsRequests;