import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { debounce } from 'lodash';

const SearchModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [hasSearched, setHasSearched] = useState(false);

    const searchCollections = debounce(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults({});
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/search', {
                params: { query: searchQuery },
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setResults(response.data);
            setHasSearched(true);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, 500);

    useEffect(() => {
        if (isOpen && query) {
            searchCollections(query);
        }
    }, [isOpen, query]);

    if (!isOpen) return null;

    const renderResults = () => {
        if (isLoading) {
            return <div className="p-4 text-center text-gray-600 dark:text-gray-400">Searching...</div>;
        }

        if (!hasSearched) {
            return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Type to search</div>;
        }

        const allResultsEmpty = Object.values(results).every(arr => arr.length === 0);
        if (allResultsEmpty) {
            return <div className="p-4 text-center text-gray-500 dark:text-gray-400">No results found</div>;
        }

        if (activeTab === 'all') {
            return (
                <div className="space-y-6">
                    {Object.entries(results).map(([collection, items]) => {
                        if (items.length === 0) return null;

                        return (
                            <div key={collection}>
                                <h3 className="px-4 py-2 bg-gray-100 dark:bg-gray-700 font-medium capitalize text-gray-800 dark:text-gray-200">
                                    {collection.replace('_', ' ')}
                                </h3>
                                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {items.map((item, index) => (
                                        <li key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                            {renderResultItem(collection, item)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            );
        } else {
            const collectionResults = results[activeTab] || [];
            if (collectionResults.length === 0) {
                return <div className="p-4 text-center text-gray-500 dark:text-gray-400">No results in this category</div>;
            }

            return (
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {collectionResults.map((item, index) => (
                        <li key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            {renderResultItem(activeTab, item)}
                        </li>
                    ))}
                </ul>
            );
        }
    };

    const renderResultItem = (collection, item) => {
        switch (collection) {
            case 'customers':
                return (
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.email} | {item.phone}</p>
                        {item.is_ad_hoc && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded mt-1 inline-block">Ad-hoc</span>}
                    </div>
                );
            case 'devices':
                return (
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.model_number} ({item.serial_number})</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.customer_id?.name || 'Unknown customer'} | {item.device_type}
                        </p>
                    </div>
                );
            case 'jobs':
                return (
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Job #{item.job_number}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Status: {item.status} | {item.priority} priority
                        </p>
                    </div>
                );
            default:
                return <div className="text-gray-900 dark:text-gray-100">{JSON.stringify(item)}</div>;
        }
    };

    const TabButton = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${activeTab === tab
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75 dark:opacity-90"></div>
                </div>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Search</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                            >
                                <FiX className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                placeholder="Search customers, devices, jobs..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                            <TabButton tab="all" label="All" />

                            {user.role === 'administrator' || user.role === 'manager' || user.role === 'coordinator' ? (
                                <TabButton tab="customers" label="Customers" />
                            ) : null}

                            {user.role === 'administrator' || user.role === 'manager' || user.role === 'coordinator' || user.role === 'technician' ? (
                                <TabButton tab="devices" label="Devices" />
                            ) : null}

                            <TabButton tab="jobs" label="Jobs" />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 max-h-96 overflow-y-auto">
                        {renderResults()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;