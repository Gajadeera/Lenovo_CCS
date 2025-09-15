import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    FiX, FiCalendar, FiHardDrive, FiMonitor,
    FiUser, FiTool, FiCpu, FiRefreshCw
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

const CreateDevice = ({ isOpen, onClose, onCreateDevice }) => {
    const [formData, setFormData] = useState(initialFormData());
    const [customers, setCustomers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const dropdownRef = useRef(null);

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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

    // Filter customers based on search
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Device"
            size="xl"
        >
            <form onSubmit={handleSubmit} className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                        <FiX className="mr-2" />
                        {error}
                    </div>
                )}

                {isFetchingData && (
                    <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md flex items-center">
                        <FiRefreshCw className="mr-2 animate-spin" />
                        Loading customers...
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
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
                                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                placeholder="Search customer"
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"

                            />
                            {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                                <div
                                    className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto"
                                    ref={dropdownRef}
                                >
                                    {filteredCustomers.map(customer => (
                                        <div
                                            key={customer._id}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => {
                                                handleCustomerSelect(customer._id);
                                                setCustomerSearch(customer.name);
                                                setShowCustomerDropdown(false);
                                            }}
                                        >
                                            {customer.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Device Type */}
                    <div className="col-span-4 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                        <select
                            name="device_type"
                            value={formData.device_type}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                        >
                            {deviceTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Warranty Status */}
                    <div className="col-span-4 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Status</label>
                        <select
                            name="warranty_status"
                            value={formData.warranty_status}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                        >
                            {warrantyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Manufacturer */}
                    <div className="col-span-4 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                        <input
                            type="text"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                        />
                    </div>

                    {/* Model Number */}
                    <div className="col-span-4 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                        <input
                            type="text"
                            name="model_number"
                            value={formData.model_number}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                        />
                    </div>

                    {/* Serial Number */}
                    <div className="col-span-4 md:col-span-1 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                        <div className="flex">
                            <input
                                type="text"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-8 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleWarrantyLookup}
                                disabled={fetching || !formData.serial_number.trim()}
                                className="ml-1 p-2 text-gray-500 hover:text-blue-600"
                                title="Check Warranty"
                            >
                                <FiRefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Purchase Date */}
                    <div className="col-span-4 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                        <input
                            type="date"
                            name="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                        />
                    </div>

                    {/* Specifications */}
                    <div className="col-span-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPU</label>
                            <input
                                type="text"
                                name="specifications.cpu"
                                value={formData.specifications.cpu}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
                            <input
                                type="text"
                                name="specifications.ram"
                                value={formData.specifications.ram}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
                            <input
                                type="text"
                                name="specifications.storage"
                                value={formData.specifications.storage}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">OS</label>
                            <input
                                type="text"
                                name="specifications.os"
                                value={formData.specifications.os}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={2}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                        />
                    </div>
                </div>

                {/* Form Actions */}
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
    );
};

CreateDevice.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateDevice: PropTypes.func
};

export default CreateDevice;