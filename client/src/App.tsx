import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { connectSocket, disconnectSocket } from './services/socket';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssue } from './pages/Report';
import { AdminDashboard } from './pages/Admin';
import { FieldWorker } from './pages/Worker';

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();

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
      <div className="flex items-center justify-center min-h-screen bg-civic-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-civic-orange border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-medium text-civic-muted">Loading FixIt...</div>
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
    <Routes>
      {/* Public */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardPath()} replace />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to={getDashboardPath()} replace />} />

      {/* Citizen */}
      <Route
        path="/citizen"
        element={
          <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
            <CitizenDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/citizen/report"
        element={
          <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
            <ReportIssue />
          </RoleProtectedRoute>
        }
      />

      {/* Worker */}
      <Route
        path="/worker"
        element={
          <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
            <FieldWorker />
          </RoleProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="/" element={<Navigate to={getDashboardPath()} replace />} />
      <Route path="*" element={<Navigate to={getDashboardPath()} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
