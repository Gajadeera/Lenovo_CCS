import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiTool, FiCalendar, FiHardDrive, FiCheckCircle,
    FiCpu, FiDatabase, FiMonitor, FiFileText, FiEdit, FiTrash2, FiX, FiUser
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import EditDeviceModal from './EditDeviceModal';
import DeleteDeviceModal from './DeleteDeviceModal';

const SingleDeviceModal = ({ isOpen, onClose, deviceId, onDeviceUpdate }) => {
    const { user: currentUser } = useAuth();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchDevice = async () => {
            if (!isOpen || !deviceId) return;

            try {
                setLoading(true);
                setError(null);

                const config = {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                };

                const response = await axios.get(`http://localhost:5000/devices/${deviceId}`, config);
                setDevice(response.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch device');
            } finally {
                setLoading(false);
            }
        };

        fetchDevice();
    }, [deviceId, currentUser, isOpen]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getWarrantyStatusColor = (status) => {
        switch (status) {
            case 'In Warranty': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Out of Warranty': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const renderCompactField = (label, value, icon) => (
        <div className="col-span-4 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
            <div className="flex items-center text-sm h-8">
                {icon && React.cloneElement(icon, { className: "text-gray-400 dark:text-gray-500 mr-1", size: 14 })}
                <span className="truncate text-gray-900 dark:text-gray-100">{value || 'N/A'}</span>
            </div>
        </div>
    );

    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    const handleDeviceUpdated = (updatedDevice) => {
        setDevice(updatedDevice);
        setShowEditModal(false);
        onDeviceUpdate?.(updatedDevice);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            };

            await axios.delete(`http://localhost:5000/devices/${deviceId}`, config);
            onClose();
            setShowDeleteModal(false);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to delete device');
            setShowDeleteModal(false);
        }
    };

    if (loading) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Device Details" size="lg">
            <div className="flex justify-center items-center h-40 text-gray-900 dark:text-gray-100">
                <div className="animate-pulse">Loading device details...</div>
            </div>
        </Modal>
    );

    if (error) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Device Details" size="lg">
            <div className="flex justify-center items-center h-40 text-red-500 dark:text-red-400 text-sm">
                <div className="flex items-center">
                    <FiX className="mr-2" />
                    {error}
                </div>
            </div>
        </Modal>
    );

    if (!device) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Device Details" size="lg">
            <div className="flex justify-center items-center h-40 text-sm text-gray-900 dark:text-gray-100">
                Device not found
            </div>
        </Modal>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Device #${device.serial_number}`} size="xl">
                <div className="p-4 space-y-3 dark:bg-gray-800">
                    {error && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            <FiX className="mr-1" size={14} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                        {renderCompactField("Serial Number", device.serial_number, <FiHardDrive />)}
                        {renderCompactField("Type", device.device_type, <FiTool />)}
                        {renderCompactField("Manufacturer", device.manufacturer, <FiTool />)}
                        {renderCompactField("Model", device.model_number, <FiHardDrive />)}
                        {renderCompactField("Customer", device.customer?.name, <FiUser />)}
                        {renderCompactField("Status", (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getWarrantyStatusColor(device.warranty_status)}`}>
                                {device.warranty_status}
                            </span>
                        ), <FiCheckCircle />)}
                        {renderCompactField("Purchase Date", formatDate(device.purchase_date), <FiCalendar />)}
                        {renderCompactField("Created", formatDate(device.createdAt), <FiCalendar />)}
                    </div>

                    <div className="border-t pt-3 mt-2 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specifications</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {renderCompactField("CPU", device.specifications?.cpu, <FiCpu />)}
                            {renderCompactField("RAM", device.specifications?.ram, <FiCpu />)}
                            {renderCompactField("Storage", device.specifications?.storage, <FiDatabase />)}
                            {renderCompactField("OS", device.specifications?.os, <FiMonitor />)}
                        </div>
                    </div>

                    {device.notes && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                            <div className="text-sm p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                {device.notes}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                        <Button
                            onClick={onClose}
                            variant="outline"
                        >
                            Close
                        </Button>
                        {(currentUser?.role === 'coordinator' || currentUser?.role === 'manager') && (
                            <>
                                <Button
                                    onClick={() => setShowEditModal(true)}
                                    icon={FiEdit}
                                >
                                    Edit Device
                                </Button>
                                <Button
                                    onClick={handleDeleteClick}
                                    variant="danger"
                                    icon={FiTrash2}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            <EditDeviceModal
                key={`edit-${deviceId}`}
                isOpen={showEditModal}
                onClose={handleEditModalClose}
                deviceId={deviceId}
                deviceData={device}
                onDeviceUpdated={handleDeviceUpdated}
            />

            <DeleteDeviceModal
                isOpen={showDeleteModal}
                onClose={handleDeleteModalClose}
                onConfirm={handleDeleteConfirm}
                deviceSerial={device.serial_number}
            />
        </>
    );
};

SingleDeviceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    deviceId: PropTypes.string.isRequired,
    onDeviceUpdate: PropTypes.func
};

export default SingleDeviceModal;