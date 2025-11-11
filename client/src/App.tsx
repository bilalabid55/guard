import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VisitorCheckIn from './pages/VisitorCheckIn';
import AllVisitors from './pages/AllVisitors';
import Companies from './pages/Companies';
import SpecialAccess from './pages/SpecialAccess';
import BannedList from './pages/BannedList';
import Reports from './pages/Reports';
import Emergency from './pages/Emergency';
import AdminDashboard from './pages/AdminDashboard';
import PreRegistrationInvite from './pages/PreRegistrationInvite';
import PreRegistrationForm from './pages/PreRegistrationForm';
import SubscriptionManagement from './pages/SubscriptionManagement';
import Register from './pages/Register';
import Subscribe from './pages/Subscribe';
import UserManagement from './pages/UserManagement';
import Activities from './pages/Activities';
import AccessPointManagement from './pages/AccessPointManagement';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0e1b33', // navy from logo
      dark: '#1f3b63',
      light: '#2e86de',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2e86de', // accent blue
    },
    warning: {
      main: '#F57C00',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#388E3C',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager', 'security_guard', 'receptionist']}>
                    <Layout>
                      <VisitorCheckIn />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visitors"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager', 'security_guard', 'receptionist']}>
                    <Layout>
                      <AllVisitors />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-management"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager']}>
                    <Layout>
                      <Companies />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/special-access"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager']}>
                    <Layout>
                      <SpecialAccess />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/banned-list"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager']}>
                    <Layout>
                      <BannedList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager']}>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergency"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Emergency />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscribe"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Subscribe />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preregistration-invite"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PreRegistrationInvite />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preregistration/:token"
                element={<PreRegistrationForm />}
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <SubscriptionManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Activities />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/access-points"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'site_manager']}>
                    <Layout>
                      <AccessPointManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;