import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../context/DarkModeContext'; // Import dark mode hook
import SideBar from './SideBar';
import NavBar from './NavBar';

const DashboardLayout = ({
    sidebarLinks,
    activeView,
    onLinkClick,
    children,
    customSignout,
}) => {
    const { signout: contextSignout, user } = useAuth();
    const { isDark } = useDarkMode(); // Get dark mode state
    const handleSignout = customSignout || contextSignout;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Allow scrolling only for analytics view
    const shouldScroll = activeView === 'analytics';

    // Load sidebar collapsed state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState) {
            setIsSidebarCollapsed(savedState === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
    };

    const toggleMobileSidebar = () => {
        setShowMobileSidebar(!showMobileSidebar);
    };

    const handleLinkClick = (view) => {
        onLinkClick(view);
        if (window.innerWidth < 768) {
            setShowMobileSidebar(false);
        }
    };

    return (
        <div className={`flex flex-col h-screen ${isDark ? 'dark' : ''}`}>
            {/* Top Navigation Bar */}
            <NavBar
                user={user}
                onMenuToggle={toggleMobileSidebar}
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900">
                {/* Sidebar (slides in on mobile) */}
                <div
                    className={`h-full transition-all duration-300 ease-in-out transform md:relative z-20
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                >
                    <SideBar
                        links={sidebarLinks}
                        onLinkClick={handleLinkClick}
                        activeView={activeView}
                        signout={handleSignout}
                        isCollapsed={isSidebarCollapsed}
                        toggleCollapse={toggleSidebar}
                    />
                </div>

                {/* Dark Overlay for Mobile */}
                {showMobileSidebar && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-40 z-10 md:hidden"
                        onClick={() => setShowMobileSidebar(false)}
                    ></div>
                )}

                {/* Main Content */}
                <main
                    className={`flex-1 h-full transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900
          ${isSidebarCollapsed ? 'md:ml-0' : ''} ${shouldScroll ? 'overflow-y-auto' : 'overflow-hidden'
                        }`}
                >
                    <div
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm  h-full ${isSidebarCollapsed ? 'mx-1' : ''
                            }`}
                    >
                        {children || (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                Select a view from the sidebar
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;