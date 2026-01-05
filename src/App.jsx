import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Enquiries from './pages/Enquiries';
import FollowUps from './pages/FollowUps';
import Cars from './pages/Cars';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import LeadWorkspace from './pages/LeadWorkspace';
import Settings from './pages/Settings/Settings';
import AppConfig from './pages/Settings/AppConfig';
import UserConfig from './pages/Settings/UserConfig';
import BranchConfig from './pages/Settings/BranchConfig';
import RoleConfig from './pages/Settings/RoleConfig';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastProvider } from './context/ToastContext';
import { OptionsProvider } from './context/OptionsContext';

function App() {
  return (
    <AuthProvider>
      <OptionsProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="enquiries" element={<ProtectedRoute allowedRoles={['SALES_REP', 'SALES_MGR']}><Enquiries /></ProtectedRoute>} />
                <Route path="profile" element={<UserProfile />} />

                {/* Admin/Super User Only Pages */}
                <Route path="customers" element={<ProtectedRoute allowedRoles={[]}><Customers /></ProtectedRoute>} />
                <Route path="follow-ups" element={<ProtectedRoute allowedRoles={[]}><FollowUps /></ProtectedRoute>} />
                <Route path="cars" element={<ProtectedRoute allowedRoles={[]}><Cars /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['HR_MGR']}><Users /></ProtectedRoute>} />

                <Route path="settings" element={<ProtectedRoute allowedRoles={['HR_MGR']}><Settings /></ProtectedRoute>}>
                  <Route index element={<SettingsRedirect />} />
                  <Route path="app-config" element={<ProtectedRoute allowedRoles={['APP_OWNER', 'SYS_ADMIN', 'DEV']}><AppConfig /></ProtectedRoute>} />
                  <Route path="role-config" element={<ProtectedRoute allowedRoles={['APP_OWNER', 'SYS_ADMIN', 'DEV']}><RoleConfig /></ProtectedRoute>} />
                  <Route path="user-config" element={<ProtectedRoute allowedRoles={['HR_MGR']}><UserConfig /></ProtectedRoute>} />
                  <Route path="branch-config" element={<ProtectedRoute allowedRoles={['APP_OWNER', 'SYS_ADMIN', 'DEV']}><BranchConfig /></ProtectedRoute>} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </OptionsProvider>
    </AuthProvider>
  );
}

const SettingsRedirect = () => {
  const { user } = useContext(AuthContext);
  const isHR = user?.role === 'HR_MGR';
  return <Navigate to={isHR ? "user-config" : "app-config"} replace />;
};

export default App;
