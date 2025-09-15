import React, { useState } from 'react';
import Modal from '../../components/Common/BaseModal';
import { FiX, FiPaperclip } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import FileUpload from '../../components/Common/FileUpload';

const CreatePartRequest = ({ isOpen, onClose, onCreate, jobs, currentUser }) => {
    const [formData, setFormData] = useState({
        job_id: '',
        parts_description: '',
        urgency: 'Medium',
        notes: '',
        attachments: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (files) => {
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files.map(file => ({
                url: URL.createObjectURL(file),
                name: file.name,
                type: file.type.startsWith('image') ? 'image' : 'document',
                file // Store the actual file for upload
            }))]
        }));
    };

    const handleRemoveFile = (index) => {
        setFormData(prev => {
            const newAttachments = [...prev.attachments];
            newAttachments.splice(index, 1);
            return { ...prev, attachments: newAttachments };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formPayload = new FormData();
            formPayload.append('job_id', formData.job_id);
            formPayload.append('parts_description', formData.parts_description);
            formPayload.append('urgency', formData.urgency);
            formPayload.append('notes', formData.notes);

            formData.attachments.forEach((attachment, index) => {
                formPayload.append(`attachments`, attachment.file);
            });

            const response = await axios.post('/api/parts-requests', formPayload, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            onCreate(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 w-full lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create New Parts Request</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                {error && <div className="mb-4 text-red-500">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Job</label>
                            <select
                                name="job_id"
                                value={formData.job_id}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Job</option>
                                {jobs.map(job => (
                                    <option key={job._id} value={job._id}>
                                        {job.job_number} - {job.customer_id?.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="parts_description"
                                value={formData.parts_description}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Urgency</label>
                                <select
                                    name="urgency"
                                    value={formData.urgency}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Attachments</label>
                            <FileUpload onFileUpload={handleFileUpload} multiple />

                            {formData.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {formData.attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                <FiPaperclip />
                                                <span className="text-sm truncate max-w-xs">{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default CreatePartRequest;