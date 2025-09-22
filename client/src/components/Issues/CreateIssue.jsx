import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiUpload, FiX, FiAlertCircle, FiMessageSquare, FiTag, FiFlag, FiUser } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';
import BaseTextarea from '../Common/TextArea';

const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
];

const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
];

const categoryOptions = [
    { value: 'Bug', label: 'Bug' },
    { value: 'Feature Request', label: 'Feature Request' },
    { value: 'UI/UX', label: 'UI/UX' },
    { value: 'Performance', label: 'Performance' },
    { value: 'Other', label: 'Other' }
];

const CreateIssueModal = ({ isOpen, onClose, onCreateIssue }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        category: 'Bug',
        screenshots: []
    });
    const [previewImages, setPreviewImages] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const validFiles = files.filter(file => {
                if (!file.type.startsWith('image/')) {
                    setError('Please upload only image files');
                    return false;
                }
                if (file.size > 5 * 1024 * 1024) {
                    setError('Image size should be less than 5MB');
                    return false;
                }
                return true;
            });

            if (validFiles.length === 0) return;

            setFormData(prev => ({
                ...prev,
                screenshots: [...prev.screenshots, ...validFiles]
            }));

            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setPreviewImages(prev => [...prev, ...newPreviews]);
            setError('');
        }
    };

    const removeImage = (index) => {
        const updatedScreenshots = [...formData.screenshots];
        updatedScreenshots.splice(index, 1);
        setFormData(prev => ({ ...prev, screenshots: updatedScreenshots }));

        const updatedPreviews = [...previewImages];
        URL.revokeObjectURL(updatedPreviews[index]);
        updatedPreviews.splice(index, 1);
        setPreviewImages(updatedPreviews);
    };

    const handleClose = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            status: 'Open',
            priority: 'Medium',
            category: 'Bug',
            screenshots: []
        });
        setPreviewImages([]);
        setError('');
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title) {
            setError('Title is required');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('status', formData.status);
            formDataToSend.append('priority', formData.priority);
            formDataToSend.append('category', formData.category);

            formData.screenshots.forEach((file, index) => {
                formDataToSend.append(`screenshots`, file);
            });

            const response = await axios.post(
                'http://localhost:5000/system-issues',
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (onCreateIssue) {
                onCreateIssue(response.data.issue || response.data);
            }
            handleClose();
        } catch (err) {
            console.error('Issue creation error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Report New Issue"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                        <FiX className="mr-2" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <BaseInput
                        label="Title *"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        icon={FiAlertCircle}
                        required
                    />

                    <BaseTextarea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        icon={FiMessageSquare}
                        rows={4}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BaseSelectInput
                            label="Status *"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={statusOptions}
                            icon={FiFlag}
                            required
                        />

                        <BaseSelectInput
                            label="Priority *"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            options={priorityOptions}
                            icon={FiFlag}
                            required
                        />

                        <BaseSelectInput
                            label="Category *"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            options={categoryOptions}
                            icon={FiTag}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Screenshots</label>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex flex-col items-center justify-center w-32 h-32 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                                <FiUpload className="text-2xl mb-1" />
                                <span className="text-sm">Add Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    multiple
                                />
                            </label>

                            {previewImages.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={preview}
                                        alt={`Screenshot ${index + 1}`}
                                        className="w-32 h-32 object-cover rounded-md border border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <FiX size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
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
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Issue'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

CreateIssueModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateIssue: PropTypes.func
};

export default CreateIssueModal;