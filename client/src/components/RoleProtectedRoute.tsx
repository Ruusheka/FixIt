import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: ('citizen' | 'worker' | 'admin')[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-secondary/20 border-t-brand-secondary rounded-full animate-spin" />
                    <p className="text-brand-secondary/40 font-medium animate-pulse">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!profile) {
        // Logged in but profile fetch failed or still missing record
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-primary p-6">
                <div className="minimal-card max-w-md w-full p-10 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Profile Missing</h2>
                    <p className="text-brand-secondary/60 mb-6">We could not retrieve your user profile record. Contact support if this persists.</p>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full">Retry Connection</button>
                    <Link to="/login" className="block mt-4 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Sign Out & Try Again</Link>
                </div>
            </div>
        );
    }

    if (!allowedRoles.includes(profile.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-primary p-6">
                <div className="minimal-card max-w-md w-full p-10 text-center">
                    <div className="w-20 h-20 bg-brand-secondary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10 text-brand-secondary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
                    <p className="text-brand-secondary/50 mb-8 leading-relaxed">
                        Your account does not have the necessary permissions to view this workspace.
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
