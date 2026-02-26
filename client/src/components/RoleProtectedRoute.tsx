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

    if (!user || !profile) {
        return <Navigate to="/login" replace />;
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
