import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Car, Calendar, User, Menu, X, LogOut, Briefcase, Settings as SettingsIcon, ChevronDown, ChevronRight, Database, Building2, ShieldAlert, DollarSign } from 'lucide-react';
import clsx from 'clsx';
import { AuthContext } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useFinanceWorkspace } from '../context/FinanceWorkspaceContext';
import LeadWorkspace from '../pages/LeadWorkspace';
import FinanceWorkspaceOverlay from '../components/FinanceWorkspaceOverlay';

import IdleMonitor from '../components/IdleMonitor';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Desktop collapse
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false); // Sub-menu toggle
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Profile dropdown
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const { isWorkspaceOpen, isWorkspaceMinimized, openWorkspace, closeWorkspace, toggleMinimize } = useWorkspace();
    const { isFinanceOpen, financeTabs, openFinanceTab, toggleFinanceMinimize, closeFinanceWorkspace } = useFinanceWorkspace();

    let navItems = [];
    if (user?.userStatus === 'ACTIVE') {
        const role = user.role;
        const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(role);
        const isHR = ['HR_MGR', 'HR_ASSIS'].includes(role);
        const isSales = ['SALES_REP', 'SALES_MGR'].includes(role);
        const isExecutive = role === 'EXECUTIVE';
        const isAccountant = role === 'ACCOUNTANT';

        // Dashboard is for everyone
        navItems.push({ name: 'Dashboard', path: '/', icon: LayoutDashboard });

        if (isSales || isExecutive || isSuperUser) {
            // Sales, Executive, and Super Users: Lead Workspace and Enquiries
            navItems.push({
                name: 'Lead Workspace',
                icon: Briefcase,
                onClick: () => openWorkspace()
            });
            navItems.push({ name: 'Enquiries', path: '/enquiries', icon: MessageSquare });
        }

        if (isSuperUser || isExecutive) {
            // Super users and Executives have access to operational data
            navItems.push({ name: 'Customers', path: '/customers', icon: Users });
            navItems.push({ name: 'Follow Ups', path: '/follow-ups', icon: Calendar });
        }

        if (isSuperUser || isExecutive || isSales) {
            navItems.push({ name: 'Cars', path: '/cars', icon: Car });
        }

        if (isSuperUser || isAccountant) {
            navItems.push({
                name: 'Finance Workspace',
                icon: DollarSign,
                onClick: () => {
                    if (financeTabs.length > 0) {
                        openFinanceTab(financeTabs[0].enquiryId, financeTabs[0].title);
                    } else {
                        // If no tabs, just navigate to bookings to start one
                        // or show a message. For now, navigate.
                        window.location.href = '/bookings';
                    }
                }
            });
            navItems.push({ name: 'Finance List', path: '/bookings', icon: Database });
        }

        if (isSuperUser || isExecutive || isHR) {
            // Users list is for HR as well
            navItems.push({ name: 'Users', path: '/users', icon: Users });
        }

        if (isSuperUser || isHR) {
            const settingsItems = [];
            if (isSuperUser) {
                settingsItems.push({ name: 'Application Config', path: '/settings/app-config', icon: Database });
                settingsItems.push({ name: 'Role Config', path: '/settings/role-config', icon: ShieldAlert });
                settingsItems.push({ name: 'Branch Config', path: '/settings/branch-config', icon: Building2 });
            }
            // User Config is for both super users and HR
            settingsItems.push({ name: 'User Config', path: '/settings/user-config', icon: Users });

            navItems.push({
                name: 'Settings',
                path: '/settings',
                icon: SettingsIcon,
                subItems: settingsItems
            });
        }
    }

    return (
        <IdleMonitor>
            <div className="flex flex-col h-screen bg-gray-100">
                {/* Top Header - Gmail Style */}
                <header className="flex items-center justify-between h-16 px-4 bg-white shadow-sm z-40 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Hamburger Menu */}
                        <button
                            onClick={() => {
                                if (window.innerWidth < 1024) {
                                    setIsSidebarOpen(!isSidebarOpen);
                                } else {
                                    setIsSidebarExpanded(!isSidebarExpanded);
                                }
                            }}
                            className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            title="Toggle menu"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Logo and Name */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-2xl">V</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600 hidden sm:block">ANDI</span>
                        </div>
                    </div>

                    {/* Right Side - Profile and Logout */}
                    <div className="flex items-center gap-2">
                        {/* Profile Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Profile"
                            >
                                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                                    <User size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[150px] truncate">
                                    {user?.fullName}
                                </span>
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="border-t border-gray-100 my-1" />
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                            <span className="text-sm font-medium hidden md:block">Logout</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Gmail Style */}
                    <aside className={clsx(
                        "fixed inset-y-0 left-0 top-16 z-30 bg-white shadow-md transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto overflow-hidden",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                        isSidebarExpanded ? "w-64" : "lg:w-16"
                    )}>
                        {/* Mobile Close Button */}
                        <div className="lg:hidden flex justify-end p-2 border-b">
                            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="p-3 space-y-1 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                                {navItems.map((item) => {
                                    const isSettings = item.name === 'Settings';
                                    const hasSubItems = item.subItems && item.subItems.length > 0;
                                    const isPathActive = location.pathname === item.path || (hasSubItems && item.subItems.some(sub => location.pathname === sub.path));

                                    return (
                                        <div key={item.name} className="space-y-1">
                                            {item.path ? (
                                                <Link
                                                    to={item.path}
                                                    className={clsx(
                                                        "flex items-center px-3 py-2.5 rounded-lg transition-all relative group",
                                                        isPathActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                                                    )}
                                                    onClick={(e) => {
                                                        if (hasSubItems && isSidebarExpanded) {
                                                            setIsSettingsExpanded(!isSettingsExpanded);
                                                        }
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    title={!isSidebarExpanded ? item.name : ""}
                                                >
                                                    <div className="min-w-[2rem] flex items-center justify-center">
                                                        <item.icon className={clsx("w-5 h-5", isPathActive ? "text-blue-600" : "text-gray-500")} />
                                                    </div>
                                                    <span className={clsx(
                                                        "ml-3 font-medium transition-all duration-300 whitespace-nowrap overflow-hidden flex-1",
                                                        !isSidebarExpanded && "opacity-0 w-0 ml-0",
                                                        isSidebarExpanded && "opacity-100 w-auto"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                    {hasSubItems && isSidebarExpanded && (
                                                        <div className="ml-auto">
                                                            {isSettingsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </div>
                                                    )}
                                                </Link>
                                            ) : (
                                                <button
                                                    className={clsx(
                                                        "w-full flex items-center px-3 py-2.5 rounded-lg transition-all relative group",
                                                        isWorkspaceOpen && item.name === 'Lead Workspace' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                                                    )}
                                                    onClick={(e) => {
                                                        if (item.onClick) item.onClick();
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    title={!isSidebarExpanded ? item.name : ""}
                                                >
                                                    <div className="min-w-[2rem] flex items-center justify-center">
                                                        <item.icon className={clsx("w-5 h-5", (isWorkspaceOpen && item.name === 'Lead Workspace') ? "text-blue-600" : "text-gray-500")} />
                                                    </div>
                                                    <span className={clsx(
                                                        "ml-3 font-medium transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 text-left",
                                                        !isSidebarExpanded && "opacity-0 w-0 ml-0",
                                                        isSidebarExpanded && "opacity-100 w-auto"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                </button>
                                            )}

                                            {/* Sub Items */}
                                            {hasSubItems && isSidebarExpanded && isSettingsExpanded && (
                                                <div className="space-y-1 ml-4 animate-fade-in-down overflow-hidden">
                                                    {item.subItems.map((sub) => {
                                                        const isSubActive = location.pathname === sub.path;
                                                        return (
                                                            <Link
                                                                key={sub.name}
                                                                to={sub.path}
                                                                className={clsx(
                                                                    "flex items-center px-3 py-2 rounded-lg transition-all relative group",
                                                                    isSubActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                                                                )}
                                                                onClick={() => setIsSidebarOpen(false)}
                                                            >
                                                                <div className="min-w-[1.75rem] flex items-center justify-center">
                                                                    <sub.icon className={clsx(
                                                                        "w-4 h-4",
                                                                        isSubActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-400"
                                                                    )} />
                                                                </div>
                                                                <span className="text-sm truncate ml-2">{sub.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </nav>
                    </aside>

                    {/* Mobile Overlay */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden top-16"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                            <Outlet />
                        </main>

                        {isWorkspaceOpen && (
                            <LeadWorkspace
                                isMinimized={isWorkspaceMinimized}
                                onMinimize={toggleMinimize}
                                onClose={closeWorkspace}
                            />
                        )}

                        {isFinanceOpen && (
                            <FinanceWorkspaceOverlay />
                        )}
                    </div>
                </div>
            </div>
        </IdleMonitor>
    );
};

export default Layout;
