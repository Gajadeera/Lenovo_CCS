import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/Common/DataTable';
import { format, parseISO, isValid } from 'date-fns';
import SingleRequest from './SingleRequest';
import EditPartRequest from '../../components/PartsRequest/EditPartRequest';
import Button from '../../components/Common/Button';
import FilterModal from '../../components/Common/FilterModal';

const AllPartsRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [jobs, setJobs] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processingRequests, setProcessingRequests] = useState(new Set());
    const [editRequest, setEditRequest] = useState(null);
    const [filters, setFilters] = useState({
        job_number: '',
        status: '',
        urgency: '',
        requested_by: ''
    });

    // Permission checks
    const canProcessRequests = ['administrator', 'manager', 'parts_team'].includes(currentUser?.role);

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

    // Fetch initial data (jobs, technicians)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [jobsResponse, techResponse] = await Promise.all([
                    axios.get('http://localhost:5000/jobs?all=true', {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    }),
                    axios.get('http://localhost:5000/users?role=technician', {
                        headers: { Authorization: `Bearer ${currentUser?.token}` }
                    })
                ]);

                setJobs(jobsResponse?.data || []);
                setTechnicians(techResponse.data?.users || []);
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch initial data');
            }
        };

        if (currentUser?.token) {
            fetchInitialData();
        }
    }, [currentUser]);

    // Fetch requests with filters
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
                        sortBy: 'status', // Sort by status to get pending first
                        sortOrder: 'asc', // Pending will come first in alphabetical order
                        ...Object.fromEntries(
                            Object.entries(filters)
                                .filter(([_, value]) => value !== '')
                        )
                    }
                };

                const response = await axios.get('http://localhost:5000/parts-requests', config);

                // Sort requests to show pending first on the client side
                const sortedRequests = sortRequestsByStatus(response.data?.data || []);

                setRequests(sortedRequests);
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

    // Function to sort requests with pending status first
    const sortRequestsByStatus = (requests) => {
        return [...requests].sort((a, b) => {
            // Pending requests should come first
            if (a.status === 'Pending' && b.status !== 'Pending') return -1;
            if (a.status !== 'Pending' && b.status === 'Pending') return 1;

            // For requests with the same status, sort by date (newest first)
            return new Date(b.requested_at) - new Date(a.requested_at);
        });
    };

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
            job_number: '',
            status: '',
            urgency: '',
            requested_by: ''
        });
        setPage(1);
    };

    const handleStatusUpdate = async (requestId, newStatus, rejectionReason = '') => {
        try {
            setProcessingRequests(prev => new Set(prev).add(requestId));

            // Prepare update data
            const updateData = { status: newStatus };
            if (newStatus === 'Rejected' && rejectionReason) {
                updateData.rejection_reason = rejectionReason;
            }

            const response = await axios.put(
                `http://localhost:5000/parts-requests/${requestId}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setRequests(prev =>
                    sortRequestsByStatus(prev.map(request =>
                        request._id === requestId
                            ? { ...request, status: newStatus, rejection_reason: rejectionReason }
                            : request
                    ))
                );

                // Update selected request if it's the one being processed
                if (selectedRequest && selectedRequest._id === requestId) {
                    setSelectedRequest({
                        ...selectedRequest,
                        status: newStatus,
                        rejection_reason: rejectionReason
                    });
                }

                // Close edit modal if open
                if (editRequest && editRequest._id === requestId) {
                    setEditRequest(null);
                }
            }
        } catch (err) {
            console.error('Error updating request status:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update request status');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const handleEditRequest = (request) => {
        setEditRequest(request);
    };

    const handleUpdateRequest = (updatedRequest) => {
        setRequests(prev => sortRequestsByStatus(prev.map(r =>
            r._id === updatedRequest._id ? updatedRequest : r
        )));

        if (selectedRequest && selectedRequest._id === updatedRequest._id) {
            setSelectedRequest(updatedRequest);
        }

        setEditRequest(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'text-green-500';
            case 'Pending': return 'text-yellow-500';
            case 'Rejected': return 'text-red-500';
            case 'Fulfilled': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-500';
            case 'Medium': return 'text-yellow-500';
            case 'Low': return 'text-blue-500';
            default: return 'text-gray-500';
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
        },
        {
            key: 'requested_by',
            label: 'Technician',
            type: 'select',
            value: filters.requested_by,
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
            key: 'job_id',
            header: 'Job #',
            accessor: (request) => {
                if (typeof request.job_id === 'object' && request.job_id !== null) {
                    return request.job_id.job_number || 'N/A';
                }
                return 'N/A';
            },
            sortable: true
        },
        {
            key: 'requested_by',
            header: 'Technician',
            accessor: (request) => request.requested_by?.name || 'N/A',
            sortable: true
        },
        {
            key: 'urgency',
            header: 'Priority',
            accessor: (request) => (
                <span className={`capitalize ${getPriorityColor(request.urgency)}`}>
                    {request.urgency || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (request) => (
                <span className={`capitalize ${getStatusColor(request.status)}`}>
                    {request.status || 'N/A'}
                </span>
            ),
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
            key: 'actions',
            header: 'Actions',
            accessor: (request) => (
                <div className="flex space-x-2">
                    {canProcessRequests && request.status === 'Pending' ? (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(request._id, 'Approved');
                                }}
                                disabled={processingRequests.has(request._id)}
                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                            >
                                {processingRequests.has(request._id) ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditRequest(request);
                                }}
                                disabled={processingRequests.has(request._id)}
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-xs"
                            >
                                Reject
                            </button>
                        </>
                    ) : (
                        <span className="text-gray-400 text-xs">No actions</span>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parts Requests</h1>
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
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {/* DataTable without built-in filters */}
            <DataTable
                data={requests}
                columns={columns}
                loading={loading}
                page={page}
                limit={limit}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
                rowClassName="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                headerClassName="bg-[#1e4065] text-white"
                emptyStateMessage="No parts requests found"
                loadingMessage="Loading parts requests..."
                error={error ? { message: error } : null}
            />

            {/* Filter Modal */}
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                title="Filter Parts Requests"
            />

            {/* Single Request Modal */}
            {selectedRequest && (
                <SingleRequest
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    requestId={selectedRequest._id}
                    onRequestUpdate={(updatedRequest) => {
                        setRequests(prev => sortRequestsByStatus(prev.map(r =>
                            r._id === updatedRequest._id ? updatedRequest : r
                        )));
                        setSelectedRequest(updatedRequest);
                    }}
                />
            )}

            {/* Edit Request Modal */}
            {editRequest && (
                <EditPartRequest
                    isOpen={!!editRequest}
                    onClose={() => setEditRequest(null)}
                    request={editRequest}
                    onUpdate={handleUpdateRequest}
                    jobs={jobs || []}
                />
            )}
        </div>
    );
};

export default AllPartsRequests;