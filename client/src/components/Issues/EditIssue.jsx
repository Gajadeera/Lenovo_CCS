import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
    FiUpload,
    FiX,
    FiAlertCircle,
    FiMessageSquare,
    FiTag,
    FiFlag,
    FiImage
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import BaseInput from '../Common/BaseInput';
import BaseSelect from '../Common/BaseSelectInput';
import { useAuth } from '../../../context/AuthContext';

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

const EditIssueModal = ({ isOpen, onClose, issueId, initialData, onIssueUpdate }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        category: 'Bug',
        screenshots: [],
        existingScreenshots: []
    });
    const [previewImages, setPreviewImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]); // Track images to delete
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    // Initialize form with initialData
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                status: initialData.status || 'Open',
                priority: initialData.priority || 'Medium',
                category: initialData.category || 'Bug',
                screenshots: [],
                existingScreenshots: initialData.screenshots || []
            });

            if (initialData.screenshots?.length > 0) {
                setPreviewImages(initialData.screenshots.map(s => ({
                    url: s.url,
                    public_id: s.public_id,
                    isExisting: true
                })));
            } else {
                setPreviewImages([]);
            }
            setImagesToDelete([]); // Reset images to delete
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
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

            const newPreviews = validFiles.map(file => ({
                url: URL.createObjectURL(file),
                file: file,
                isExisting: false
            }));
            setPreviewImages(prev => [...prev, ...newPreviews]);
            setError('');
        }
    };

    const removeImage = (index) => {
        const imageToRemove = previewImages[index];

        // If it's an existing image, mark it for deletion
        if (imageToRemove.isExisting && imageToRemove.public_id) {
            setImagesToDelete(prev => [...prev, imageToRemove.public_id]);
        }

        // If it's a new image, remove it from the form data
        if (!imageToRemove.isExisting && imageToRemove.file) {
            setFormData(prev => ({
                ...prev,
                screenshots: prev.screenshots.filter(file => file !== imageToRemove.file)
            }));
        }

        // Clean up object URL if it's a new image
        if (!imageToRemove.isExisting && imageToRemove.url) {
            URL.revokeObjectURL(imageToRemove.url);
        }

        // Remove from previews
        const updatedPreviews = [...previewImages];
        updatedPreviews.splice(index, 1);
        setPreviewImages(updatedPreviews);
    };

    const handleClose = useCallback(() => {
        // Clean up all object URLs
        previewImages.forEach(image => {
            if (!image.isExisting && image.url) {
                URL.revokeObjectURL(image.url);
            }
        });

        setFormData({
            title: '',
            description: '',
            status: 'Open',
            priority: 'Medium',
            category: 'Bug',
            screenshots: [],
            existingScreenshots: []
        });
        setPreviewImages([]);
        setImagesToDelete([]);
        setError('');
        setLoading(false);
        onClose();
    }, [onClose, previewImages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title.trim());
            formDataToSend.append('description', formData.description.trim());
            formDataToSend.append('status', formData.status);
            formDataToSend.append('priority', formData.priority);
            formDataToSend.append('category', formData.category);

            // Add images to delete
            if (imagesToDelete.length > 0) {
                formDataToSend.append('screenshots_to_delete', JSON.stringify(imagesToDelete));
                console.log('Sending images to delete:', imagesToDelete);
            }

            // Add new screenshots
            formData.screenshots.forEach(file => {
                formDataToSend.append('screenshots', file);
            });

            const response = await axios.patch(
                `http://localhost:5000/system-issues/${issueId}`,
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const updatedIssue = response.data.data || response.data;
            if (onIssueUpdate) {
                onIssueUpdate(updatedIssue);
            }
            handleClose();
        } catch (err) {
            console.error('Issue update error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit Issue"
            size="xl"
        >
            <div className="p-4 space-y-3">
                {error && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-lg rounded flex items-center">
                        <FiX className="mr-1" size={14} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <BaseInput
                            label="Title *"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            compact
                            dense
                        />

                        <BaseSelect
                            label="Category *"
                            name="category"
                            value={formData.category}
                            onChange={(e) => handleSelectChange('category', e.target.value)}
                            options={categoryOptions}
                            required
                            compact
                            dense
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <BaseSelect
                            label="Status *"
                            name="status"
                            value={formData.status}
                            onChange={(e) => handleSelectChange('status', e.target.value)}
                            options={statusOptions}
                            required
                            compact
                            dense
                        />

                        <BaseSelect
                            label="Priority *"
                            name="priority"
                            value={formData.priority}
                            onChange={(e) => handleSelectChange('priority', e.target.value)}
                            options={priorityOptions}
                            required
                            compact
                            dense
                        />
                    </div>

                    {/* Description */}
                    <BaseInput
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        compact
                        dense
                    />

                    {/* Screenshots - Compact Version */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500">Screenshots</label>

                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded border border-dashed border-gray-300 cursor-pointer hover:border-[#1E4065] hover:bg-gray-50 transition-colors">
                                <FiUpload className="text-gray-400 text-sm mb-0.5" />
                                <span className="text-[10px] text-gray-500">Add</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    multiple
                                />
                            </label>

                            {previewImages.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview.url}
                                        alt={`Screenshot ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border border-gray-300 group-hover:border-[#1E4065] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FiX size={8} />
                                    </button>
                                    {preview.isExisting && imagesToDelete.includes(preview.public_id) && (
                                        <div className="absolute inset-0 bg-red-100 bg-opacity-50 flex items-center justify-center">
                                            <span className="text-xs text-red-600 font-bold">Will be deleted</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {imagesToDelete.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                                {imagesToDelete.length} image(s) marked for deletion
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            size="small"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            disabled={loading}
                            size="small"
                        >
                            {loading ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

EditIssueModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    issueId: PropTypes.string.isRequired,
    initialData: PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        status: PropTypes.string,
        priority: PropTypes.string,
        category: PropTypes.string,
        screenshots: PropTypes.array
    }),
    onIssueUpdate: PropTypes.func
};

export default EditIssueModal;