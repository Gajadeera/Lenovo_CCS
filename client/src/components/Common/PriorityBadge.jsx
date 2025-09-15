import React from 'react';

const PriorityBadge = ({ priority }) => {
    const getPriorityClasses = () => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Low':
                return 'bg-green-100 text-green-800';
            case 'Urgent':
                return 'bg-red-600 text-white';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClasses()}`}>
            {priority}
        </span>
    );
};

export default PriorityBadge;