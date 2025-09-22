import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/Common/DataTable';
import { format, parseISO, isValid } from 'date-fns';
import CreateCustomer from '../../components/Customers/CreateCustomer';
import SingleCustomerModal from '../../components/Customers/SingleCustomer';
import Button from '../../components/Common/Button';
import FilterModal from '../../components/Common/FilterModal';

const AllCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        phone: '',
        customer_type: '',
        is_ad_hoc: ''
    });

    const canEditCustomers = ['administrator', 'manager'].includes(currentUser?.role);
    const canCreateCustomers = ['administrator', 'manager', 'customer_service'].includes(currentUser?.role);

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

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

    const safeFormatDate = (dateString, formatString = 'MM/dd/yyyy') => {
        const date = safeParseISO(dateString);
        return date ? format(date, formatString) : 'N/A';
    };

    useEffect(() => {
        const fetchCustomers = async () => {
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

                const response = await axios.get('http://localhost:5000/customers/', config);

                const validatedCustomers = (response.data.customers || []).map(customer => ({
                    ...customer,
                    created_at: customer.created_at || null,
                    name: customer.name || 'No name',
                    email: customer.email || '',
                    phone: customer.phone || '',
                    customer_type: customer.customer_type || 'Personal'
                }));

                setCustomers(validatedCustomers);
                setTotalCount(response.data.totalCount || 0);
                setError(null);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch customers');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchCustomers();
        }
    }, [currentUser, page, limit, filters, navigate]);

    const handleRowClick = (customer) => {
        setSelectedCustomer(customer);
    };

    const handleCreateCustomer = (newCustomer) => {
        setCustomers(prev => [newCustomer, ...prev]);
        setShowCreateModal(false);
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
            name: '',
            email: '',
            phone: '',
            customer_type: '',
            is_ad_hoc: ''
        });
        setPage(1);
    };

    const handleCustomerUpdate = (updatedCustomer) => {
        setCustomers(prev => prev.map(c =>
            c._id === updatedCustomer._id ? updatedCustomer : c
        ));
        setSelectedCustomer(updatedCustomer);
    };

    const filterConfig = [
        {
            key: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Search by name',
            value: filters.name
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'Search by email',
            value: filters.email
        },
        {
            key: 'phone',
            label: 'Phone',
            type: 'text',
            placeholder: 'Search by phone',
            value: filters.phone
        },
        {
            key: 'customer_type',
            label: 'Type',
            type: 'select',
            value: filters.customer_type,
            options: [
                { value: '', label: 'All Types' },
                { value: 'Personal', label: 'Personal' },
                { value: 'Enterprise', label: 'Enterprise' }
            ]
        },
        {
            key: 'is_ad_hoc',
            label: 'Customer Type',
            type: 'select',
            value: filters.is_ad_hoc,
            options: [
                { value: '', label: 'All Customers' },
                { value: 'true', label: 'Ad Hoc Only' },
                { value: 'false', label: 'Regular Only' }
            ]
        }
    ];

    const getCustomerTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'enterprise': return 'text-blue-600 dark:text-blue-400';
            case 'personal': return 'text-green-600 dark:text-green-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Name',
            accessor: (customer) => (
                <div className="flex flex-col">
                    <span className="text-gray-800 dark:text-gray-200">
                        {customer.name}
                    </span>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            accessor: (customer) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {customer.email || '-'}
                </span>
            )
        },
        {
            key: 'phone',
            header: 'Phone',
            accessor: (customer) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {customer.phone || '-'}
                </span>
            )
        },
        {
            key: 'customer_type',
            header: 'Type',
            accessor: (customer) => (
                <span className={`capitalize ${getCustomerTypeColor(customer.customer_type)}`}>
                    {customer.customer_type || 'Personal'}
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            accessor: (customer) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {safeFormatDate(customer.created_at)}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: (customer) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
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

                    {canCreateCustomers && (
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            leftIcon={<FiPlus />}
                            size="md"
                        >
                            Create Customer
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
                data={customers}
                columns={columns}
                loading={loading}
                page={page}
                limit={limit}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
                rowClassName="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                headerClassName="bg-[#1e4065] text-white"
                emptyStateMessage="No customers found"
                loadingMessage="Loading customers..."
                error={error ? { message: error } : null}
            />

            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                title="Filter Customers"
            />

            {showCreateModal && (
                <CreateCustomer
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreateCustomer={handleCreateCustomer}
                />
            )}

            {selectedCustomer && (
                <SingleCustomerModal
                    isOpen={!!selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    customerId={selectedCustomer._id}
                    onCustomerUpdate={handleCustomerUpdate}
                    canEdit={canEditCustomers}
                />
            )}
        </div>
    );
};

export default AllCustomers;