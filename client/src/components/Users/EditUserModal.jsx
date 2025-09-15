import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FiUpload, FiX, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';
import { useAuth } from '../../../context/AuthContext';

const roleOptions = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'technician', label: 'Technician' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'parts_team', label: 'Parts Team' }
];

const EditUserModal = ({ isOpen, onClose, userId, onUserUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'technician',
        image: null
    });
    const [previewImage, setPreviewImage] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const { user: currentUser } = useAuth();

    const fetchUserData = useCallback(async () => {
        try {
            setFetching(true);
            const response = await axios.get(
                `http://localhost:5000/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`
                    }
                }
            );

            const userData = response.data.user || response.data;
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                role: userData.role || 'technician',
                image: null
            });

            if (userData.image?.url || userData.image) {
                setPreviewImage(userData.image.url || userData.image);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user data');
            console.error('Fetch user error:', err);
        } finally {
            setFetching(false);
        }
    }, [userId, currentUser]);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserData();
        }
    }, [isOpen, userId, fetchUserData]);

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

            setFormData(prev => ({ ...prev, image: file }));
            setPreviewImage(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleClose = useCallback(() => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'technician',
            image: null
        });
        setPreviewImage('');
        setPasswordData({
            newPassword: '',
            confirmPassword: ''
        });
        setShowPasswordFields(false);
        setError('');
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.email) {
            setError('Please fill in all required fields');
            return;
        }

        if (showPasswordFields) {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            if (passwordData.newPassword.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('role', formData.role);

            if (showPasswordFields) {
                formDataToSend.append('password', passwordData.newPassword);
            }

            // Add flag to delete old image when uploading new one
            if (formData.image && previewImage && previewImage.includes('cloudinary')) {
                formDataToSend.append('deleteOldImage', 'true');
            }

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            } else if (!previewImage) {
                // If user removed the image
                formDataToSend.append('removeImage', 'true');
            }

            const response = await axios.put(
                `http://localhost:5000/users/${userId}`,
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (onUserUpdate) {
                onUserUpdate(response.data.user || response.data);
            }
            handleClose();
        } catch (err) {
            console.error('User update error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit User"
            size="lg"
        >
            {fetching ? (
                <div className="p-4 flex justify-center items-center h-40">
                    <p>Loading user data...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                            <FiX className="mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <BaseInput
                                label="Full Name *"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                icon={FiUser}
                                required
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <BaseInput
                                type="email"
                                label="Email *"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                icon={FiMail}
                                required
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <BaseInput
                                type="tel"
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                icon={FiPhone}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <BaseSelectInput
                                label="Role *"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                options={roleOptions}
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                            <div className="flex items-center">
                                <label className="flex flex-col items-center px-4 py-2 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                                    <FiUpload className="mr-1" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <span className="text-sm">Change Image</span>
                                </label>
                                {previewImage && (
                                    <div className="ml-4">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="h-12 w-12 object-cover rounded-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewImage('');
                                                setFormData(prev => ({ ...prev, image: null }));
                                            }}
                                            className="text-xs text-red-500 mt-1"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        {!showPasswordFields ? (
                            <button
                                type="button"
                                onClick={() => setShowPasswordFields(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Change Password
                            </button>
                        ) : (
                            <div className="space-y-4 mt-4 border-t pt-4">
                                <h4 className="text-md font-medium">Set New Password</h4>

                                <BaseInput
                                    type="password"
                                    label="New Password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    icon={FiLock}
                                    required
                                />

                                <BaseInput
                                    type="password"
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    icon={FiLock}
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordFields(false);
                                        setPasswordData({
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Cancel Password Change
                                </button>
                            </div>
                        )}
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
                            {loading ? 'Updating...' : 'Update User'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

EditUserModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userId: PropTypes.string.isRequired,
    onUserUpdate: PropTypes.func
};

export default EditUserModal;