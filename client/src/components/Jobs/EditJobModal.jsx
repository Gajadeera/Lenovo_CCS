import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiUpload, FiX, FiTool, FiClipboard,
    FiCalendar, FiUser, FiFile,
    FiPaperclip, FiImage, FiRefreshCw,
    FiPlus, FiSearch, FiSave
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';


const ACCEPTED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' }
];

const jobTypeOptions = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'remote', label: 'Remote' }
];

const warrantyStatusOptions = [
    { value: 'In Warranty', label: 'In Warranty' },
    { value: 'Out of Warranty', label: 'Out of Warranty' }
];

const statusOptions = [
    { value: 'Pending Assignment', label: 'Pending Assignment' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Awaiting Workshop Repair', label: 'Awaiting Workshop Repair' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Reopened', label: 'Reopened' }
];


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


const NewDeviceModal = ({ isOpen, onClose, onDeviceCreated, getAuthHeaders, customerId }) => {
    const [newDevice, setNewDevice] = useState({
        model_number: '',
        serial_number: '',
        manufacturer: '',
        device_type: 'other'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewDevice(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newDevice.model_number.trim() || !newDevice.serial_number.trim()) {
            setError('Model number and serial number are required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const payload = {
                model_number: newDevice.model_number.trim(),
                serial_number: newDevice.serial_number.trim(),
                manufacturer: newDevice.manufacturer.trim(),
                device_type: newDevice.device_type,
                ...(customerId && { customer: customerId })
            };

            const response = await axios.post('http://localhost:5000/devices', payload, {
                headers: getAuthHeaders()
            });

            if (response.data._id) {
                onDeviceCreated(response.data);
                setNewDevice({
                    model_number: '',
                    serial_number: '',
                    manufacturer: '',
                    device_type: 'other'
                });
                onClose();
            }
        } catch (err) {
            console.error('Device creation error:', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to create device. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Device"
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md">
                        {error}
                    </div>
                )}

                <BaseInput
                    label="Model Number *"
                    name="model_number"
                    value={newDevice.model_number}
                    onChange={handleChange}
                    required
                />

                <BaseInput
                    label="Serial Number *"
                    name="serial_number"
                    value={newDevice.serial_number}
                    onChange={handleChange}
                    required
                />

                <BaseInput
                    label="Manufacturer"
                    name="manufacturer"
                    value={newDevice.manufacturer}
                    onChange={handleChange}
                />

                <BaseSelectInput
                    label="Device Type"
                    name="device_type"
                    value={newDevice.device_type}
                    onChange={handleChange}
                    options={[
                        { value: 'Laptop', label: 'Laptop' },
                        { value: 'Desktop', label: 'Desktop' },
                        { value: 'Server', label: 'Server' },
                        { value: 'Other', label: 'Other' }
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
                        Create Device
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// Main EditJobModal Component
const EditJobModal = ({ isOpen, onClose, jobId, jobData: initialJobData, onJobUpdated }) => {
    const [formData, setFormData] = useState({
        customer_id: '',
        serial_number: '',
        device_id: '',
        description: '',
        priority: 'Medium',
        job_type: 'onsite',
        status: 'Pending Assignment',
        assigned_to: '',
        scheduled_date: '',
        warranty_status: 'In Warranty'
    });
    const [filePreviews, setFilePreviews] = useState([]);
    const [newDocuments, setNewDocuments] = useState([]);
    const [documentsToDelete, setDocumentsToDelete] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [deviceSearch, setDeviceSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
    const customerDropdownRef = useRef(null);
    const deviceDropdownRef = useRef(null);
    const { user: currentUser } = useAuth();

    const getAuthHeaders = useCallback(() => {
        const token = currentUser?.token;
        if (!token) throw new Error('Unauthorized');
        return { Authorization: `Bearer ${token}` };
    }, [currentUser]);

    // Initialize form data from initialJobData or fetch fresh data
    useEffect(() => {
        const initializeData = async () => {
            if (!isOpen) return;

            try {
                setIsFetchingData(true);
                setError('');

                if (initialJobData) {
                    // Use the passed-in job data
                    const jobData = initialJobData;

                    // Set form data
                    const newFormData = {
                        customer_id: jobData.customer?._id || '',
                        serial_number: jobData.serial_number || '',
                        device_id: jobData.device?._id || '',
                        description: jobData.description || '',
                        priority: jobData.priority || 'Medium',
                        job_type: jobData.job_type || 'onsite',
                        status: jobData.status || 'Pending Assignment',
                        assigned_to: jobData.assigned_to?._id || '',
                        scheduled_date: jobData.scheduled_date ?
                            new Date(jobData.scheduled_date).toISOString().slice(0, 16) : '',
                        warranty_status: jobData.warranty_status || 'In Warranty'
                    };

                    setFormData(newFormData);
                    setCustomerSearch(jobData.customer?.name || '');
                    setDeviceSearch(jobData.device ? `${jobData.device.model_number} (${jobData.device.serial_number})` : '');

                    // Handle attachments
                    if (jobData.attachments) {
                        const existingPreviews = jobData.attachments.map(attachment => ({
                            id: attachment.public_id || attachment._id,
                            public_id: attachment.public_id,
                            name: attachment.name || attachment.originalname,
                            type: attachment.type || attachment.mimetype,
                            size: attachment.size || 0,
                            previewUrl: attachment.url,
                            isExisting: true
                        }));
                        setFilePreviews(existingPreviews);
                    }
                }

                // Always fetch customers, devices, and technicians
                const [customersRes, devicesRes, techniciansRes] = await Promise.all([
                    axios.get('http://localhost:5000/customers?all=true', { headers: getAuthHeaders() }),
                    axios.get('http://localhost:5000/devices?all=true', { headers: getAuthHeaders() }),
                    axios.get('http://localhost:5000/users?role=technician', { headers: getAuthHeaders() })
                ]);

                setCustomers(customersRes.data);
                setDevices(devicesRes.data);
                setTechnicians(techniciansRes.data.users || []);

            } catch (err) {
                console.error('Error initializing data:', err);
                setError(err.response?.data?.message || 'Failed to load data');
            } finally {
                setIsFetchingData(false);
            }
        };

        initializeData();
    }, [isOpen, jobId, initialJobData, getAuthHeaders]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
            if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(event.target)) {
                setShowDeviceDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Clean up object URLs
    useEffect(() => {
        return () => {
            filePreviews.forEach(file => {
                if (file.previewUrl && !file.isExisting) URL.revokeObjectURL(file.previewUrl);
            });
        };
    }, [filePreviews]);

    // Filter options based on search
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const filteredDevices = devices.filter(device =>
        device.model_number.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(deviceSearch.toLowerCase())
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerSelect = (customerId) => {
        const selectedCustomer = customers.find(c => c._id === customerId);
        setFormData(prev => ({ ...prev, customer_id: customerId }));
        setCustomerSearch(selectedCustomer?.name || '');
        setShowCustomerDropdown(false);
    };

    const handleDeviceSelect = (deviceId) => {
        const selectedDevice = devices.find(d => d._id === deviceId);
        setFormData(prev => ({
            ...prev,
            device_id: deviceId,
            serial_number: selectedDevice?.serial_number || prev.serial_number,
            warranty_status: selectedDevice?.warranty_status || prev.warranty_status
        }));
        setDeviceSearch(selectedDevice ? `${selectedDevice.model_number} (${selectedDevice.serial_number})` : '');
        setShowDeviceDropdown(false);
    };

    const handleNewCustomerCreated = (customer) => {
        // Refresh customers list
        fetchAllData();
        // Select the newly created customer
        handleCustomerSelect(customer._id);
    };

    const handleNewDeviceCreated = (device) => {
        // Refresh devices list
        fetchAllData();
        // Select the newly created device
        handleDeviceSelect(device._id);
    };

    const fetchAllData = async () => {
        try {
            setIsFetchingData(true);
            const [customersRes, devicesRes, techniciansRes] = await Promise.all([
                axios.get('http://localhost:5000/customers?all=true', { headers: getAuthHeaders() }),
                axios.get('http://localhost:5000/devices?all=true', { headers: getAuthHeaders() }),
                axios.get('http://localhost:5000/users?role=technician', { headers: getAuthHeaders() })
            ]);
            setCustomers(customersRes.data);
            setDevices(devicesRes.data);
            setTechnicians(techniciansRes.data.users || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load required data. Please try again.');
            setTechnicians([]);
        } finally {
            setIsFetchingData(false);
        }
    };

    const validateFile = (file) => {
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            throw new Error(`File type not supported: ${file.name}`);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File too large (max 5MB): ${file.name}`);
        }
        return true;
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            files.forEach(validateFile);
            const totalFiles = filePreviews.length - documentsToDelete.length + files.length;
            if (totalFiles > MAX_FILES) {
                throw new Error(`Maximum ${MAX_FILES} documents allowed`);
            }

            const newPreviews = files.map(file => ({
                id: URL.createObjectURL(file),
                name: file.name,
                type: file.type,
                size: file.size,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                isNew: true
            }));

            setNewDocuments(prev => [...prev, ...files]);
            setFilePreviews(prev => [...prev, ...newPreviews]);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const removeFile = useCallback((id) => {
        setFilePreviews(prev => {
            const fileIndex = prev.findIndex(file => file.id === id);
            if (fileIndex === -1) return prev;

            const fileToRemove = prev[fileIndex];
            const newPreviews = [...prev];

            if (fileToRemove.isExisting) {
                setDocumentsToDelete(prevDeletes => [...prevDeletes, fileToRemove.public_id]);
            } else {
                setNewDocuments(prevFiles =>
                    prevFiles.filter((_, i) => i !== newPreviews.findIndex(f => f.id === id && f.isNew))
                );
                if (fileToRemove.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
            }

            newPreviews.splice(fileIndex, 1);
            return newPreviews;
        });
    }, [documentsToDelete.length]);

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
                warranty_status: response.data.warrantyStatus || prev.warranty_status,
                device_id: response.data.productName || prev.device_id
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.customer_id || !formData.serial_number || !formData.description) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    formDataToSend.append(key, value);
                }
            });

            newDocuments.forEach(file => formDataToSend.append('documents', file));
            if (documentsToDelete.length > 0) {
                formDataToSend.append('documents_to_delete', JSON.stringify(documentsToDelete));
            }

            const response = await axios.put(
                `http://localhost:5000/jobs/${jobId}`,
                formDataToSend,
                {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            onJobUpdated?.(response.data);
            onClose();
        } catch (err) {
            console.error('Job update error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update job');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType?.startsWith('image/')) return <FiImage className="text-blue-500 dark:text-blue-400" />;
        if (fileType === 'application/pdf') return <FiFile className="text-red-500 dark:text-red-400" />;
        return <FiPaperclip className="text-gray-500 dark:text-gray-400" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Edit Job"
                size="2xl"
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
                            Loading data...
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Customer Section */}
                        <div className="col-span-4 md:col-span-1 relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer *</label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customerSearch}
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

                        {/* Serial Number */}
                        <div className="col-span-4 md:col-span-1 relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number *</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                    className="block w-full pl-3 pr-8 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

                        {/* Device Section */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device</label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={deviceSearch}
                                        onChange={(e) => {
                                            setDeviceSearch(e.target.value);
                                            setShowDeviceDropdown(true);
                                            if (e.target.value !== '' && !devices.some(d =>
                                                (d.model_number.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                                    d.serial_number.toLowerCase().includes(e.target.value.toLowerCase())) &&
                                                d._id === formData.device_id)) {
                                                setFormData(prev => ({ ...prev, device_id: '' }));
                                            }
                                        }}
                                        onFocus={() => setShowDeviceDropdown(true)}
                                        placeholder="Search device"
                                        className="block w-full pl-3 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <FiSearch className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500" />
                                    {showDeviceDropdown && deviceSearch && filteredDevices.length > 0 && (
                                        <div
                                            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md border border-gray-300 dark:border-gray-600 max-h-60 overflow-auto"
                                            ref={deviceDropdownRef}
                                        >
                                            {filteredDevices.map(device => (
                                                <div
                                                    key={device._id}
                                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                    onClick={() => {
                                                        handleDeviceSelect(device._id);
                                                        setShowDeviceDropdown(false);
                                                    }}
                                                >
                                                    {device.model_number} ({device.serial_number})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowDeviceModal(true)}
                                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    <FiPlus className="mr-1" /> Add New Device
                                </button>
                            </div>
                        </div>

                        {/* Warranty */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty</label>
                            <select
                                name="warranty_status"
                                value={formData.warranty_status}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {warrantyStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Job Type */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Type *</label>
                            <select
                                name="job_type"
                                value={formData.job_type}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            >
                                {jobTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Technician Dropdown */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technician</label>
                            <select
                                name="assigned_to"
                                value={formData.assigned_to || ''}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                disabled={isFetchingData}
                            >
                                <option value="">Unassigned</option>
                                {Array.isArray(technicians) && technicians.map(tech => (
                                    <option key={tech._id} value={tech._id}>{tech.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Scheduled Date */}
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled Date</label>
                            <input
                                type="datetime-local"
                                name="scheduled_date"
                                value={formData.scheduled_date}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Attachments */}
                        <div className="col-span-4 md:col-span-3 flex items-center">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Attachments:</label>
                            <label className="inline-flex items-center p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                                <FiUpload className="mr-1" />
                                <input
                                    type="file"
                                    accept={ACCEPTED_FILE_TYPES.join(',')}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    multiple
                                    disabled={filePreviews.length >= MAX_FILES || loading}
                                />
                                <span className="text-sm dark:text-white">Add files</span>
                            </label>
                            {filePreviews.length > 0 && (
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                    {filePreviews.length} file{filePreviews.length !== 1 ? 's' : ''} selected
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="col-span-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            />
                        </div>

                        {/* File Previews */}
                        {filePreviews.length > 0 && (
                            <div className="col-span-4 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {filePreviews.map((file) => (
                                        <div key={file.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 max-w-xs">
                                            <div className="flex items-center space-x-2 truncate">
                                                {file.previewUrl ? (
                                                    <img
                                                        src={file.previewUrl}
                                                        alt={`Preview ${file.name}`}
                                                        className="h-6 w-6 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="h-6 w-6 flex items-center justify-center">
                                                        {getFileIcon(file.type)}
                                                    </div>
                                                )}
                                                <span className="text-sm truncate dark:text-white">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(file.id)}
                                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                                    disabled={loading}
                                                    aria-label="Remove file"
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 mt-4">
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
                            disabled={loading || fetching || isFetchingData}
                            icon={FiSave}
                        >
                            {loading ? 'Updating...' : 'Update Job'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* New Customer Modal */}
            <NewCustomerModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCustomerCreated={handleNewCustomerCreated}
                getAuthHeaders={getAuthHeaders}
            />

            {/* New Device Modal */}
            <NewDeviceModal
                isOpen={showDeviceModal}
                onClose={() => setShowDeviceModal(false)}
                onDeviceCreated={handleNewDeviceCreated}
                getAuthHeaders={getAuthHeaders}
                customerId={formData.customer_id}
            />
        </>
    );
};

EditJobModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    jobId: PropTypes.string.isRequired,
    jobData: PropTypes.object,
    onJobUpdated: PropTypes.func
};

export default EditJobModal;