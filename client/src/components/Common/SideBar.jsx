import React from 'react';
import { FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from './Button';
import { useDarkMode } from '../../../context/DarkModeContext';

const SideBar = ({
    links,
    onLinkClick,
    activeView,
    signout,
    isCollapsed,
    toggleCollapse,
}) => {
    const { isDark } = useDarkMode();

    return (
        <div
            className={`h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-56'}`}
        >
            {/* Collapse/Expand Button */}
            <div className="p-4 flex justify-end">
                <Button
                    onClick={toggleCollapse}
                    size="xs"
                    className="!p-1 !bg-transparent !text-gray-600 dark:!text-gray-300 !border-none !shadow-none hover:!bg-gray-100 dark:hover:!bg-gray-700"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    leftIcon={
                        isCollapsed ? (
                            <FiChevronRight className="w-5 h-5 stroke-1" />
                        ) : (
                            <FiChevronLeft className="w-5 h-5 stroke-1" />
                        )
                    }
                />
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {links.map((link) => (
                    <div key={link.view} className="py-1">
                        <Button
                            onClick={() => onLinkClick(link.view)}
                            size="sm"
                            className={`w-full !justify-start !rounded-full ${isCollapsed ? '!justify-center !px-0' : ''
                                } ${activeView === link.view
                                    ? '!bg-[#52c3cb] !text-white hover:!bg-[#52c3cb]/90'
                                    : '!bg-transparent !text-[#1E4065] dark:!text-gray-300 hover:!bg-[#52c3cb]/10 dark:hover:!bg-gray-700'
                                }`}
                            title={link.name}
                            leftIcon={
                                <link.icon className="w-5 h-5 stroke-1 flex-shrink-0" />
                            }
                            marginClass="!m-0"
                        >
                            {!isCollapsed && <span className="ml-3 truncate">{link.name}</span>}
                        </Button>
                    </div>
                ))}
            </div>

            {/* Sign Out Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    onClick={signout}
                    size="sm"
                    className={`w-full !justify-start !rounded-full ${isCollapsed ? '!justify-center !px-0' : ''
                        } !bg-transparent !text-[#1E4065] dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700`}
                    title={isCollapsed ? 'Sign Out' : ''}
                    leftIcon={<FiLogOut className="w-5 h-5" />}
                    marginClass="!m-0"
                >
                    {!isCollapsed && <span className="ml-3 truncate">Sign Out</span>}
                </Button>
            </div>
        </div>
    );
};

export default SideBar;