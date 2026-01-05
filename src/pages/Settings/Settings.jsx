import React, { useContext } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { AuthContext } from '../../context/AuthContext';
import { Settings as SettingsIcon, Database, Users, Building2, Menu } from 'lucide-react';

const Settings = () => {
    const { user } = useContext(AuthContext);

    if (!['APP_OWNER', 'SYS_ADMIN', 'DEV', 'HR_MGR'].includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 animate-fade-in">
            <div className="bg-white border-b px-6 py-4 flex items-center shadow-sm shrink-0">
                <SettingsIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-bold text-gray-800">Settings & Configuration</h1>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Content Area - Now full width since sub-menu is in main sidebar */}
                <div className="flex-1 overflow-auto p-6 no-scrollbar">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Settings;
