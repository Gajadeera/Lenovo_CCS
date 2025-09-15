import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FiSearch, FiX, FiSun, FiMoon } from 'react-icons/fi';
import axios from 'axios';
import { debounce } from 'lodash';
import Logo_PlaceHolder from '../../../Assets/imgs/ThakralOne_CCS_Logo.svg';
import ViewJobModal from '../Jobs/SingleJob';
import ViewCustomerModal from '../Customers/SingleCustomer';
import ViewDeviceModal from '../Devices/SingleDevice';
import ViewPartsRequestModal from '../PartsRequest/SingleRequest';
import ViewUserModal from '../Users/SingleUser';
import ViewSystemIssueModal from '../Issues/SingleIssue';
import UserProfileModal from '../Users/UserProfile';
import { useDarkMode } from '../../../context/DarkModeContext';
import NotificationBell from './NotificationBell'; // Import the NotificationBell component

const NavBar = () => {
    const { user: currentUser, updateUser } = useAuth();
    const { isDark, toggleDarkMode } = useDarkMode();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const searchRef = useRef(null);

    // State for modal management
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            setResults(response.data);
            setHasSearched(true);
        } catch (err) {
            console.error('Search failed:', err);
            setResults({});
        } finally {
            setIsLoading(false);
        }
    }, 500);

    useEffect(() => {
        if (query) {
            searchCollections(query);
        } else {
            setResults({});
            setHasSearched(false);
        }
    }, [query]);

    const handleItemClick = (item, collection) => {
        setSelectedItem(item);
        setSelectedCollection(collection);
        setIsSearchFocused(false);
        setQuery('');
        setResults({});
    };

    const handleUserProfileClick = () => {
        setShowUserProfile(true);
    };

    const handleProfileUpdate = (updatedUser) => {
        if (updateUser) {
            updateUser(updatedUser);
        }
    };

    const renderResultItem = (collection, item) => {
        const baseClasses = "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex items-start gap-3 transition-all duration-300";

        const onClick = () => handleItemClick(item, collection);

        switch (collection) {
            case 'customers':
                return (
                    <div className={baseClasses} onClick={onClick}>
                        <div className="flex-1">
                            <h4 className="font-medium dark:text-white">{item.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{item.email} | {item.phone}</p>
                            {item.is_ad_hoc && <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded">Ad-hoc</span>}
                        </div>
                    </div>
                );
            case 'devices':
                return (
                    <div className={baseClasses} onClick={onClick}>
                        <div className="flex-1">
                            <h4 className="font-medium dark:text-white">{item.model_number} ({item.serial_number})</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.customer?.name || 'Unknown customer'} | {item.device_type}
                            </p>
                        </div>
                    </div>
                );
            case 'jobs':
                return (
                    <div className={baseClasses} onClick={onClick}>
                        <div className="flex-1">
                            <h4 className="font-medium dark:text-white">Job #{item.job_number}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Status: {item.status} | {item.priority} priority
                            </p>
                        </div>
                    </div>
                );
            case 'parts_requests':
                return (
                    <div className={baseClasses} onClick={onClick}>
                        <div className="flex-1">
                            <h4 className="font-medium dark:text-white">Request #{item._id.slice(-6)}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Status: {item.status} | Urgency: {item.urgency}
                            </p>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className={baseClasses} onClick={onClick}>
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                {item.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="font-medium dark:text-white">{item.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.email} | {item.role.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                );
            case 'system_issues':
                return (
                    <div className={baseClasses} onClick={onClick}>
                        <div className="flex-1">
                            <h4 className="font-medium dark:text-white">{item.title}</h4>
                            <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span>Status: {item.status}</span>
                                <span>Priority: {item.priority}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {item.description}
                            </p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className={baseClasses} onClick={onClick}>
                        <div className="flex-1 dark:text-white">
                            {JSON.stringify(item)}
                        </div>
                    </div>
                );
        }
    };

    const renderResults = () => {
        if (isLoading) {
            return (
                <div className="p-4 text-center">
                    <div className="animate-pulse flex justify-center">
                        <div className="h-2 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                </div>
            );
        }

        if (!hasSearched) {
            return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Type to search customers, devices, jobs, users...
                </div>
            );
        }

        const allResultsEmpty = Object.values(results).every(arr => !arr || arr.length === 0);
        if (allResultsEmpty) {
            return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                </div>
            );
        }

        return (
            <div className="max-h-96 overflow-y-auto">
                {Object.entries(results).map(([collection, items]) => {
                    if (!items || items.length === 0) return null;

                    return (
                        <div key={collection} className="mb-4">
                            <h3 className="px-4 py-2 bg-[#164165] dark:bg-blue-900 text-white font-medium capitalize sticky top-0 z-10">
                                {collection.replace(/_/g, ' ')} ({items.length})
                            </h3>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {items.map((item, index) => (
                                    <div key={`${collection}-${index}`}>
                                        {renderResultItem(collection, item)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <nav className="bg-[#164165] dark:bg-gray-900 relative shadow-lg">
                <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 -ml-2">
                            <a href="/" className="block">
                                <img
                                    src={Logo_PlaceHolder}
                                    alt="Company Logo"
                                    className="h-8 w-auto"
                                />
                            </a>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            {currentUser && (
                                <NotificationBell userId={currentUser._id} />
                            )}

                            <div className="relative w-80" ref={searchRef}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiSearch className="w-5 h-5 text-[#52c3cb] stroke-1" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="block w-full pl-10 pr-10 py-2 rounded-full border-2 border-[#52c3cb] focus:ring-2 focus:ring-[#52c3cb] focus:border-[#52c3cb] bg-white dark:bg-gray-800 text-[#164165] dark:text-white font-semibold transition-all duration-300 hover:shadow-md"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                    />
                                    {query && (
                                        <button
                                            onClick={() => {
                                                setQuery('');
                                                setResults({});
                                                setHasSearched(false);
                                            }}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <FiX className="w-5 h-5 text-[#164165] dark:text-white hover:text-[#52c3cb] transition-colors duration-300" />
                                        </button>
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {isSearchFocused && (
                                    <div className="absolute right-0 z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-[#52c3cb] ring-opacity-20">
                                        {renderResults()}
                                    </div>
                                )}
                            </div>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? (
                                    <FiSun className="w-5 h-5 text-yellow-400" />
                                ) : (
                                    <FiMoon className="w-5 h-5 text-gray-700" />
                                )}
                            </button>

                            {/* User Info */}
                            <div className="flex items-center gap-2">
                                {currentUser ? (
                                    <>
                                        <span className="hidden sm:inline text-sm font-medium text-white">
                                            {currentUser.name || 'User'}
                                        </span>
                                        <button
                                            onClick={handleUserProfileClick}
                                            className="h-8 w-8 rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-all duration-300 border-2 border-[#52c3cb] cursor-pointer overflow-hidden"
                                        >
                                            {currentUser.image_url || currentUser.image_url !== null ? (
                                                <img
                                                    src={currentUser.image.url}
                                                    alt={currentUser.name || 'User'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-[#52c3cb] flex items-center justify-center text-white text-sm font-medium">
                                                    {(currentUser.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-sm text-white">Guest</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* User Profile Modal */}
            {showUserProfile && (
                <UserProfileModal
                    isOpen={showUserProfile}
                    onClose={() => setShowUserProfile(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}

            {/* Modal Renderers */}
            {selectedCollection === 'jobs' && selectedItem && (
                <ViewJobModal
                    isOpen={true}
                    onClose={() => setSelectedItem(null)}
                    jobId={selectedItem._id}
                />
            )}

            {selectedCollection === 'customers' && selectedItem && (
                <ViewCustomerModal
                    isOpen={true}
                    onClose={() => setSelectedItem(null)}
                    customerId={selectedItem._id}
                />
            )}

            {selectedCollection === 'devices' && selectedItem && (
                <ViewDeviceModal
                    isOpen={true}
                    onClose={() => setSelectedItem(null)}
                    deviceId={selectedItem._id}
                />
            )}

            {selectedCollection === 'parts_requests' && selectedItem && (
                <ViewPartsRequestModal
                    isOpen={true}
                    onClose={() => setSelectedItem(null)}
                    requestId={selectedItem._id}
                />
            )}

            {selectedCollection === 'users' && selectedItem && (
                <ViewUserModal
                    isOpen={true}
                    onClose={() => setSelectedItem(null)}
                    userId={selectedItem._id}
                />
            )}

            {selectedCollection === 'system_issues' && selectedItem && (
                <ViewSystemIssueModal
                    isOpen={true}
                    onClose={() => setSelectedItem(null)}
                    issueId={selectedItem._id}
                />
            )}
        </>
    );
};

export default NavBar;