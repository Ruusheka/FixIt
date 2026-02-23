import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { GlobalAnimationWrapper } from './components/GlobalAnimationWrapper';
import { connectSocket, disconnectSocket } from './services/socket';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssue } from './pages/Report';
import { AdminDashboard } from './pages/Admin';
import { FieldWorker } from './pages/Worker';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';

const AnimatedRoutes = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
          <div className="text-sm font-bold tracking-widest text-brand-secondary/40 uppercase">Initialising FixIt</div>
        </div>
      </div>
    );
  }

  const getDashboardPath = () => {
    if (!profile) return '/login';
    switch (profile.role) {
      case 'admin': return '/admin';
      case 'worker': return '/worker';
      case 'citizen':
      default: return '/citizen';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route
          path="/login"
          element={
            !user ? (
              <GlobalAnimationWrapper>
                <Login />
              </GlobalAnimationWrapper>
            ) : <Navigate to={getDashboardPath()} replace />
          }
        />
        <Route
          path="/signup"
          element={
            !user ? (
              <GlobalAnimationWrapper>
                <Signup />
              </GlobalAnimationWrapper>
            ) : <Navigate to={getDashboardPath()} replace />
          }
        />

        {/* Citizen */}
        <Route
          path="/citizen"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <CitizenDashboard />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/citizen/report"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <ReportIssue />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Reports Hub */}
        <Route
          path="/reports"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <ReportsPage />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <ReportDetailPage />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Worker */}
        <Route
          path="/worker"
          element={
            <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
              <GlobalAnimationWrapper>
                <FieldWorker />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <GlobalAnimationWrapper>
                <AdminDashboard />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to={getDashboardPath()} replace />} />
        <Route path="*" element={<Navigate to={getDashboardPath()} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
