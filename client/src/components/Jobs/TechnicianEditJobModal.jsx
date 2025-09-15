import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiX, FiTool, FiRefreshCw, FiSave
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';

const statusOptions = [
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Awaiting Workshop Repair', label: 'Awaiting Workshop Repair' },
    { value: 'Closed', label: 'Closed' }
];

const jobTypeOptions = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'remote', label: 'Remote' }
];

const TechnicianEditJobModal = ({ isOpen, onClose, jobId, jobData: initialJobData, onJobUpdated }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        serial_number: '',
        device_id: '',
        status: 'Assigned',
        job_type: 'onsite'
    });
    const [devices, setDevices] = useState([]);
    const [deviceSearch, setDeviceSearch] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);

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
                    // Use the passed-in job data but only keep allowed fields
                    const jobData = initialJobData;
                    setFormData({
                        serial_number: jobData.serial_number || '',
                        device_id: jobData.device?._id || '',
                        status: jobData.status || 'Assigned',
                        job_type: jobData.job_type || 'onsite'
                    });
                    setDeviceSearch(jobData.device ? `${jobData.device.model_number} (${jobData.device.serial_number})` : '');
                }

                // Fetch devices
                const devicesRes = await axios.get('http://localhost:5000/devices', {
                    headers: getAuthHeaders()
                });
                setDevices(devicesRes.data.devices || devicesRes.data);

            } catch (err) {
                console.error('Error initializing data:', err);
                setError(err.response?.data?.message || 'Failed to load data');
            } finally {
                setIsFetchingData(false);
            }
        };

        initializeData();
    }, [isOpen, jobId, initialJobData, getAuthHeaders]);

    const filteredDevices = devices.filter(device =>
        device.model_number.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(deviceSearch.toLowerCase())
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDeviceSelect = (deviceId) => {
        const selectedDevice = devices.find(d => d._id === deviceId);
        setFormData(prev => ({
            ...prev,
            device_id: deviceId,
            serial_number: selectedDevice?.serial_number || prev.serial_number
        }));
        setDeviceSearch(selectedDevice ? `${selectedDevice.model_number} (${selectedDevice.serial_number})` : '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.serial_number) {
            setError('Serial number is required');
            return;
        }

        try {
            setLoading(true);

            // Only send the fields technicians are allowed to edit
            const payload = {
                serial_number: formData.serial_number,
                device_id: formData.device_id,
                status: formData.status,
                job_type: formData.job_type
            };

            const response = await axios.put(
                `http://localhost:5000/jobs/${jobId}`,
                payload,
                { headers: getAuthHeaders() }
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Job" size="md">
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
                        Loading data...
                    </div>
                )}

                <div className="space-y-4">
                    {/* Serial Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                        <input
                            type="text"
                            name="serial_number"
                            value={formData.serial_number}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            required
                        />
                    </div>

                    {/* Device Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={deviceSearch}
                                    onChange={(e) => {
                                        setDeviceSearch(e.target.value);
                                        if (e.target.value !== '' && !devices.some(d =>
                                            (d.model_number.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                                d.serial_number.toLowerCase().includes(e.target.value.toLowerCase())) &&
                                            d._id === formData.device_id)) {
                                            setFormData(prev => ({ ...prev, device_id: '' }));
                                        }
                                    }}
                                    placeholder="Search device"
                                    className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                                />
                                {deviceSearch && filteredDevices.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                        {filteredDevices.map(device => (
                                            <div
                                                key={device._id}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                onClick={() => handleDeviceSelect(device._id)}
                                            >
                                                {device.model_number} ({device.serial_number})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            required
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Job Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                        <select
                            name="job_type"
                            value={formData.job_type}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            required
                        >
                            {jobTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 mt-6">
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
                        Update Job
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

TechnicianEditJobModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    jobId: PropTypes.string.isRequired,
    jobData: PropTypes.object,
    onJobUpdated: PropTypes.func
};

export default TechnicianEditJobModal;