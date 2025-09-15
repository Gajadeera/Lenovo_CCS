import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiX, FiUser, FiTool, FiCalendar, FiClipboard,
    FiPackage, FiFile, FiDownload, FiEdit, FiTrash2, FiShoppingCart
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import EditJobModal from './EditJobModal';
import DeleteJobModal from './DeleteJobModal';
import TechnicianEditJobModal from './TechnicianEditJobModal';
import PartsRequestModal from '../PartsRequest/PartsRequestModal';

const ViewJobModal = ({ isOpen, onClose, jobId }) => {
    const { user: currentUser } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [partsRequests, setPartsRequests] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPartsRequestModal, setShowPartsRequestModal] = useState(false);

    const fetchData = async () => {
        if (!isOpen || !jobId) return;

        try {
            setLoading(true);
            setError(null);
            const config = { headers: { 'Authorization': `Bearer ${currentUser?.token}` } };

            const [jobRes, partsRes] = await Promise.all([
                axios.get(`http://localhost:5000/jobs/${jobId}`, config),
                axios.get(`http://localhost:5000/parts-requests/job/${jobId}`, config)
            ]);

            const jobData = jobRes.data?.data;
            if (!jobData) throw new Error('Invalid job response');

            setJob(jobData);
            setPartsRequests(partsRes.data?.success ?
                (Array.isArray(partsRes.data.data) ? partsRes.data.data : [partsRes.data.data]) : []);

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch job data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [jobId, currentUser, isOpen]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    const handleJobUpdated = (updatedJob) => {
        fetchData();
        setShowEditModal(false);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        try {
            const config = { headers: { 'Authorization': `Bearer ${currentUser?.token}` } };
            await axios.delete(`http://localhost:5000/jobs/${jobId}`, config);
            onClose();
            setShowDeleteModal(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to delete job');
            setShowDeleteModal(false);
        }
    };

    const handleCreatePartRequest = () => {
        setShowPartsRequestModal(true);
    };

    const handlePartRequestCreated = (newRequest) => {
        const config = { headers: { 'Authorization': `Bearer ${currentUser?.token}` } };
        axios.get(`http://localhost:5000/parts-requests/job/${jobId}`, config)
            .then(partsRes => {
                setPartsRequests(partsRes.data?.success ?
                    (Array.isArray(partsRes.data.data) ? partsRes.data.data : [partsRes.data.data]) : []);
            })
            .catch(err => {
                console.error('Failed to refresh parts requests:', err);
            });

        setShowPartsRequestModal(false);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const renderCompactField = (label, value, icon, badgeType = null) => (
        <div className="col-span-4 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
            <div className="flex items-center text-sm h-8">
                {icon && React.cloneElement(icon, { className: "text-gray-400 dark:text-gray-500 mr-1", size: 14 })}
                {badgeType === 'status' ? (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
                        {value || 'N/A'}
                    </span>
                ) : badgeType === 'priority' ? (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(value)}`}>
                        {value || 'N/A'}
                    </span>
                ) : (
                    <span className="truncate text-gray-900 dark:text-gray-100">{value || 'N/A'}</span>
                )}
            </div>
        </div>
    );

    if (loading) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
            <div className="flex justify-center items-center h-40 text-gray-900 dark:text-gray-100">
                <div className="animate-pulse">Loading job details...</div>
            </div>
        </Modal>
    );

    if (error) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
            <div className="flex justify-center items-center h-40 text-red-500 dark:text-red-400 text-sm">
                <div className="flex items-center">
                    <FiX className="mr-2" />
                    {error}
                </div>
            </div>
        </Modal>
    );

    if (!job) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
            <div className="flex justify-center items-center h-40 text-sm text-gray-900 dark:text-gray-100">
                Job not found
            </div>
        </Modal>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Job #${job.job_number}`} size="wide-sm">
                <div className="p-4 space-y-4 dark:bg-gray-800">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            <FiX className="mr-2" size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-4">
                        {renderCompactField("Customer", job.customer?.name, <FiUser />)}
                        {renderCompactField("Device", job.device ? `${job.device.manufacturer} ${job.device.model_number}` : 'N/A', <FiTool />)}
                        {renderCompactField("Serial", job.serial_number)}
                        {renderCompactField("Status", job.status, null, 'status')}
                        {renderCompactField("Type", job.job_type ? job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1) : 'N/A')}
                        {renderCompactField("Priority", job.priority, null, 'priority')}
                        {renderCompactField("Assigned To", job.assigned_to?.name || 'Unassigned', <FiUser />)}
                        {renderCompactField("Created", formatDate(job.createdAt), <FiCalendar />)}

                        {/* Parts Requests and Warranty in the same row */}
                        <div className="col-span-4 sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Parts Requests ({partsRequests.length})
                            </label>
                            <div className="text-sm h-8 flex items-center text-gray-900 dark:text-gray-100">
                                {partsRequests.length > 0 ? (
                                    <span>{partsRequests.length} request(s) submitted</span>
                                ) : (
                                    <span>No parts requests</span>
                                )}
                            </div>
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Warranty</label>
                            <div className="text-sm h-8 flex items-center text-gray-900 dark:text-gray-100">
                                {job.warranty_status || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Description in a single full-width row */}
                    <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                        <div className="text-sm p-3 bg-gray-50 rounded-md border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                            {job.description || 'No description provided'}
                        </div>
                    </div>

                    {job.attachments?.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Attachments ({job.attachments.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {job.attachments.map((file, i) => (
                                    <a
                                        key={i}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="text-xs p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 flex items-center transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-gray-200"
                                    >
                                        <FiFile className="mr-1" size={12} />
                                        <span className="truncate max-w-[120px]">{file.name || `File ${i + 1}`}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                        {(currentUser?.role === 'technician' && job.assigned_to?._id === currentUser.id) && (
                            <Button
                                onClick={handleCreatePartRequest}
                                icon={FiShoppingCart}
                            >
                                Request Parts
                            </Button>
                        )}
                        {(currentUser?.role === 'administrator' ||
                            currentUser?.role === 'manager' ||
                            currentUser?.role === 'coordinator' ||
                            (currentUser?.role === 'technician' && job.assigned_to?._id === currentUser.id)) && (
                                <Button
                                    onClick={handleEditClick}
                                    icon={FiEdit}
                                >
                                    Edit Job
                                </Button>
                            )}
                        {currentUser?.role === 'manager' && (
                            <Button
                                onClick={handleDeleteClick}
                                variant="danger"
                                icon={FiTrash2}
                            >
                                Delete Job
                            </Button>
                        )}
                        <Button
                            onClick={onClose}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {currentUser?.role === 'technician' ? (
                <TechnicianEditJobModal
                    isOpen={showEditModal}
                    onClose={handleEditModalClose}
                    jobId={jobId}
                    jobData={job}
                    onJobUpdated={handleJobUpdated}
                />
            ) : (
                <EditJobModal
                    isOpen={showEditModal}
                    onClose={handleEditModalClose}
                    jobId={jobId}
                    jobData={job}
                    onJobUpdated={handleJobUpdated}
                />
            )}

            <DeleteJobModal
                isOpen={showDeleteModal}
                onClose={handleDeleteModalClose}
                onConfirm={handleDeleteConfirm}
                jobNumber={job.job_number}
            />

            <PartsRequestModal
                isOpen={showPartsRequestModal}
                onClose={() => setShowPartsRequestModal(false)}
                onSubmit={handlePartRequestCreated}
                jobId={jobId}
                jobDetails={{
                    job_number: job.job_number,
                    device: job.device ? `${job.device.manufacturer} ${job.device.model_number}` : 'N/A',
                    serial_number: job.serial_number,
                    description: job.description
                }}
                currentUser={currentUser}
            />
        </>
    );
};

ViewJobModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    jobId: PropTypes.string.isRequired
};

export default ViewJobModal;