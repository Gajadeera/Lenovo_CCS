import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiRefreshCw, FiSave } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
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

const EditDeviceModal = ({ isOpen, onClose, deviceId, deviceData, onDeviceUpdated }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        device_type: 'Laptop',
        manufacturer: '',
        model_number: '',
        serial_number: '',
        purchase_date: '',
        warranty_status: 'In Warranty',
        specifications: { cpu: '', ram: '', storage: '', os: '' },
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [isFetchingData, setIsFetchingData] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = currentUser?.token;
        if (!token) throw new Error('Unauthorized');
        return { Authorization: `Bearer ${token}` };
    }, [currentUser]);

    useEffect(() => {
        if (!isOpen) return;

        if (deviceData) {
            setFormData({
                ...deviceData,
                purchase_date: deviceData.purchase_date?.split('T')[0] || '',
                specifications: {
                    cpu: deviceData.specifications?.cpu || '',
                    ram: deviceData.specifications?.ram || '',
                    storage: deviceData.specifications?.storage || '',
                    os: deviceData.specifications?.os || ''
                }
            });
            return;
        }

        const fetchDevice = async () => {
            try {
                setIsFetchingData(true);
                const config = { headers: getAuthHeaders() };
                const { data } = await axios.get(`http://localhost:5000/devices/${deviceId}`, config);
                setFormData({
                    ...data,
                    purchase_date: data.purchase_date?.split('T')[0] || '',
                    specifications: {
                        cpu: data.specifications?.cpu || '',
                        ram: data.specifications?.ram || '',
                        storage: data.specifications?.storage || '',
                        os: data.specifications?.os || ''
                    }
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load device');
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchDevice();
    }, [isOpen, deviceId, deviceData, currentUser, getAuthHeaders]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const config = {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            };
            const { data } = await axios.put(
                `http://localhost:5000/devices/${deviceId}`,
                formData,
                config
            );
            onDeviceUpdated?.(data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update device');
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Device - ${formData.serial_number}`}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4 dark:bg-gray-800">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        <FiX className="mr-2" size={16} />
                        {error}
                    </div>
                )}

                {isFetchingData && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-md flex items-center dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                        <FiRefreshCw className="mr-2 animate-spin" size={16} />
                        Loading device data...
                    </div>
                )}

                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Device Type</label>
                        <select
                            name="device_type"
                            value={formData.device_type}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        >
                            {deviceTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Warranty</label>
                        <select
                            name="warranty_status"
                            value={formData.warranty_status}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        >
                            {warrantyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Manufacturer</label>
                        <input
                            type="text"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>

                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Model</label>
                        <input
                            type="text"
                            name="model_number"
                            value={formData.model_number}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>

                    <div className="col-span-12 md:col-span-2 relative">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Serial #</label>
                        <div className="flex">
                            <input
                                type="text"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleChange}
                                className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={handleWarrantyLookup}
                                disabled={fetching || !formData.serial_number.trim() || loading}
                                className="ml-1 p-2 text-gray-400 hover:text-blue-600 absolute right-0 bottom-0 dark:text-gray-500 dark:hover:text-blue-400"
                                title="Check Warranty"
                            >
                                <FiRefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Purchase Date</label>
                        <input
                            type="date"
                            name="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CPU</label>
                        <input
                            type="text"
                            name="specifications.cpu"
                            value={formData.specifications.cpu}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RAM</label>
                        <input
                            type="text"
                            name="specifications.ram"
                            value={formData.specifications.ram}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Storage</label>
                        <input
                            type="text"
                            name="specifications.storage"
                            value={formData.specifications.storage}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">OS</label>
                        <input
                            type="text"
                            name="specifications.os"
                            value={formData.specifications.os}
                            onChange={handleChange}
                            className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        className="block w-full px-2 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                        disabled={loading}
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={loading}
                        disabled={loading || fetching}
                        icon={FiSave}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

EditDeviceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    deviceId: PropTypes.string.isRequired,
    deviceData: PropTypes.object,
    onDeviceUpdated: PropTypes.func
};

export default EditDeviceModal;