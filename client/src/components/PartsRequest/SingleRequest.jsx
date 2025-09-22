import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiX, FiUser, FiPackage, FiCalendar, FiFileText,
    FiAlertTriangle, FiCheckCircle, FiClock, FiDownload,
    FiEdit, FiTrash2, FiImage, FiFile
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import EditPartRequest from './EditPartRequest';

const SingleRequestModal = ({ isOpen, onClose, requestId, onRequestUpdate }) => {
    const { user: currentUser } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const fetchRequestAndJobs = async () => {
            if (!isOpen || !requestId) return;

            try {
                setLoading(true);
                setError(null);
                const config = { headers: { 'Authorization': `Bearer ${currentUser?.token}` } };

                const [requestRes, jobsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/parts-requests/${requestId}`, config),
                    axios.get('http://localhost:5000/jobs?all=true', config)
                ]);

                setRequest(requestRes.data?.data);
                setJobs(jobsRes.data?.jobs || []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch request data');
            } finally {
                setLoading(false);
            }
        };

        fetchRequestAndJobs();
    }, [requestId, currentUser, isOpen]);

    const handleUpdateRequest = (updatedRequest) => {
        setRequest(updatedRequest);
        setShowEditModal(false);
        if (onRequestUpdate) {
            onRequestUpdate(updatedRequest);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Approved': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
            'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            'Rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
            'Fulfilled': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
        };
        return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'High': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
            'Medium': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            'Low': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
        };
        return colors[priority] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    };

    const getFileIcon = (fileType) => {
        if (!fileType) return <FiFile className="text-gray-500 dark:text-gray-400" />;
        if (fileType.includes('image')) return <FiImage className="text-blue-500 dark:text-blue-400" />;
        if (fileType.includes('pdf')) return <FiFileText className="text-red-500 dark:text-red-400" />;
        if (fileType.includes('word')) return <FiFileText className="text-blue-600 dark:text-blue-400" />;
        return <FiFile className="text-gray-500 dark:text-gray-400" />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const formatPartsDescription = (description) => {
        if (!description) return 'No description provided';
        return description.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    const renderCompactField = (label, value, icon) => (
        <div className="col-span-4 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
            <div className="flex items-center text-sm h-8">
                {icon && React.cloneElement(icon, { className: "text-gray-400 dark:text-gray-500 mr-1", size: 14 })}
                <span className="truncate text-gray-900 dark:text-white">{value || 'N/A'}</span>
            </div>
        </div>
    );

    if (loading) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Parts Request Details" size="lg">
            <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">Loading...</div>
        </Modal>
    );

    if (error) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Parts Request Details" size="lg">
            <div className="flex justify-center items-center h-40 text-red-500 dark:text-red-400 text-sm">{error}</div>
        </Modal>
    );

    if (!request) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Parts Request Details" size="lg">
            <div className="flex justify-center items-center h-40 text-sm text-gray-500 dark:text-gray-400">Request not found</div>
        </Modal>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Parts Request #${request.request_number || requestId}`} size="xl">
                <div className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md flex items-center">
                            <FiX className="mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-3">
                        {renderCompactField("Status",
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                            </span>,
                            <FiPackage />
                        )}
                        {renderCompactField("Priority",
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(request.urgency)}`}>
                                {request.urgency}
                            </span>,
                            <FiAlertTriangle />
                        )}
                        {renderCompactField("Job", request.job_id?.job_number || 'N/A', <FiFileText />)}
                        {renderCompactField("Requested By", request.requested_by?.name || 'N/A', <FiUser />)}
                        {renderCompactField("Request Date", formatDate(request.requested_at), <FiCalendar />)}
                        {request.approved_by && renderCompactField(
                            request.status === 'Rejected' ? 'Rejected By' : 'Approved By',
                            request.approved_by?.name || 'System',
                            <FiCheckCircle />
                        )}
                        {request.approved_at && renderCompactField(
                            request.status === 'Rejected' ? 'Rejected Date' : 'Approved Date',
                            formatDate(request.approved_at),
                            <FiCalendar />
                        )}
                        {renderCompactField("Last Updated", formatDate(request.updated_at), <FiClock />)}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Parts Description</label>
                        <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                            {formatPartsDescription(request.parts_description)}
                        </div>
                    </div>

                    {request.notes && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Technician Notes</label>
                            <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                {request.notes}
                            </div>
                        </div>
                    )}

                    {request.rejection_reason && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rejection Reason</label>
                            <div className="text-sm p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300">
                                {request.rejection_reason}
                            </div>
                        </div>
                    )}

                    {request.attachments?.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Attachments ({request.attachments.length})
                            </label>
                            <div className="space-y-2">
                                {request.attachments.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center">
                                            <div className="mr-3">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name || `Attachment ${i + 1}`}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {file.type} • {formatDate(file.uploaded_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                                            download
                                        >
                                            <FiDownload size={16} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {request.attachments?.some(f => f.type?.includes('image')) && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Images
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {request.attachments
                                    .filter(f => f.type?.includes('image'))
                                    .map((img, i) => (
                                        <div
                                            key={i}
                                            className="relative aspect-square cursor-pointer group"
                                            onClick={() => setZoomedImage(img.url)}
                                        >
                                            <img
                                                src={img.url}
                                                className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600 group-hover:opacity-90 transition-opacity"
                                                alt={img.name || `Request image ${i + 1}`}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/placeholder-image.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-md" />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                        {(currentUser?.role === 'administrator' ||
                            currentUser?.role === 'manager' ||
                            currentUser?.role === 'parts_team' ||
                            (currentUser?.role === 'technician' && currentUser?._id === request.requested_by?._id)) && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setShowEditModal(true)}
                                    icon={FiEdit}
                                >
                                    Edit Request
                                </Button>
                            )}
                    </div>
                </div>
            </Modal>

            <EditPartRequest
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onUpdate={handleUpdateRequest}
                jobs={jobs}
                currentUser={currentUser}
                request={request}
            />

            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"
                            onClick={() => setZoomedImage(null)}
                        >
                            <FiX size={24} />
                        </button>
                        <img
                            src={zoomedImage}
                            className="max-w-[80vw] max-h-[80vh] object-contain rounded-md"
                            alt="Zoomed request view"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

SingleRequestModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    requestId: PropTypes.string.isRequired,
    onRequestUpdate: PropTypes.func
};

export default SingleRequestModal;