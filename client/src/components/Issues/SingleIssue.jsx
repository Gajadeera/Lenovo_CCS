import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
    FiAlertCircle,
    FiMessageSquare,
    FiTag,
    FiFlag,
    FiUser,
    FiX,
    FiEdit,
    FiTrash2,
    FiClock,
    FiCalendar,
    FiImage
} from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import EditIssueModal from './EditIssue';
import DeleteIssueModal from './DeleteIssue';
import CommentSection from '../Common/CommentSection';
import { format } from 'date-fns';

const SingleIssueModal = ({ isOpen, onClose, issueId, onIssueUpdate }) => {
    const { user: currentUser } = useAuth();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchIssue = async () => {
            if (!isOpen || !issueId) return;

            try {
                setLoading(true);
                setError(null);

                const config = {
                    headers: { Authorization: `Bearer ${currentUser?.token}` }
                };

                const response = await axios.get(`http://localhost:5000/system-issues/${issueId}`, config);
                const issueData = response.data?.data || response.data;
                setIssue(issueData);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch issue');
                console.error('Error fetching issue:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchIssue();
    }, [issueId, currentUser, isOpen]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
        } catch {
            return 'N/A';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in progress': return 'bg-purple-100 text-purple-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const renderCompactField = (label, value, icon, customElement = null) => (
        <div className="col-span-4 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="flex items-center text-sm h-8">
                {icon && React.cloneElement(icon, { className: "text-gray-400 mr-1", size: 14 })}
                {customElement || <span className="truncate">{value || 'N/A'}</span>}
            </div>
        </div>
    );

    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    const handleIssueUpdated = (updatedIssue) => {
        setIssue(updatedIssue);
        setShowEditModal(false);
        onIssueUpdate?.(updatedIssue);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${currentUser?.token}` }
            };

            await axios.delete(`http://localhost:5000/system-issues/${issueId}`, config);
            onClose();
            setShowDeleteModal(false);
            onIssueUpdate?.(null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to delete issue');
            setShowDeleteModal(false);
        }
    };

    const handleCommentAdded = (updatedIssue) => {
        setIssue(updatedIssue);
        onIssueUpdate?.(updatedIssue);
    };

    if (loading) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Issue Details" size="lg">
            <div className="flex justify-center items-center h-40">Loading...</div>
        </Modal>
    );

    if (error) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Issue Details" size="lg">
            <div className="flex justify-center items-center h-40 text-red-500 text-sm">{error}</div>
        </Modal>
    );

    if (!issue) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Issue Details" size="lg">
            <div className="flex justify-center items-center h-40 text-sm">Issue not found</div>
        </Modal>
    );

    const canEdit = ['administrator', 'manager'].includes(currentUser?.role) ||
        currentUser?._id === issue.reported_by?._id;
    const canDelete = currentUser?.role?.toLowerCase() === 'administrator';

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Issue: ${issue.title}`} size="xl">
                <div className="p-4 space-y-3">
                    {error && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center">
                            <FiX className="mr-1" size={14} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                        {renderCompactField("Title", issue.title, <FiAlertCircle />)}
                        {renderCompactField("Status", (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                                {issue.status || 'Open'}
                            </span>
                        ), <FiFlag />)}
                        {renderCompactField("Priority", (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                                {issue.priority || 'Not specified'}
                            </span>
                        ), <FiFlag />)}
                        {renderCompactField("Category", issue.category, <FiTag />)}
                        {renderCompactField("Reported By", issue.reported_by?.name, <FiUser />)}
                        {renderCompactField("Assigned To", issue.assigned_to?.name || 'Unassigned', <FiUser />)}
                        {renderCompactField("Created", formatDate(issue.created_at), <FiCalendar />)}
                        {renderCompactField("Last Updated", formatDate(issue.updated_at), <FiClock />)}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <div className="text-sm p-2 bg-gray-50 rounded border border-gray-200 whitespace-pre-line">
                            {issue.description || 'No description provided'}
                        </div>
                    </div>

                    {issue.screenshots?.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Screenshots</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {issue.screenshots.map((screenshot, index) => (
                                    <a
                                        key={index}
                                        href={screenshot.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group"
                                    >
                                        <img
                                            src={screenshot.url}
                                            alt={`Screenshot ${index + 1}`}
                                            className="w-full h-20 object-cover rounded border border-gray-300 group-hover:border-blue-500 transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {screenshot.name || `Screenshot ${index + 1}`}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    {issue.resolution && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Resolution</label>
                            <div className="text-sm p-2 bg-green-50 rounded border border-green-200 whitespace-pre-line">
                                {issue.resolution}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-3">
                        <CommentSection
                            issueId={issueId}
                            comments={issue.comments || []}
                            onCommentAdded={handleCommentAdded}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            size="small"
                        >
                            Close
                        </Button>
                        {canEdit && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setShowEditModal(true)}
                                size="small"
                                icon={FiEdit}
                            >
                                Edit Issue
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeleteClick}
                                size="small"
                                icon={FiTrash2}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>

            <EditIssueModal
                key={`edit-${issueId}`}
                isOpen={showEditModal}
                onClose={handleEditModalClose}
                issueId={issueId}
                initialData={{
                    title: issue.title,
                    description: issue.description,
                    status: issue.status,
                    priority: issue.priority,
                    category: issue.category,
                    screenshots: issue.screenshots
                }}
                onIssueUpdate={handleIssueUpdated}
            />

            <DeleteIssueModal
                isOpen={showDeleteModal}
                onClose={handleDeleteModalClose}
                onConfirm={handleDeleteConfirm}
                issueTitle={issue.title}
            />
        </>
    );
};

SingleIssueModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    issueId: PropTypes.string.isRequired,
    onIssueUpdate: PropTypes.func
};

export default SingleIssueModal;