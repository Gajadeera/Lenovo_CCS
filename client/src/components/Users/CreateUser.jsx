import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiUpload, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
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

const CompactFileUpload = ({ onFileChange, accept, maxSize }) => {
    const [file, setFile] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
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
    maxSize: 5 * 1024 * 1024
};

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
const CreateUser = ({ isOpen, onClose, onCreateUser }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'technician',
        image: null,
        skills: []
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [skillErrors, setSkillErrors] = useState({});
    const { user: currentUser } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (file) => {
        setFormData(prev => ({ ...prev, image: file }));
        setError('');
    };

    const handleSkillChange = (index, field, value) => {
        console.log('Skill change:', index, field, value);
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
        console.log('Adding new skill');
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
            password: '',
            confirmPassword: '',
            role: 'technician',
            image: null,
            skills: []
        });
        setError('');
        setSkillErrors({});
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
            formDataToSend.append('password', formData.password);
            formDataToSend.append('role', formData.role);
            formDataToSend.append('skills', JSON.stringify(validSkills));

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            console.log('Sending skills:', validSkills);

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