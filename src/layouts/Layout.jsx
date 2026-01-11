import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Car, Calendar, User, Menu, X, LogOut, Briefcase, Settings as SettingsIcon, ChevronDown, ChevronRight, Database, Building2, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { AuthContext } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import LeadWorkspace from '../pages/LeadWorkspace';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Desktop collapse
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false); // Sub-menu toggle
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const { isWorkspaceOpen, isWorkspaceMinimized, openWorkspace, closeWorkspace, toggleMinimize } = useWorkspace();

    let navItems = [];
    if (user?.userStatus === 'ACTIVE') {
        const role = user.role;
        const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(role);
        const isHR = ['HR_MGR', 'HR_ASSIS'].includes(role);
        const isSales = ['SALES_REP', 'SALES_MGR'].includes(role);
        const isExecutive = role === 'EXECUTIVE';

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
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 bg-white shadow-md transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto overflow-hidden",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                isSidebarExpanded ? "w-64" : "lg:w-20"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xl">V</span>
                        </div>
                        <span className={clsx(
                            "text-2xl font-bold text-blue-600 transition-all duration-300 whitespace-nowrap",
                            !isSidebarExpanded && "opacity-0 invisible w-0 -translate-x-4",
                            isSidebarExpanded && "opacity-100 visible w-auto translate-x-0"
                        )}>
                            ANDI
                        </span>
                    </div>
                    <button className="hidden lg:block text-gray-500 hover:text-blue-600" onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}>
                        <Menu size={20} />
                    </button>
                    <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="p-4 space-y-2 flex flex-col h-[calc(100%-4rem)] overflow-hidden">
                    <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
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
                                                "flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors relative group",
                                                isPathActive && !isSettingsExpanded && "bg-blue-50 text-blue-600"
                                            )}
                                            onClick={(e) => {
                                                if (hasSubItems && isSidebarExpanded) {
                                                    setIsSettingsExpanded(!isSettingsExpanded);
                                                }
                                                setIsSidebarOpen(false);
                                            }}
                                            title={!isSidebarExpanded ? item.name : ""}
                                        >
                                            <div className="min-w-[2.5rem] flex items-center justify-center">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className={clsx(
                                                "font-medium transition-all duration-300 whitespace-nowrap overflow-hidden flex-1",
                                                !isSidebarExpanded && "opacity-0 w-0 -translate-x-4",
                                                isSidebarExpanded && "opacity-100 w-auto translate-x-0"
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
                                                "w-full flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors relative group",
                                                isWorkspaceOpen && item.name === 'Lead Workspace' && "bg-blue-50 text-blue-600"
                                            )}
                                            onClick={(e) => {
                                                if (item.onClick) item.onClick();
                                                setIsSidebarOpen(false);
                                            }}
                                            title={!isSidebarExpanded ? item.name : ""}
                                        >
                                            <div className="min-w-[2.5rem] flex items-center justify-center">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className={clsx(
                                                "font-medium transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 text-left",
                                                !isSidebarExpanded && "opacity-0 w-0 -translate-x-4",
                                                isSidebarExpanded && "opacity-100 w-auto translate-x-0"
                                            )}>
                                                {item.name}
                                            </span>
                                        </button>
                                    )}

                                    {/* Sub Items */}
                                    {hasSubItems && isSidebarExpanded && isSettingsExpanded && (
                                        <div className="space-y-1 ml-4 animate-fade-in-down overflow-hidden">
                                            {item.subItems.map((sub) => (
                                                <Link
                                                    key={sub.name}
                                                    to={sub.path}
                                                    className={clsx(
                                                        "flex items-center px-3 py-1.5 rounded-lg transition-colors group",
                                                        location.pathname === sub.path ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-500 hover:bg-gray-50"
                                                    )}
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <div className="min-w-[2rem] flex items-center justify-center">
                                                        <sub.icon className={clsx(
                                                            "w-4 h-4",
                                                            location.pathname === sub.path ? "text-blue-500" : "text-gray-400 group-hover:text-blue-400"
                                                        )} />
                                                    </div>
                                                    <span className="text-sm truncate">{sub.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t pt-4 shrink-0 overflow-hidden">
                        <Link to="/profile" className="block px-3 py-2 hover:bg-gray-50 transition-colors rounded-lg mb-2" onClick={() => setIsSidebarOpen(false)}>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                                    <User size={20} />
                                </div>
                                <div className={clsx(
                                    "overflow-hidden transition-all duration-300",
                                    !isSidebarExpanded && "opacity-0 w-0 -translate-x-4",
                                    isSidebarExpanded && "opacity-100 w-auto translate-x-0"
                                )}>
                                    <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                            title={!isSidebarExpanded ? "Logout" : ""}
                        >
                            <div className="min-w-[2.5rem] flex items-center justify-center">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className={clsx(
                                "font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                                !isSidebarExpanded && "opacity-0 w-0 -translate-x-4",
                                isSidebarExpanded && "opacity-100 w-auto translate-x-0"
                            )}>
                                Logout
                            </span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-6 bg-white shadow-sm lg:hidden">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} className="text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-800">VANDI</span>
                    {/* Mobile User Menu could go here, for now just spacer */}
                    <div className="w-6"></div>
                </header>

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
            </div>
        </div>
    );
};

export default Layout;
