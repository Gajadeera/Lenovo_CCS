import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FiUser, FiMail, FiPhone, FiShield, FiX, FiEdit, FiCamera, FiSave, FiXCircle } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import { useAuth } from '../../../context/AuthContext';

const UserProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [previewImage, setPreviewImage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const { user: currentUser, updateUser } = useAuth();

    const fetchUserData = useCallback(async () => {
        try {
            setFetching(true);
            const response = await axios.get(
                'http://localhost:5000/users/profile',
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`
                    }
                }
            );

            const userData = response.data;
            setFormData({
                name: userData.name || '',
                phone: userData.phone || ''
            });

            if (userData.image?.url || userData.image) {
                setPreviewImage(userData.image.url || userData.image);
            }

            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user data');
            console.error('Fetch user error:', err);
        } finally {
            setFetching(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (isOpen) {
            fetchUserData();
            setIsEditing(false);
            setImageFile(null);
            setError('');
        }
    }, [isOpen, fetchUserData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setError('Image size should be less than 5MB');
                return;
            }

            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewImage('');
    };

    const handleClose = useCallback(() => {
        setFormData({
            name: '',
            phone: ''
        });
        setPreviewImage('');
        setImageFile(null);
        setError('');
        setIsEditing(false);
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        // Validation
        if (!formData.name) {
            setError('Please fill in your name');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone || '');

            // Add image file if selected
            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            // Check if user wants to remove the image
            const hasExistingImage = currentUser.image?.url &&
                currentUser.image.url !== 'https://res.cloudinary.com/demo/image/upload/v1626282931/sample.jpg';
            const wantsToRemoveImage = !imageFile && !previewImage && hasExistingImage;

            formDataToSend.append('removeImage', wantsToRemoveImage ? 'true' : 'false');

            const response = await axios.put(
                'http://localhost:5000/users/profile',
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Update auth context with new user data
            if (updateUser) {
                updateUser(response.data);
            }

            if (onProfileUpdate) {
                onProfileUpdate(response.data);
            }

            setIsEditing(false);
            setImageFile(null);
            setError('');
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        fetchUserData(); // Reset form data
        setIsEditing(false);
        setImageFile(null);
        setError('');
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="My Profile"
            size="xl"
        >
            {fetching ? (
                <div className="p-4 flex justify-center items-center h-40">
                    <p className="text-gray-800 dark:text-gray-200">Loading profile data...</p>
                </div>
            ) : (
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-teal-400 dark:border-teal-500">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FiUser className="w-16 h-16 text-gray-600 dark:text-gray-300" />
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="absolute bottom-0 right-0 flex gap-2">
                                        <label htmlFor="profile-image-upload" className="bg-indigo-600 dark:bg-indigo-700 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md">
                                            <FiCamera className="w-4 h-4" />
                                            <input
                                                id="profile-image-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>

                                        {previewImage && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                                            >
                                                <FiXCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="flex-1">
                            <div className="space-y-4">
                                <div>
                                    {isEditing ? (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{formData.name}</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                {currentUser?.role?.replace('_', ' ') || 'No role'}
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiMail className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                                            <p className="text-gray-800 dark:text-gray-200">{currentUser.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiPhone className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Enter phone number"
                                                />
                                            ) : (
                                                <p className="text-gray-800 dark:text-gray-200">
                                                    {formData.phone || 'Not provided'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiShield className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</h3>
                                            <p className="text-gray-800 dark:text-gray-200 capitalize">
                                                {currentUser?.role?.replace('_', ' ') || 'No role'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                                {isEditing ? (
                                    <>
                                        <Button
                                            onClick={handleSubmit}
                                            variant="primary"
                                            icon={FiSave}
                                            loading={loading}
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            onClick={handleCancelEdit}
                                            variant="secondary"
                                            icon={FiX}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={handleEditClick}
                                        variant="primary"
                                        icon={FiEdit}
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

UserProfileModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onProfileUpdate: PropTypes.func
};

export default UserProfileModal;