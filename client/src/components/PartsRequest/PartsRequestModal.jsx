import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiPackage, FiUpload, FiAlertTriangle, FiClock, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';

const PartsRequestModal = ({ isOpen, onClose, onSubmit, jobId, jobDetails, currentUser }) => {
    const [partsDescription, setPartsDescription] = useState('');
    const [urgency, setUrgency] = useState('Medium');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('job_id', jobId);
            formData.append('parts_description', partsDescription);
            formData.append('urgency', urgency);
            if (notes) formData.append('notes', notes);

            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const config = {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const response = await axios.post(
                'http://localhost:5000/parts-requests',
                formData,
                config
            );

            onSubmit(response.data);
            onClose();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to submit parts request');
            console.error('Error submitting parts request:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeAttachment = (index) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const resetForm = () => {
        setPartsDescription('');
        setUrgency('Medium');
        setNotes('');
        setAttachments([]);
        setError(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Parts Request" size="md">
            <div className="p-4">
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-800">Job #{jobDetails.job_number}</p>
                    <p className="text-sm text-gray-600">{jobDetails.device} (SN: {jobDetails.serial_number || 'N/A'})</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parts Description *
                        </label>
                        <textarea
                            value={partsDescription}
                            onChange={(e) => setPartsDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Urgency *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setUrgency('High')}
                                className={`flex items-center justify-center p-2 rounded-lg border ${urgency === 'High' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                <FiAlertTriangle className="mr-1" />
                                High
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrgency('Medium')}
                                className={`flex items-center justify-center p-2 rounded-lg border ${urgency === 'Medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                <FiClock className="mr-1" />
                                Medium
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrgency('Low')}
                                className={`flex items-center justify-center p-2 rounded-lg border ${urgency === 'Low' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                <FiCheckCircle className="mr-1" />
                                Low
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attachments
                        </label>
                        <div className="flex items-center">
                            <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                                <FiUpload className="mr-2" />
                                Upload Files
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                            </label>
                            <span className="ml-2 text-sm text-gray-500">
                                {attachments.length} file(s) selected
                            </span>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700 truncate max-w-xs">
                                            {file.name}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="text-gray-500 hover:text-red-500 ml-2"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            size="small"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="small"
                            icon={FiPackage}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                        >
                            Submit Request
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

PartsRequestModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    jobId: PropTypes.string.isRequired,
    jobDetails: PropTypes.shape({
        job_number: PropTypes.string.isRequired,
        device: PropTypes.string.isRequired,
        serial_number: PropTypes.string,
        description: PropTypes.string
    }).isRequired,
    currentUser: PropTypes.object.isRequired
};

export default PartsRequestModal;