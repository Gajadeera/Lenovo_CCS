import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    FiX, FiCalendar, FiHardDrive, FiMonitor,
    FiUser, FiTool, FiCpu, FiRefreshCw,
    FiPlus, FiSearch
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';

const deviceTypeOptions = [
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Desktop', label: 'Desktop' },
    { value: 'Server', label: 'Server' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Printer', label: 'Printer' },
    { value: 'Other', label: 'Other' }
];

const warrantyOptions = [
    { value: 'In Warranty', label: 'In Warranty' },
    { value: 'Out of Warranty', label: 'Out of Warranty' }
];

const initialFormData = () => ({
    customer_id: '',
    device_type: 'Laptop',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    purchase_date: '',
    warranty_status: 'In Warranty',
    specifications: { cpu: '', ram: '', storage: '', os: '' },
    notes: ''
});

const NewCustomerModal = ({ isOpen, onClose, onCustomerCreated, getAuthHeaders }) => {
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        customer_type: 'Enterprise'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newCustomer.name.trim()) {
            setError('Customer name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const payload = {
                name: newCustomer.name.trim(),
                email: newCustomer.email.trim(),
                phone: newCustomer.phone.trim(),
                customer_type: newCustomer.customer_type
            };

            const response = await axios.post('http://localhost:5000/customers', payload, {
                headers: getAuthHeaders()
            });

            if (response.data._id) {
                onCustomerCreated(response.data);
                setNewCustomer({
                    name: '',
                    email: '',
                    phone: '',
                    customer_type: 'Enterprise'
                });
                onClose();
            }
        } catch (err) {
            console.error('Customer creation error:', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to create customer. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Customer"
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md">
                        {error}
                    </div>
                )}

                <BaseInput
                    label="Name *"
                    name="name"
                    value={newCustomer.name}
                    onChange={handleChange}
                    required
                />

                <BaseInput
                    label="Email"
                    name="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={handleChange}
                />

                <BaseInput
                    label="Phone"
                    name="phone"
                    value={newCustomer.phone}
                    onChange={handleChange}
                />

                <BaseSelectInput
                    label="Customer Type"
                    name="customer_type"
                    value={newCustomer.customer_type}
                    onChange={handleChange}
                    options={[
                        { value: 'Enterprise', label: 'Enterprise' },
                        { value: 'Personal', label: 'Personal' }
                    ]}
                />

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                    >
                        Create Customer
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const CreateDevice = ({ isOpen, onClose, onCreateDevice }) => {
    const [formData, setFormData] = useState(initialFormData());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const customerDropdownRef = useRef(null);

    const getAuthHeaders = useCallback(() => {
        const token = currentUser?.token;
        if (!token) throw new Error('Unauthorized');
        return { Authorization: `Bearer ${token}` };
    }, [currentUser]);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            resetForm();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchCustomers = async () => {
        try {
            setIsFetchingData(true);
            const response = await axios.get('http://localhost:5000/customers?all=true', {
                headers: getAuthHeaders()
            });
            setCustomers(Array.isArray(response.data) ? response.data : response.data.customers || []);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers. Please try again.');
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('specifications.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                specifications: { ...prev.specifications, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCustomerSelect = (customerId) => {
        const selectedCustomer = customers.find(c => c._id === customerId);
        setFormData(prev => ({ ...prev, customer_id: customerId }));
        setCustomerSearch(selectedCustomer?.name || '');
        setShowCustomerDropdown(false);
    };

    const handleNewCustomerCreated = (customer) => {
        fetchCustomers();
        handleCustomerSelect(customer._id);
    };

    const resetForm = useCallback(() => {
        setFormData(initialFormData());
        setError('');
        setCustomerSearch('');
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.customer_id || !formData.serial_number) {
            setError('Customer and Serial Number are required');
            return;
        }

        try {
            setLoading(true);
            const deviceData = {
                ...formData,
                purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null
            };

            const response = await axios.post('http://localhost:5000/devices/', deviceData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            if (response.data._id) {
                if (onCreateDevice) {
                    onCreateDevice(response.data);
                }
                navigate(`/${currentUser.role}Dashboard`);
                handleClose();
            } else {
                throw new Error('Device creation failed');
            }
        } catch (err) {
            console.error('Device creation error:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to create device. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleWarrantyLookup = async () => {
        if (!formData.serial_number.trim()) {
            setError('Please enter a serial number first');
            return;
        }

        try {
            setFetching(true);
            setError('');

            const response = await axios.get(
                `http://localhost:5000/devices/warranty-check/${formData.serial_number.trim()}`,
                { headers: getAuthHeaders() }
            );

            setFormData(prev => ({
                ...prev,
                manufacturer: response.data.manufacturer || prev.manufacturer,
                model_number: response.data.productName || prev.model_number,
                warranty_status: response.data.warrantyStatus || prev.warranty_status,
                purchase_date: response.data.purchaseDate ?
                    new Date(response.data.purchaseDate).toISOString().split('T')[0] :
                    prev.purchase_date,
                notes: `${prev.notes}\nWarranty End: ${response.data.warrantyEndDate}`.trim()
            }));
        } catch (err) {
            console.error('Warranty check error:', err);
            setError(
                err.response?.data?.message ||
                'Failed to check warranty status. Please verify the serial number.'
            );
        } finally {
            setFetching(false);
        }
    };
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Create New Device"
                size="xl"
            >
                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md flex items-center">
                            <FiX className="mr-2" />
                            {error}
                        </div>
                    )}

                    {isFetchingData && (
                        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-md flex items-center">
                            <FiRefreshCw className="mr-2 animate-spin" />
                            Loading customers...
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="col-span-4 md:col-span-2 relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer *</label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customerSearch ||
                                            (formData.customer_id
                                                ? customers.find(c => c._id === formData.customer_id)?.name
                                                : '')}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerDropdown(true);
                                            if (e.target.value !== '' && !customers.some(c =>
                                                c.name.toLowerCase().includes(e.target.value.toLowerCase()) &&
                                                c._id === formData.customer_id)) {
                                                setFormData(prev => ({ ...prev, customer_id: '' }));
                                            }
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        placeholder="Search customer"
                                        className="block w-full pl-3 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    />
                                    <FiSearch className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500" />
                                    {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                                        <div
                                            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-auto"
                                            ref={customerDropdownRef}
                                        >
                                            {filteredCustomers.map(customer => (
                                                <div
                                                    key={customer._id}
                                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                    onClick={() => {
                                                        handleCustomerSelect(customer._id);
                                                        setShowCustomerDropdown(false);
                                                    }}
                                                >
                                                    {customer.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    <FiPlus className="mr-1" /> Add New Customer
                                </button>
                            </div>
                        </div>
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Type</label>
                            <select
                                name="device_type"
                                value={formData.device_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {deviceTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty Status</label>
                            <select
                                name="warranty_status"
                                value={formData.warranty_status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {warrantyOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model Number</label>
                            <input
                                type="text"
                                name="model_number"
                                value={formData.model_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="col-span-4 md:col-span-1 relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number *</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleWarrantyLookup}
                                    disabled={fetching || !formData.serial_number.trim()}
                                    className="ml-1 p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Check Warranty"
                                >
                                    <FiRefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={formData.purchase_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="col-span-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPU</label>
                                <input
                                    type="text"
                                    name="specifications.cpu"
                                    value={formData.specifications.cpu}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RAM</label>
                                <input
                                    type="text"
                                    name="specifications.ram"
                                    value={formData.specifications.ram}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage</label>
                                <input
                                    type="text"
                                    name="specifications.storage"
                                    value={formData.specifications.storage}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OS</label>
                                <input
                                    type="text"
                                    name="specifications.os"
                                    value={formData.specifications.os}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="col-span-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            disabled={loading || fetching || isFetchingData}
                        >
                            {loading ? 'Creating...' : 'Create Device'}
                        </Button>
                    </div>
                </form>
            </Modal>
            <NewCustomerModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCustomerCreated={handleNewCustomerCreated}
                getAuthHeaders={getAuthHeaders}
            />
        </>
    );
};

CreateDevice.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateDevice: PropTypes.func
};

export default CreateDevice;