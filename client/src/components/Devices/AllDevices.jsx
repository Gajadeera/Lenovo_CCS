import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/Common/DataTable';
import { format, parseISO, isValid } from 'date-fns';
import CreateDevice from '../../components/Devices/CreateDevice';
import SingleDeviceModal from '../../components/Devices/SingleDevice';
import DeleteDeviceModal from './DeleteDeviceModal';
import Button from '../../components/Common/Button';
import FilterModal from '../../components/Common/FilterModal';

const AllDevices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [filters, setFilters] = useState({
        serial_number: '',
        device_type: '',
        manufacturer: '',
        model_number: '',
        warranty_status: '',
        customer: ''
    });
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [showCreateDeviceModal, setShowCreateDeviceModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Permission checks
    const canCreateDevices = ['manager', 'coordinator'].includes(currentUser?.role);
    const canDeleteDevices = ['manager'].includes(currentUser?.role);

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

    // Fetch initial data (customers)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const custResponse = await axios.get('http://localhost:5000/customers?all=true', {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                });

                setCustomers(custResponse.data || []);
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch initial data');
            }
        };

        if (currentUser?.token) {
            fetchInitialData();
        }
    }, [currentUser]);

    // Fetch devices with filters
    useEffect(() => {
        const fetchDevices = async () => {
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

                const response = await axios.get('http://localhost:5000/devices', config);

                // Handle both array and paginated response structures
                const devicesData = response.data.devices || response.data || [];
                const total = response.data.pagination?.total ||
                    response.data.totalCount ||
                    devicesData.length;

                setDevices(devicesData);
                setTotalCount(total);
                setError(null);
            } catch (err) {
                console.error('Error fetching devices:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch devices');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser?.token) {
            fetchDevices();
        }
    }, [currentUser, page, limit, filters, navigate]);

    const handleRowClick = (device) => {
        setSelectedDevice(device);
    };

    const handleCreateDevice = (newDevice) => {
        setDevices(prev => [newDevice, ...prev]);
        setShowCreateDeviceModal(false);
        setTotalCount(prev => prev + 1);
    };

    const handleDeleteDevice = (device) => {
        setDeviceToDelete(device);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/devices/${deviceToDelete._id}`, {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            });

            // Remove the device from the list
            setDevices(prev => prev.filter(d => d._id !== deviceToDelete._id));
            setTotalCount(prev => prev - 1);
            setShowDeleteModal(false);
            setDeviceToDelete(null);
        } catch (err) {
            console.error('Error deleting device:', err);
            setError(err.response?.data?.message || err.message || 'Failed to delete device');
        }
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
            serial_number: '',
            device_type: '',
            manufacturer: '',
            model_number: '',
            warranty_status: '',
            customer: ''
        });
        setPage(1);
    };

    const getWarrantyStatusColor = (status) => {
        switch (status) {
            case 'In Warranty': return 'text-green-600 dark:text-green-400';
            case 'Out of Warranty': return 'text-red-600 dark:text-red-400';
            case 'Expired': return 'text-red-600 dark:text-red-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const filterConfig = [
        {
            key: 'serial_number',
            label: 'Serial #',
            type: 'text',
            placeholder: 'Search by serial number',
            value: filters.serial_number
        },
        {
            key: 'manufacturer',
            label: 'Manufacturer',
            type: 'text',
            placeholder: 'Search by manufacturer',
            value: filters.manufacturer
        },
        {
            key: 'model_number',
            label: 'Model #',
            type: 'text',
            placeholder: 'Search by model',
            value: filters.model_number
        },
        {
            key: 'device_type',
            label: 'Type',
            type: 'select',
            value: filters.device_type,
            options: [
                { value: '', label: 'All Types' },
                { value: 'Laptop', label: 'Laptop' },
                { value: 'Desktop', label: 'Desktop' },
                { value: 'Server', label: 'Server' },
                { value: 'Tablet', label: 'Tablet' },
                { value: 'Smartphone', label: 'Smartphone' },
                { value: 'Printer', label: 'Printer' },
                { value: 'Network', label: 'Network Device' },
                { value: 'Other', label: 'Other' }
            ]
        },
        {
            key: 'warranty_status',
            label: 'Warranty',
            type: 'select',
            value: filters.warranty_status,
            options: [
                { value: '', label: 'All Statuses' },
                { value: 'In Warranty', label: 'In Warranty' },
                { value: 'Out of Warranty', label: 'Out of Warranty' },
                { value: 'Expired', label: 'Expired' },
                { value: 'Unknown', label: 'Unknown' }
            ]
        },
        {
            key: 'customer',
            label: 'Customer',
            type: 'select',
            value: filters.customer,
            options: [
                { value: '', label: 'All Customers' },
                ...customers.map(customer => ({
                    value: customer._id,
                    label: customer.name
                }))
            ]
        }
    ];

    const columns = [
        {
            key: 'serial_number',
            header: 'Serial #',
            accessor: (device) => (
                <span className="text-gray-800 dark:text-gray-200">
                    {device.serial_number || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'device_type',
            header: 'Type',
            accessor: (device) => (
                <span className="capitalize text-gray-800 dark:text-gray-200">
                    {device.device_type || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'manufacturer',
            header: 'Manufacturer',
            accessor: (device) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {device.manufacturer || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'model_number',
            header: 'Model',
            accessor: (device) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {device.model_number || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'customer',
            header: 'Customer',
            accessor: (device) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {device.customer?.name || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'warranty_status',
            header: 'Warranty',
            accessor: (device) => (
                <span className={`capitalize ${getWarrantyStatusColor(device.warranty_status)}`}>
                    {device.warranty_status || 'N/A'}
                </span>
            ),
            sortable: true
        },
        {
            key: 'purchase_date',
            header: 'Purchase Date',
            accessor: (device) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {safeFormatDate(device.purchase_date)}
                </span>
            ),
            sortable: true
        },
        {
            key: 'createdAt',
            header: 'Created',
            accessor: (device) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {safeFormatDate(device.createdAt)}
                </span>
            ),
            sortable: true
        },
        // Add actions column for delete button
        {
            key: 'actions',
            header: 'Actions',
            accessor: (device) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevice(device);
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
                    >
                        View
                    </button>
                    {canDeleteDevices && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDevice(device);
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-medium transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="px-4 py-6 bg-white dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h1>
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

                    {/* Create Device Button */}
                    {canCreateDevices && (
                        <Button
                            onClick={() => setShowCreateDeviceModal(true)}
                            leftIcon={<FiPlus />}
                            size="md"
                        >
                            Create Device
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {/* DataTable without built-in filters */}
            <DataTable
                data={devices}
                columns={columns}
                loading={loading}
                page={page}
                limit={limit}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
                rowClassName="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                headerClassName="bg-[#1e4065] text-white"
                emptyStateMessage="No devices found"
                loadingMessage="Loading devices..."
                error={error ? { message: error } : null}
            />

            {/* Filter Modal */}
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                title="Filter Devices"
            />

            {showCreateDeviceModal && (
                <CreateDevice
                    isOpen={showCreateDeviceModal}
                    onClose={() => setShowCreateDeviceModal(false)}
                    onCreateDevice={handleCreateDevice}
                    customers={customers}
                />
            )}

            {selectedDevice && (
                <SingleDeviceModal
                    isOpen={!!selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                    deviceId={selectedDevice._id}
                    onDeviceUpdate={(updatedDevice) => {
                        setDevices(prev => prev.map(d =>
                            d._id === updatedDevice._id ? updatedDevice : d
                        ));
                        setSelectedDevice(updatedDevice);
                    }}
                />
            )}

            {showDeleteModal && deviceToDelete && (
                <DeleteDeviceModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeviceToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    deviceSerial={deviceToDelete.serial_number}
                />
            )}
        </div>
    );
};

export default AllDevices;