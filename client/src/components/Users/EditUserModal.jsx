import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';
import FileUpload from '../Common/FileUpload';

const roleOptions = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'technician', label: 'Technician' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'parts_team', label: 'Parts Team' }
];

const skillOptions = [
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Software', label: 'Software' },
    { value: 'Server', label: 'Server' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Printer', label: 'Printer' },
    { value: 'Network', label: 'Network' },
    { value: 'Network Administration', label: 'Network Administration' },
    { value: 'System Management', label: 'System Management' },
    { value: 'Team Management', label: 'Team Management' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Coordination', label: 'Coordination' },
    { value: 'Documentation', label: 'Documentation' },
    { value: 'Customer Service', label: 'Customer Service' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Inventory Management', label: 'Inventory Management' },
    { value: 'Logistics', label: 'Logistics' }
];


const SkillInput = ({ skill, index, onChange, onRemove, hasError }) => {
    const handleSkillChange = (field, value) => {
        onChange(index, field, value);
    };

    const handleSubskillChange = (subIndex, value) => {
        const newSubskills = [...skill.subskills];
        newSubskills[subIndex] = value;
        onChange(index, 'subskills', newSubskills);
    };

    const addSubskill = () => {
        const newSubskills = [...skill.subskills, ''];
        onChange(index, 'subskills', newSubskills);
    };

    const removeSubskill = (subIndex) => {
        const newSubskills = skill.subskills.filter((_, i) => i !== subIndex);
        onChange(index, 'subskills', newSubskills);
    };

    return (
        <div className={`p-4 border ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-md mb-3`}>
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Skill #{index + 1}</h4>
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                    <FiTrash2 size={16} />
                </button>
            </div>

            <div className="mb-3">
                <BaseSelectInput
                    label="Skill *"
                    name={`skill-${index}`}
                    value={skill.name}
                    onChange={(e) => handleSkillChange('name', e.target.value)}
                    options={skillOptions}
                    required
                    hasError={hasError}
                />
                {hasError && (
                    <p className="text-red-500 text-xs mt-1">Please select a skill</p>
                )}
            </div>

            <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subskills
                    </label>
                    <button
                        type="button"
                        onClick={addSubskill}
                        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                        <FiPlus size={14} className="mr-1" />
                        Add Subskill
                    </button>
                </div>

                {skill.subskills.map((subskill, subIndex) => (
                    <div key={subIndex} className="flex items-center mb-2">
                        <BaseInput
                            value={subskill}
                            onChange={(e) => handleSubskillChange(subIndex, e.target.value)}
                            placeholder="Enter subskill"
                            className="flex-grow"
                        />
                        <button
                            type="button"
                            onClick={() => removeSubskill(subIndex)}
                            className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

SkillInput.propTypes = {
    skill: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    hasError: PropTypes.bool
};

SkillInput.defaultProps = {
    hasError: false
};

const EditUserModal = ({ isOpen, onClose, userId, onUserUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'technician',
        image: null,
        skills: []
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
    const [skillErrors, setSkillErrors] = useState({});
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
                image: null,
                skills: userData.skills || []
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

    const handleImageChange = (files) => {
        if (files && files.length > 0) {
            const file = files[0];
            setFormData(prev => ({ ...prev, image: file }));
            setPreviewImage(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSkillChange = (index, field, value) => {
        const newSkills = [...formData.skills];
        newSkills[index] = {
            ...newSkills[index],
            [field]: value
        };
        setFormData(prev => ({ ...prev, skills: newSkills }));
        if (field === 'name' && value) {
            setSkillErrors(prev => ({ ...prev, [index]: false }));
        }
    };

    const addSkill = () => {
        setFormData(prev => ({
            ...prev,
            skills: [...prev.skills, { name: '', subskills: [''] }]
        }));
    };

    const removeSkill = (index) => {
        const newSkills = formData.skills.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, skills: newSkills }));
        const newErrors = { ...skillErrors };
        delete newErrors[index];
        setSkillErrors(newErrors);
    };

    const handleClose = useCallback(() => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'technician',
            image: null,
            skills: []
        });
        setPreviewImage('');
        setPasswordData({
            newPassword: '',
            confirmPassword: ''
        });
        setShowPasswordFields(false);
        setError('');
        setSkillErrors({});
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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

        const newSkillErrors = {};
        let hasEmptySkill = false;

        formData.skills.forEach((skill, index) => {
            if (!skill.name || skill.name.trim() === '') {
                newSkillErrors[index] = true;
                hasEmptySkill = true;
            }
        });

        if (hasEmptySkill) {
            setSkillErrors(newSkillErrors);
            setError('Please select a skill name for all added skills');
            return;
        }

        setSkillErrors({});
        const validSkills = formData.skills
            .filter(skill => skill.name && skill.name.trim() !== '')
            .map(skill => ({
                name: skill.name,
                subskills: skill.subskills.filter(sub => sub && sub.trim() !== '')
            }));

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('role', formData.role);
            formDataToSend.append('skills', JSON.stringify(validSkills));

            if (showPasswordFields) {
                formDataToSend.append('password', passwordData.newPassword);
            }
            if (formData.image && previewImage && previewImage.includes('cloudinary')) {
                formDataToSend.append('deleteOldImage', 'true');
            }

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            } else if (!previewImage) {
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
                    <p className="text-gray-500 dark:text-gray-400">Loading user data...</p>
                </div>
            ) : (
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
                            <FileUpload
                                onFilesChange={handleImageChange}
                                accept="image/*"
                                maxFiles={1}
                                maxSize={5 * 1024 * 1024}
                                uploadText="Click to upload or drag and drop"
                                helperText="Supported formats: JPG, PNG (Max 5MB)"
                                showPreview={false}
                            />
                            {previewImage && (
                                <div className="mt-3 flex items-center">
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
                                        className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="col-span-2">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Skills</h3>
                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    <FiPlus size={16} className="mr-1" />
                                    Add Skill
                                </button>
                            </div>

                            {formData.skills.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                    No skills added yet
                                </div>
                            ) : (
                                formData.skills.map((skill, index) => (
                                    <SkillInput
                                        key={index}
                                        skill={skill}
                                        index={index}
                                        onChange={handleSkillChange}
                                        onRemove={removeSkill}
                                        hasError={skillErrors[index]}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        {!showPasswordFields ? (
                            <button
                                type="button"
                                onClick={() => setShowPasswordFields(true)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                            >
                                Change Password
                            </button>
                        ) : (
                            <div className="space-y-4 mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Set New Password</h4>

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
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
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