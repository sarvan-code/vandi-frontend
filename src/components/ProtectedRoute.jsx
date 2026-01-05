import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen text-blue-600 font-semibold">Loading Access Control...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Role-based restriction (Super users always allowed)
    const superRoles = ['APP_OWNER', 'SYS_ADMIN', 'DEV'];
    if (allowedRoles && !superRoles.includes(user.role) && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // userStatus restriction
    if (user.userStatus === 'INACTIVE') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    // NEW status: Only allow /profile
    if (user.userStatus === 'NEW' && location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
    }

    return children;
};

export default ProtectedRoute;
