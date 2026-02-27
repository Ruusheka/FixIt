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
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ReportIssue } from './pages/Report';
import { AdminDashboard } from './pages/Admin';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { TodayWork } from './pages/worker/TodayWork';
import { WorkDetail } from './pages/worker/WorkDetail';
import { WorkerCalendar } from './pages/worker/WorkerCalendar';
import { WorkerCompleted } from './pages/worker/WorkerCompleted';
import { WorkerPerformance } from './pages/worker/WorkerPerformance';
import { WorkerMessages } from './pages/worker/WorkerMessages';
import { WorkerProfile } from './pages/worker/WorkerProfile';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AdminReportsHub } from './pages/AdminReportsHub';
import { AdminReportDetail } from './pages/AdminReportDetail';
import { AdminOperations } from './pages/AdminOperations';
import { ProfilePage } from './pages/ProfilePage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ReportIntelligencePage } from './pages/ReportIntelligencePage';
import { AdminBroadcast } from './pages/AdminBroadcast';


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
      case 'worker': return '/worker/dashboard';
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
          path="/citizen/announcements"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <AnnouncementsPage />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/citizen/profile"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <ProfilePage />
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
        <Route
          path="/citizen/reports"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <MyReportsPage />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/citizen/reports/:id"
          element={
            <RoleProtectedRoute allowedRoles={['citizen', 'worker', 'admin']}>
              <GlobalAnimationWrapper>
                <ReportIntelligencePage />
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
        {/* Worker Portal */}
        <Route path="/worker/dashboard" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkerDashboard /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/today" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><TodayWork /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/calendar" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkerCalendar /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/completed" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkerCompleted /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/performance" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkerPerformance /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/messages" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkerMessages /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/profile" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkerProfile /></GlobalAnimationWrapper></RoleProtectedRoute>} />
        <Route path="/worker/works/:id" element={<RoleProtectedRoute allowedRoles={['worker', 'admin']}><GlobalAnimationWrapper><WorkDetail /></GlobalAnimationWrapper></RoleProtectedRoute>} />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <GlobalAnimationWrapper>
                <AdminDashboard />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <GlobalAnimationWrapper>
                <AdminReportsHub />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/:id"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <GlobalAnimationWrapper>
                <AdminReportDetail />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/operations"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <GlobalAnimationWrapper>
                <AdminOperations />
              </GlobalAnimationWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <GlobalAnimationWrapper>
                <AdminBroadcast />
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
