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
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header section is already handled by individual sub-pages for more control, 
                but we can add a subtle shared context here if needed. 
                For now, let's keep it clean since AppConfig and RoleConfig have their own titles. */}

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto p-2 md:p-8 no-scrollbar">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Settings;
