import React, { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import DataTable from '../../components/Common/DataTable';
import CreateIssue from '../../components/Issues/CreateIssue';
import SingleIssueModal from '../../components/Issues/SingleIssue';
import { format, parseISO, isValid } from 'date-fns';
import Button from '../../components/Common/Button';

const AllIssues = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        title: '',
        status: '',
        priority: '',
        category: '',
        assigned_to: ''
    });
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);

    // Permission checks
    const canCreateIssues = ['administrator', 'manager', 'coordinator'].includes(currentUser?.role);

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

    // Fetch initial data (users)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/users', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                });
                setUsers(response.data?.users || []);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch users');
            }
        };

        if (currentUser?.token) {
            fetchUsers();
        }
    }, [currentUser]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleIssueUpdate = (updatedIssue) => {
            setIssues(prev => prev.map(issue =>
                issue._id === updatedIssue._id ? updatedIssue : issue
            ));
            if (selectedIssue?._id === updatedIssue._id) {
                setSelectedIssue(updatedIssue);
            }
        };

        const handleNewIssue = (newIssue) => {
            setIssues(prev => [newIssue, ...prev]);
            setTotalCount(prev => prev + 1);
        };

        const handleIssueDeleted = (deletedIssueId) => {
            setIssues(prev => prev.filter(issue => issue._id !== deletedIssueId));
            if (selectedIssue?._id === deletedIssueId) {
                setSelectedIssue(null);
            }
            setTotalCount(prev => prev - 1);
        };

        socket.on('issue:updated', handleIssueUpdate);
        socket.on('issue:created', handleNewIssue);
        socket.on('issue:deleted', handleIssueDeleted);

        return () => {
            socket.off('issue:updated', handleIssueUpdate);
            socket.off('issue:created', handleNewIssue);
            socket.off('issue:deleted', handleIssueDeleted);
        };
    }, [socket, selectedIssue]);

    // Fetch issues with filters
    useEffect(() => {
        const fetchIssues = async () => {
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

                const response = await axios.get('http://localhost:5000/system-issues', config);

                // Handle both array and paginated response structures
                const issuesData = response.data.data || response.data.issues || response.data || [];
                const total = response.data.pagination?.total ||
                    response.data.totalCount ||
                    response.data.total ||
                    issuesData.length;

                // Add validation logic that was missing
                const validatedIssues = issuesData.map(issue => ({
                    ...issue,
                    created_at: issue.created_at || null,
                    assigned_to: issue.assigned_to || null,
                    reported_by: issue.reported_by || null
                }));

                setIssues(validatedIssues);
                setTotalCount(total);
                setError(null);
            } catch (err) {
                console.error('Error fetching issues:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch issues');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchIssues();
        }
    }, [currentUser, page, limit, filters, navigate]);

    const handleRowClick = (issue) => {
        setSelectedIssue(issue);
    };

    const handleCreateIssue = (newIssue) => {
        setIssues(prev => [newIssue, ...prev]);
        setShowCreateIssueModal(false);
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
            title: '',
            status: '',
            priority: '',
            category: '',
            assigned_to: ''
        });
        setPage(1);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-500';
            case 'Medium': return 'text-yellow-500';
            case 'Low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'text-blue-500';
            case 'In Progress': return 'text-purple-500';
            case 'Resolved': return 'text-green-500';
            case 'Closed': return 'text-gray-500';
            default: return 'text-gray-500';
        }
    };

    const filterConfig = [
        {
            key: 'title',
            label: 'Title',
            type: 'text',
            placeholder: 'Search by title',
            value: filters.title
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Resolved', label: 'Resolved' },
                { value: 'Closed', label: 'Closed' }
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
                { value: 'High', label: 'High' }
            ]
        },
        {
            key: 'category',
            label: 'Category',
            type: 'select',
            value: filters.category,
            options: [
                { value: '', label: 'All Categories' },
                { value: 'Bug', label: 'Bug' },
                { value: 'Feature Request', label: 'Feature Request' },
                { value: 'UI/UX', label: 'UI/UX' },
                { value: 'Performance', label: 'Performance' },
                { value: 'Other', label: 'Other' }
            ]
        },
        {
            key: 'assigned_to',
            label: 'Assigned To',
            type: 'select',
            value: filters.assigned_to,
            options: [
                { value: '', label: 'All Users' },
                ...users.map(user => ({
                    value: user._id,
                    label: user.name
                }))
            ]
        }
    ];

    const columns = [
        {
            key: 'title',
            header: 'Title',
            accessor: (issue) => (
                <span className="text-[#1E4065] font-medium">
                    {issue.title}
                </span>
            ),
            sortable: true
        },
        {
            key: 'reported_by',
            header: 'Reported By',
            accessor: (issue) => issue.reported_by?.name || 'System',
            sortable: true
        },
        {
            key: 'assigned_to',
            header: 'Assigned To',
            accessor: (issue) => issue.assigned_to?.name || 'Unassigned',
            sortable: true
        },
        {
            key: 'category',
            header: 'Category',
            accessor: (issue) => issue.category || 'Other',
            sortable: true
        },
        {
            key: 'priority',
            header: 'Priority',
            accessor: (issue) => (
                <span className={`capitalize font-semibold ${getPriorityColor(issue.priority)}`}>
                    {issue.priority || 'Not Set'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (issue) => (
                <span className={`capitalize font-semibold ${getStatusColor(issue.status)}`}>
                    {issue.status || 'Open'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'created_at',
            header: 'Created',
            accessor: (issue) => safeFormatDate(issue.created_at),
            sortable: true
        }
    ];

    return (
        <div className="px-4 py-6 relative">
            {/* Main Content */}
            <div >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">System Issues</h1>
                    {canCreateIssues && (
                        <Button
                            onClick={() => setShowCreateIssueModal(true)}
                            leftIcon={<FiPlus />}
                            size="md"
                        >
                            Create Issue
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <DataTable
                    data={issues}
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
                    emptyStateMessage="No issues found"
                    loadingMessage="Loading issues..."
                />
            </div>

            {/* Modals - rendered in portal to prevent z-index issues */}
            {showCreateIssueModal && (
                <CreateIssue
                    isOpen={showCreateIssueModal}
                    onClose={() => setShowCreateIssueModal(false)}
                    onCreateIssue={handleCreateIssue}
                    users={users}
                    currentUser={currentUser}
                />
            )}
            {selectedIssue && (
                <SingleIssueModal
                    isOpen={!!selectedIssue}
                    onClose={() => setSelectedIssue(null)}
                    issueId={selectedIssue._id}
                    onIssueUpdate={(updatedIssue) => {
                        // Add null check here
                        if (!updatedIssue) {
                            setSelectedIssue(null);
                            return;
                        }
                        setIssues(prev => prev.map(i =>
                            i._id === updatedIssue._id ? updatedIssue : i
                        ));
                        setSelectedIssue(updatedIssue);
                    }}
                    onIssueDeleted={(deletedIssueId) => {
                        setIssues(prev => prev.filter(issue => issue._id !== deletedIssueId));
                        setSelectedIssue(null);
                        setTotalCount(prev => prev - 1);
                    }}
                />
            )}
        </div>
    );
};

export default AllIssues;