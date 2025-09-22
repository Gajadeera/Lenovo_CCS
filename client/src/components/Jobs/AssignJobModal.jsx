import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiUser, FiTool, FiCalendar, FiX, FiInfo, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseSelectInput from '../Common/BaseSelectInput';
import BaseInput from '../Common/BaseInput';
import Button from '../Common/Button';

const AssignJobModal = ({
    isOpen,
    onClose,
    onSubmit,
    jobId
}) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        assigned_to: '',
        scheduled_date: '',
        status: 'Assigned'
    });
    const [jobDetails, setJobDetails] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formReady, setFormReady] = useState(false);
    const [isAlreadyAssigned, setIsAlreadyAssigned] = useState(false);
    const [currentTechnician, setCurrentTechnician] = useState(null);


    const assignmentStatusColors = {
        High: 'bg-red-50 border-red-200 text-red-800',
        Medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        Low: 'bg-blue-50 border-blue-200 text-blue-800',
        default: 'bg-gray-50 border-gray-200 text-gray-800'
    };


    const getCurrentDateTime = () => {
        const now = new Date();
        // Convert to ISO string and remove the 'Z' and milliseconds
        return now.toISOString().slice(0, 16);
    };


    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen || !jobId) return;

            try {
                setLoading(true);
                setError('');

                const config = { headers: { 'Authorization': `Bearer ${currentUser.token}` } };

                // Fetch job data
                const jobResponse = await axios.get(`http://localhost:5000/jobs/${jobId}`, config);
                const jobData = jobResponse.data;

                setJobDetails(jobData);

                // Check if job is already assigned
                if (jobData.assigned_to) {
                    setIsAlreadyAssigned(true);
                    setCurrentTechnician({
                        id: jobData.assigned_to._id || jobData.assigned_to,
                        name: jobData.assigned_to.name || 'Unknown Technician'
                    });
                } else {
                    setIsAlreadyAssigned(false);
                    setCurrentTechnician(null);
                }

                // Fetch technicians
                const techniciansRes = await axios.get('http://localhost:5000/users?role=technician', config);
                setTechnicians(techniciansRes.data.users || []);

                // Set form data with current date/time as default
                setFormData({
                    assigned_to: jobData.assigned_to?._id || jobData.assigned_to || '',
                    scheduled_date: getCurrentDateTime(),
                    status: jobData.status || 'Assigned'
                });

                setFormReady(true);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch required data');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, jobId, currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            assigned_to: '',
            scheduled_date: getCurrentDateTime(),
            status: 'Assigned'
        });
        setJobDetails(null);
        setError('');
        setIsAlreadyAssigned(false);
        setCurrentTechnician(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.assigned_to) {
            setError('Please select a technician to assign this job');
            return;
        }

        try {
            setLoading(true);

            const token = currentUser?.token;
            if (!token) {
                setError('You are not authorized to perform this action. Please log in.');
                setLoading(false);
                return;
            }

            const updateData = {
                assigned_to: formData.assigned_to,
                status: formData.status,
                scheduled_date: formData.scheduled_date,
                is_reassignment: isAlreadyAssigned
            };

            const response = await axios.patch(
                `http://localhost:5000/jobs/assign/${jobId}`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            onSubmit(response.data);
            resetForm();
            onClose();
        } catch (err) {
            let errorMessage = 'Failed to assign job. Please try again.';

            if (err.response) {
                if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data?.error) {
                    errorMessage = err.response.data.error;
                }
            } else if (err.request) {
                errorMessage = 'Network error. Please check your connection.';
            }

            setError(errorMessage);
            console.error('Job assignment error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isAlreadyAssigned ? "Reassign Job" : "Assign Job"}
            size="md"
        >
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                    <FiX className="mr-2" />
                    {error}
                </div>
            )}

            {loading && !formReady ? (
                <div className="text-center py-8">Loading job data...</div>
            ) : !formReady ? (
                <div className="text-center py-8">Preparing form...</div>
            ) : (
                <form onSubmit={handleSubmit} className="p-4">
                    {/* Job Information Section */}
                    <div className="mb-6 space-y-4">
                        {/* Current Assignment Status - Color changes based on priority */}
                        {isAlreadyAssigned && (
                            <div className={`p-3 rounded-lg border text-sm flex items-start ${assignmentStatusColors[jobDetails?.priority] || assignmentStatusColors.default
                                }`}>
                                {jobDetails?.priority === 'High' ? (
                                    <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                                ) : jobDetails?.priority === 'Medium' ? (
                                    <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                    <p className="font-medium">Currently assigned to: {currentTechnician?.name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assignment Form Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {isAlreadyAssigned ? 'Reassignment Details' : 'Assignment Details'}
                        </h3>

                        <BaseSelectInput
                            label={isAlreadyAssigned ? "Reassign To Technician *" : "Assign To Technician *"}
                            name="assigned_to"
                            value={formData.assigned_to}
                            onChange={handleChange}
                            options={[
                                { value: '', label: isAlreadyAssigned ? 'Select New Technician' : 'Select Technician' },
                                ...technicians
                                    .filter(tech => tech._id !== (jobDetails?.assigned_to?._id || jobDetails?.assigned_to))
                                    .map(tech => ({
                                        value: tech._id,
                                        label: tech.name
                                    }))
                            ]}
                            icon={FiUser}
                            required
                        />

                        <BaseSelectInput
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={[
                                { value: 'Assigned', label: 'Assigned' },
                                { value: 'In Progress', label: 'In Progress' },
                                { value: 'On Hold', label: 'On Hold' }
                            ]}
                            icon={FiTool}
                        />

                        <BaseInput
                            type="datetime-local"
                            label="Scheduled Date"
                            name="scheduled_date"
                            value={formData.scheduled_date}
                            onChange={handleChange}
                            icon={FiCalendar}
                        />
                    </div>

                    {/* Form Actions */}
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
                            {loading
                                ? isAlreadyAssigned
                                    ? 'Reassigning...'
                                    : 'Assigning...'
                                : isAlreadyAssigned
                                    ? 'Reassign Job'
                                    : 'Assign Job'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

AssignJobModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    jobId: PropTypes.string
};

export default AssignJobModal;