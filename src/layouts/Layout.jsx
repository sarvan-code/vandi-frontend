import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Car, Calendar, User, Menu, X, LogOut, Briefcase, Settings as SettingsIcon, ChevronDown, ChevronRight, Database, Building2, ShieldAlert, DollarSign, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { AuthContext } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useFinanceWorkspace } from '../context/FinanceWorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import LeadWorkspace from '../pages/LeadWorkspace';
import FinanceWorkspaceOverlay from '../components/FinanceWorkspaceOverlay';
import Logo from '../components/Logo';

import IdleMonitor from '../components/IdleMonitor';
import '../components/Loading.css';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const { isWorkspaceOpen, isWorkspaceMinimized, openWorkspace, closeWorkspace, toggleMinimize } = useWorkspace();
    const { isFinanceOpen, financeTabs, openFinanceTab, toggleFinanceMinimize, closeFinanceWorkspace } = useFinanceWorkspace();
    const { theme, toggleTheme } = useTheme();

    let navItems = [];
    if (user?.userStatus === 'ACTIVE') {
        const role = user.role;
        const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(role);
        const isHR = ['HR_MGR', 'HR_ASSIS'].includes(role);
        const isSales = ['SALES_REP', 'SALES_MGR'].includes(role);
        const isExecutive = role === 'EXECUTIVE';
        const isAccountant = role === 'ACCOUNTANT';

        navItems.push({ name: 'Dashboard', path: '/', icon: LayoutDashboard });

        if (isSales || isExecutive || isSuperUser) {
            navItems.push({
                name: 'Lead Workspace',
                icon: Briefcase,
                onClick: () => openWorkspace()
            });
            navItems.push({ name: 'Enquiries', path: '/enquiries', icon: MessageSquare });
        }

        if (isSuperUser || isExecutive) {
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
                        window.location.href = '/bookings';
                    }
                }
            });
            navItems.push({ name: 'Bookings', path: '/bookings', icon: Database });
        }

        if (isSuperUser || isExecutive || isHR) {
            navItems.push({ name: 'Users', path: '/users', icon: Users });
        }

        if (isSuperUser || isHR) {
            const settingsItems = [];
            if (isSuperUser) {
                settingsItems.push({ name: 'Application Config', path: '/settings/app-config', icon: Database });
                settingsItems.push({ name: 'Role Config', path: '/settings/role-config', icon: ShieldAlert });
                settingsItems.push({ name: 'Branch Config', path: '/settings/branch-config', icon: Building2 });
            }
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
            <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

                {/* Header */}
                <header
                    style={{
                        paddingTop: 'var(--safe-area-top)',
                        height: 'calc(3.5rem + var(--safe-area-top))',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border)'
                    }}
                    className="flex items-center justify-between px-4 z-40 shrink-0"
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (window.innerWidth < 1024) {
                                    setIsSidebarOpen(!isSidebarOpen);
                                } else {
                                    setIsSidebarExpanded(!isSidebarExpanded);
                                }
                            }}
                            className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Toggle menu"
                        >
                            <Menu size={20} />
                        </button>

                        <Link to="/" className="flex items-center gap-3">
                            <Logo size={32} animateOnHover={true} />
                            <span className="text-lg font-bold hidden sm:block" style={{ color: 'var(--accent)' }}>VANDI</span>
                        </Link>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                                title="Profile"
                            >
                                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
                                    <User size={16} />
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-xs font-medium truncate max-w-[100px]" style={{ color: 'var(--text-primary)' }}>
                                        {user?.fullName?.split(' ')[0]}
                                    </p>
                                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{user?.role?.replace(/_/g, ' ')}</p>
                                </div>
                            </button>

                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-1 w-64 card p-1 z-50 animate-fade-in" style={{ background: 'var(--surface)' }}>
                                        <div className="p-3 rounded-md mb-1" style={{ background: 'var(--bg-tertiary)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
                                                    <User size={20} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
                                                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                                            style={{ color: 'var(--text-primary)' }}
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <User size={16} />
                                            View Profile
                                        </Link>
                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[var(--danger-bg)] transition-colors"
                                            style={{ color: 'var(--danger)' }}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden relative z-10">
                    {/* Sidebar */}
                    <aside
                        style={{
                            top: 'calc(3.5rem + var(--safe-area-top))',
                            background: 'var(--bg-secondary)',
                            borderRight: '1px solid var(--border)'
                        }}
                        className={clsx(
                            "fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto overflow-hidden",
                            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                            isSidebarExpanded ? "w-56" : "lg:w-16"
                        )}
                    >
                        {/* Mobile Close */}
                        <div className="lg:hidden flex justify-end p-3">
                            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="p-2 space-y-0.5 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(2.5rem + var(--safe-area-bottom))' }}>
                                {navItems.map((item) => {
                                    const hasSubItems = item.subItems && item.subItems.length > 0;
                                    const isPathActive = location.pathname === item.path || (hasSubItems && item.subItems.some(sub => location.pathname === sub.path));

                                    return (
                                        <div key={item.name} className="space-y-0.5">
                                            {item.path ? (
                                                <Link
                                                    to={item.path}
                                                    className={clsx(
                                                        "flex items-center px-3 py-2.5 rounded-md transition-colors relative group text-sm",
                                                        isPathActive
                                                            ? "font-semibold"
                                                            : "hover:bg-[var(--bg-tertiary)]"
                                                    )}
                                                    style={isPathActive ? {
                                                        background: 'var(--accent-bg)',
                                                        color: 'var(--accent-text)',
                                                        borderLeft: '3px solid var(--accent)'
                                                    } : {
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                    onClick={() => {
                                                        if (hasSubItems && isSidebarExpanded) {
                                                            setIsSettingsExpanded(!isSettingsExpanded);
                                                        }
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    title={!isSidebarExpanded ? item.name : ""}
                                                >
                                                    <div className="min-w-[1.75rem] flex items-center justify-center">
                                                        <item.icon className="w-[18px] h-[18px]" />
                                                    </div>
                                                    <span className={clsx(
                                                        "ml-2 text-sm transition-all duration-200 whitespace-nowrap overflow-hidden flex-1",
                                                        !isSidebarExpanded && "opacity-0 w-0 ml-0",
                                                        isSidebarExpanded && "opacity-100 w-auto"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                    {hasSubItems && isSidebarExpanded && (
                                                        <div className="ml-auto opacity-60">
                                                            {isSettingsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </div>
                                                    )}
                                                </Link>
                                            ) : (
                                                <button
                                                    className={clsx(
                                                        "w-full flex items-center px-3 py-2.5 rounded-md transition-colors relative group text-sm",
                                                        (isWorkspaceOpen && item.name === 'Lead Workspace')
                                                            ? "font-semibold"
                                                            : "hover:bg-[var(--bg-tertiary)]"
                                                    )}
                                                    style={(isWorkspaceOpen && item.name === 'Lead Workspace') ? {
                                                        background: 'var(--accent-bg)',
                                                        color: 'var(--accent-text)',
                                                        borderLeft: '3px solid var(--accent)'
                                                    } : {
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                    onClick={() => {
                                                        if (item.onClick) item.onClick();
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    title={!isSidebarExpanded ? item.name : ""}
                                                >
                                                    <div className="min-w-[1.75rem] flex items-center justify-center">
                                                        <item.icon className="w-[18px] h-[18px]" />
                                                    </div>
                                                    <span className={clsx(
                                                        "ml-2 text-sm transition-all duration-200 whitespace-nowrap overflow-hidden flex-1 text-left",
                                                        !isSidebarExpanded && "opacity-0 w-0 ml-0",
                                                        isSidebarExpanded && "opacity-100 w-auto"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                </button>
                                            )}

                                            {/* Sub Items */}
                                            {hasSubItems && isSidebarExpanded && isSettingsExpanded && (
                                                <div className="space-y-0.5 ml-5 pl-3" style={{ borderLeft: '1px solid var(--border)' }}>
                                                    {item.subItems.map((sub) => {
                                                        const isSubActive = location.pathname === sub.path;
                                                        return (
                                                            <Link
                                                                key={sub.name}
                                                                to={sub.path}
                                                                className={clsx(
                                                                    "flex items-center px-3 py-2 rounded-md transition-colors text-sm",
                                                                    isSubActive ? "font-medium" : ""
                                                                )}
                                                                style={isSubActive ? {
                                                                    background: 'var(--accent-bg)',
                                                                    color: 'var(--accent-text)'
                                                                } : {
                                                                    color: 'var(--text-muted)'
                                                                }}
                                                                onClick={() => setIsSidebarOpen(false)}
                                                            >
                                                                <div className="min-w-[1.5rem] flex items-center justify-center">
                                                                    <sub.icon className="w-4 h-4" />
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
                            style={{
                                top: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
                                background: 'var(--overlay)'
                            }}
                            className="fixed inset-0 z-20 lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6" style={{ background: 'var(--bg-primary)', paddingBottom: 'calc(5.5rem + var(--safe-area-bottom))' }}>
                            <div className="max-w-[1400px] mx-auto min-h-full">
                                <Outlet />
                            </div>
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
