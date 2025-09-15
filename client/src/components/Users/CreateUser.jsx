import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiUpload, FiImage } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';

const roleOptions = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'technician', label: 'Technician' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'parts_team', label: 'Parts Team' }
];

// Compact File Upload Component with Dark Mode Support
const CompactFileUpload = ({ onFileChange, accept, maxSize }) => {
    const [file, setFile] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type and size
            if (accept && !selectedFile.type.match(accept.replace('*', '.*'))) {
                alert('Please select a valid file type');
                return;
            }
            if (selectedFile.size > maxSize) {
                alert(`File size should be less than ${maxSize / 1024 / 1024}MB`);
                return;
            }

            setFile(selectedFile);
            if (onFileChange) {
                onFileChange(selectedFile);
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        if (onFileChange) {
            onFileChange(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex items-center">
            <div
                className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={handleClick}
            >
                <FiUpload size={16} className="text-gray-600 dark:text-gray-300" />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={accept}
                />
            </div>

            {file && (
                <div className="ml-3 flex items-center">
                    <FiImage className="text-blue-500 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs mr-2">{file.name}</span>
                    <button
                        onClick={removeFile}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

CompactFileUpload.propTypes = {
    onFileChange: PropTypes.func,
    accept: PropTypes.string,
    maxSize: PropTypes.number
};

CompactFileUpload.defaultProps = {
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024 // 5MB
};

// Create User Component with Dark Mode Support
const CreateUser = ({ isOpen, onClose, onCreateUser }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'technician',
        image: null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (file) => {
        setFormData(prev => ({ ...prev, image: file }));
        setError('');
    };

    const handleClose = useCallback(() => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            role: 'technician',
            image: null
        });
        setError('');
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('role', formData.role);
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            const response = await axios.post(
                'http://localhost:5000/users/signup',
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (onCreateUser) {
                onCreateUser(response.data.user || response.data);
            }
            handleClose();
        } catch (err) {
            console.error('User creation error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New User"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md flex items-center">
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
                            type="password"
                            label="Password *"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            icon={FiLock}
                            required
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <BaseInput
                            type="password"
                            label="Confirm Password *"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            icon={FiLock}
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Image</label>
                        <CompactFileUpload
                            onFileChange={handleImageChange}
                            accept="image/*"
                            maxSize={5 * 1024 * 1024}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supported formats: JPG, PNG (Max 5MB)</p>
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
                        {loading ? 'Creating...' : 'Create User'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

CreateUser.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateUser: PropTypes.func
};

export default CreateUser;