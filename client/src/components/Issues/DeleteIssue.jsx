import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';

const DeleteIssueModal = ({
    isOpen,
    onClose,
    onConfirm,
    issueTitle
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Confirm Issue Deletion"
            size="sm"
        >
            <div className="space-y-4">
                <p className="text-gray-700">
                    Are you sure you want to delete the issue titled <span className="font-semibold">"{issueTitle}"</span>?
                    This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        onClick={handleClose}
                        size="sm"
                        variant="outline"
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        size="sm"
                        variant="danger"
                        isLoading={isDeleting}
                        disabled={isDeleting}
                    >
                        Delete Issue
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

DeleteIssueModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    issueTitle: PropTypes.string.isRequired
};

export default DeleteIssueModal;