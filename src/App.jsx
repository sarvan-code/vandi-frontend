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
import Bookings from './pages/Bookings';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastProvider } from './context/ToastContext';
import { OptionsProvider } from './context/OptionsContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { FinanceWorkspaceProvider } from './context/FinanceWorkspaceContext';
import Loading from './components/Loading';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Loading />
        <OptionsProvider>
          <WorkspaceProvider>
            <FinanceWorkspaceProvider>
              <ToastProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route index element={<Dashboard />} />
                      <Route path="enquiries" element={<ProtectedRoute allowedRoles={['SALES_REP', 'SALES_MGR', 'EXECUTIVE']}><Enquiries /></ProtectedRoute>} />
                      <Route path="profile" element={<UserProfile />} />

                      {/* Admin/Super User Only Pages */}
                      <Route path="customers" element={<ProtectedRoute allowedRoles={['EXECUTIVE']}><Customers /></ProtectedRoute>} />
                      <Route path="follow-ups" element={<ProtectedRoute allowedRoles={['EXECUTIVE']}><FollowUps /></ProtectedRoute>} />
                      <Route path="cars" element={<ProtectedRoute allowedRoles={['EXECUTIVE', 'SALES_REP', 'SALES_MGR']}><Cars /></ProtectedRoute>} />
                      <Route path="users" element={<ProtectedRoute allowedRoles={['HR_MGR', 'HR_ASSIS', 'EXECUTIVE']}><Users /></ProtectedRoute>} />

                      {/* Finance Routes */}
                      <Route path="bookings" element={<ProtectedRoute allowedRoles={['ACCOUNTANT', 'EXECUTIVE']}><Bookings /></ProtectedRoute>} />

                      <Route path="settings" element={<ProtectedRoute allowedRoles={['HR_MGR', 'HR_ASSIS']}><Settings /></ProtectedRoute>}>
                        <Route index element={<SettingsRedirect />} />
                        <Route path="app-config" element={<ProtectedRoute allowedRoles={['APP_OWNER', 'SYS_ADMIN', 'DEV']}><AppConfig /></ProtectedRoute>} />
                        <Route path="role-config" element={<ProtectedRoute allowedRoles={['APP_OWNER', 'SYS_ADMIN', 'DEV']}><RoleConfig /></ProtectedRoute>} />
                        <Route path="user-config" element={<ProtectedRoute allowedRoles={['HR_MGR', 'HR_ASSIS']}><UserConfig /></ProtectedRoute>} />
                        <Route path="branch-config" element={<ProtectedRoute allowedRoles={['APP_OWNER', 'SYS_ADMIN', 'DEV']}><BranchConfig /></ProtectedRoute>} />
                      </Route>
                    </Route>
                  </Routes>
                </Router>
              </ToastProvider>
            </FinanceWorkspaceProvider>
          </WorkspaceProvider>
        </OptionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const SettingsRedirect = () => {
  const { user } = useContext(AuthContext);
  const isHR = ['HR_MGR', 'HR_ASSIS'].includes(user?.role);
  return <Navigate to={isHR ? "user-config" : "app-config"} replace />;
};

export default App;
