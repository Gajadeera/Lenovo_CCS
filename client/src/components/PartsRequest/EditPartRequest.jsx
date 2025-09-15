import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiUpload, FiX, FiPackage, FiAlertTriangle,
    FiFileText, FiDownload, FiTrash2, FiImage, FiFile, FiRefreshCw
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';

// Constants
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

const urgencyOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
];

const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Fulfilled', label: 'Fulfilled' }
];

const EditPartRequest = ({ isOpen, onClose, request, onUpdate, jobs }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        job_id: '',
        parts_description: '',
        urgency: 'Medium',
        notes: '',
        status: 'Pending',
        rejection_reason: ''
    });
    const [filePreviews, setFilePreviews] = useState([]);
    const [newDocuments, setNewDocuments] = useState([]);
    const [documentsToDelete, setDocumentsToDelete] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [jobSearch, setJobSearch] = useState('');
    const [isFetchingData, setIsFetchingData] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = currentUser?.token;
        if (!token) throw new Error('Unauthorized');
        return { Authorization: `Bearer ${token}` };
    }, [currentUser]);



    // Initialize form data from request
    useEffect(() => {
        const initializeData = async () => {
            if (!isOpen) return;

            // At the top of your component, add this check
            const filteredJobs = Array.isArray(jobs)
                ? jobs.filter(job =>
                    job.job_number?.toLowerCase().includes(jobSearch.toLowerCase()) ||
                    (job.customer_id?.name && job.customer_id.name.toLowerCase().includes(jobSearch.toLowerCase()))
                )
                : [];

            try {
                setIsFetchingData(true);
                setError('');

                if (request) {
                    setFormData({
                        job_id: request.job_id?._id || request.job_id || '',
                        parts_description: request.parts_description || '',
                        urgency: request.urgency || 'Medium',
                        notes: request.notes || '',
                        status: request.status || 'Pending',
                        rejection_reason: request.rejection_reason || ''
                    });

                    setJobSearch(request.job_id?.job_number || '');

                    // Handle attachments
                    if (request.attachments) {
                        const existingPreviews = request.attachments.map(attachment => ({
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
            } catch (err) {
                console.error('Error initializing data:', err);
                setError(err.response?.data?.message || 'Failed to load data');
            } finally {
                setIsFetchingData(false);
            }
        };

        initializeData();
    }, [isOpen, request, getAuthHeaders]);

    // Clean up object URLs
    useEffect(() => {
        return () => {
            filePreviews.forEach(file => {
                if (file.previewUrl && !file.isExisting) URL.revokeObjectURL(file.previewUrl);
            });
        };
    }, [filePreviews]);
    const filteredJobs = Array.isArray(jobs) ? jobs.filter(job =>
        job.job_number?.toLowerCase().includes(jobSearch.toLowerCase()) ||
        (job.customer_id?.name && job.customer_id.name.toLowerCase().includes(jobSearch.toLowerCase()))
    ) : [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleJobSelect = (jobId) => {
        const selectedJob = jobs.find(j => j._id === jobId);
        setFormData(prev => ({ ...prev, job_id: jobId }));
        setJobSearch(selectedJob ? `${selectedJob.job_number} - ${selectedJob.customer_id?.name}` : '');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.job_id || !formData.parts_description) {
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
                `http://localhost:5000/parts-requests/${request._id}`,
                formDataToSend,
                {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            onUpdate?.(response.data);
            onClose();
        } catch (err) {
            console.error('Parts request update error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update parts request');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType?.startsWith('image/')) return <FiImage className="text-blue-500" />;
        if (fileType === 'application/pdf') return <FiFile className="text-red-500" />;
        return <FiFileText className="text-gray-500" />;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Parts Request" size="xl">
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Job Section - Only show for admins/managers */}
                    {(currentUser?.role === 'administrator' || currentUser?.role === 'manager') && (
                        <div className="col-span-4 md:col-span-2 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={jobSearch}
                                    onChange={(e) => {
                                        setJobSearch(e.target.value);
                                        if (e.target.value !== '' && Array.isArray(jobs) && !jobs.some(j =>
                                            (j.job_number?.toLowerCase().includes(e.target.value.toLowerCase())) ||
                                            (j.customer_id?.name && j.customer_id.name.toLowerCase().includes(e.target.value.toLowerCase())))) {
                                            setFormData(prev => ({ ...prev, job_id: '' }));
                                        }
                                    }}
                                    placeholder="Search job by number or customer"
                                    className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                                    required
                                />
                                {jobSearch && filteredJobs.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                        {filteredJobs.map(job => (
                                            <div
                                                key={job._id}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                onClick={() => handleJobSelect(job._id)}
                                            >
                                                {job.job_number} - {job.customer_id?.name || 'Unknown Customer'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Urgency */}
                    <div className="col-span-4 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                        <select
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            required
                        >
                            {urgencyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status (only for admins/managers) */}
                    {(currentUser?.role === 'administrator' || currentUser?.role === 'manager' || currentUser?.role === 'parts_team') && (
                        <div className="col-span-4 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Rejection Reason (only when status is Rejected) */}
                    {formData.status === 'Rejected' && (
                        <div className="col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                            <input
                                type="text"
                                name="rejection_reason"
                                value={formData.rejection_reason}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                                required={formData.status === 'Rejected'}
                            />
                        </div>
                    )}

                    {/* Parts Description */}
                    <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parts Description *</label>
                        <textarea
                            name="parts_description"
                            value={formData.parts_description}
                            onChange={handleChange}
                            rows={3}
                            className="block w-full pl-3 pr-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#65C2CB] focus:border-[#1E4065] sm:text-sm bg-white text-gray-900"
                            required
                        />
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

                    {/* Attachments */}
                    <div className="col-span-4 md:col-span-3 flex items-center">
                        <label className="block text-sm font-medium text-gray-700 mr-2">Attachments:</label>
                        <label className="inline-flex items-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors">
                            <FiUpload className="mr-1" />
                            <input
                                type="file"
                                accept={ACCEPTED_FILE_TYPES.join(',')}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                disabled={filePreviews.length >= MAX_FILES || loading}
                            />
                            <span className="text-sm">Add files</span>
                        </label>
                        {filePreviews.length > 0 && (
                            <span className="ml-2 text-sm text-gray-500">
                                {filePreviews.length} file{filePreviews.length !== 1 ? 's' : ''} selected
                            </span>
                        )}
                    </div>

                    {/* File Previews */}
                    {filePreviews.length > 0 && (
                        <div className="col-span-4 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {filePreviews.map((file) => (
                                    <div key={file.id} className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200 max-w-xs">
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
                                            <span className="text-sm truncate">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="text-gray-400 hover:text-red-500"
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
                    >
                        Update Request
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

EditPartRequest.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    request: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    jobs: PropTypes.array.isRequired
};

export default EditPartRequest;