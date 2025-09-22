import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import DataTable from '../../components/Common/DataTable';
import CreateUser from '../../components/Users/CreateUser';
import SingleUserModal from '../../components/Users/SingleUser';
import Button from '../Common/Button';
import FilterModal from '../../components/Common/FilterModal';

const AllUsers = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        name: '',
        role: '',
        status: ''
    });
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { onlineUsers, isConnected } = useSocket();

    const calculateLimit = (userCount) => {
        return userCount <= 5 ? userCount : 5;
    };

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const calculateUserStatus = (userId) => {
        if (!isConnected) {
            return 'offline';
        }

        if (!onlineUsers?.users) {
            return 'offline';
        }

        const userIdStr = String(userId);
        const isOnline = onlineUsers.users.some(onlineUser => {
            const onlineUserIdStr = String(onlineUser.userId);
            return onlineUserIdStr === userIdStr;
        });

        return isOnline ? 'online' : 'offline';
    };

    const processUsers = (usersData) => {
        return usersData.map(user => {
            const userId = user._id || user.id;
            return {
                ...user,
                status: calculateUserStatus(userId),
                phone: user.phone || '-',
                last_login: user.last_login || null,
                role: user.role || 'unknown'
            };
        });
    };

    const filteredUsers = useMemo(() => {
        const { name, role, status } = filters;
        const nameLower = name.toLowerCase();

        return allUsers
            .filter(user => {
                return (!name || user.name.toLowerCase().includes(nameLower)) &&
                    (!role || user.role === role) &&
                    (!status || user.status === status);
            })
            .sort((a, b) => {
                if (a.status === 'online' && b.status !== 'online') return -1;
                if (a.status !== 'online' && b.status === 'online') return 1;
                const aLogin = a.last_login ? new Date(a.last_login) : 0;
                const bLogin = b.last_login ? new Date(b.last_login) : 0;
                return bLogin - aLogin;
            });
    }, [allUsers, filters]);
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const config = {
                headers: {
                    Authorization: currentUser?.token ? `Bearer ${currentUser.token}` : ''
                },
                params: { all: true }
            };

            const response = await axios.get('http://localhost:5000/users/', config);
            const usersData = Array.isArray(response.data)
                ? response.data
                : response.data.users || [];

            const processedUsers = processUsers(usersData);
            setAllUsers(processedUsers);
            setTotalCount(processedUsers.length);
            setLimit(calculateLimit(processedUsers.length));
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
            setError(err.response?.data?.message || err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.token) {
            fetchUsers();
        }
    }, [currentUser]);

    useEffect(() => {
        if (!isConnected || !onlineUsers?.users) {
            return;
        }

        setAllUsers(prevUsers =>
            prevUsers.map(user => {
                const userId = user._id || user.id;
                return {
                    ...user,
                    status: calculateUserStatus(userId)
                };
            })
        );
    }, [onlineUsers, isConnected]);
    const handleCreateUser = (userData) => {
        const newUser = {
            ...userData,
            status: calculateUserStatus(userData._id || userData.id),
            phone: userData.phone || '-',
            last_login: null
        };

        setAllUsers(prev => [newUser, ...prev]);
        setTotalCount(prev => prev + 1);
        setLimit(calculateLimit(totalCount + 1));
        setShowCreateUserModal(false);
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
        setFilters({ name: '', role: '', status: '' });
        setPage(1);
    };

    const paginatedUsers = useMemo(() => {
        return totalCount <= 5
            ? filteredUsers
            : filteredUsers.slice((page - 1) * limit, page * limit);
    }, [filteredUsers, page, limit, totalCount]);

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    const filterConfig = [
        {
            key: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Search by name',
            value: filters.name
        },
        {
            key: 'role',
            label: 'Role',
            type: 'select',
            value: filters.role,
            options: [
                { value: '', label: 'All Roles' },
                { value: 'administrator', label: 'Administrator' },
                { value: 'manager', label: 'Manager' },
                { value: 'technician', label: 'Technician' },
                { value: 'coordinator', label: 'Coordinator' },
                { value: 'parts_team', label: 'Parts Team' }
            ]
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' }
            ]
        }
    ];

    const getStatusColor = (status) => {
        return status === 'online' ? 'text-green-500' : 'text-gray-500';
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'administrator': return 'text-purple-500';
            case 'manager': return 'text-blue-500';
            case 'technician': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Name',
            accessor: (user) => <span className="text-gray-800 dark:text-gray-200">{user.name}</span>
        },
        {
            key: 'email',
            header: 'Email',
            accessor: (user) => user.email
        },
        {
            key: 'phone',
            header: 'Phone',
            accessor: (user) => user.phone
        },
        {
            key: 'role',
            header: 'Role',
            accessor: (user) => (
                <span className={`capitalize ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (user) => (
                <span className={`capitalize ${getStatusColor(user.status)}`}>
                    {user.status}
                </span>
            )
        },
        {
            key: 'last_login',
            header: 'Last Active',
            accessor: (user) => user.last_login
                ? new Date(user.last_login).toLocaleString()
                : 'Never'
        }
    ];

    const canCreateUsers = ['administrator', 'manager'].includes(currentUser?.role);

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="flex space-x-3">
                    <Button
                        onClick={() => setShowFilterModal(true)}
                        leftIcon={<FiFilter />}
                        size="md"
                        variant="outline"
                        className={hasActiveFilters ? 'border-blue-500 text-blue-500' : ''}
                    >
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                                Active
                            </span>
                        )}
                    </Button>
                    {canCreateUsers && (
                        <Button
                            onClick={() => setShowCreateUserModal(true)}
                            leftIcon={<FiPlus />}
                            size="md"
                        >
                            Create User
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <DataTable
                data={paginatedUsers}
                columns={columns}
                loading={loading}
                page={page}
                limit={limit}
                totalCount={filteredUsers.length}
                onPageChange={handlePageChange}
                onRowClick={setSelectedUser}
                rowClassName="cursor-pointer hover:bg-[#e6f7ff]"
                headerClassName="bg-[#1E4065] text-white"
                emptyStateMessage="No users found"
                loadingMessage="Loading users..."
                error={error ? { message: error } : null}
            />

            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                title="Filter Users"
            />

            {showCreateUserModal && (
                <CreateUser
                    isOpen={showCreateUserModal}
                    onClose={() => setShowCreateUserModal(false)}
                    onCreateUser={handleCreateUser}
                />
            )}

            {selectedUser && (
                <SingleUserModal
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                    userId={selectedUser._id}
                    onUserUpdate={(updatedUser) => {
                        setAllUsers(prev => prev.map(u =>
                            u._id === updatedUser._id ? updatedUser : u
                        ));
                        setSelectedUser(updatedUser);
                    }}
                />
            )}
        </div>
    );
};

export default AllUsers;