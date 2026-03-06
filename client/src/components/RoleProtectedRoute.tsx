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

    // 1. Mandatory Loading Gate - Never redirect or render until auth handshake completes
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-secondary/20 border-t-brand-secondary rounded-full animate-spin" />
                    <p className="text-brand-secondary/40 font-black uppercase tracking-widest animate-pulse">Synchronizing Session...</p>
                </div>
            </div>
        );
    }

    // 2. Strict Session Check
    if (!user) {
        console.warn('[RoleGuard] No user detected, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // 3. Profile Integrity Check - Only after loading=false
    if (!profile) {
        console.error('[RoleGuard] Authenticated but profile missing. Potential DB sync issue.');
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-primary p-6">
                <div className="minimal-card max-w-md w-full p-10 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Profile Synchronization Failed</h2>
                    <p className="text-brand-secondary/60 mb-6">Your session is authenticated, but your profile details could not be loaded from the database.</p>
                    <div className="space-y-3">
                        <button onClick={() => window.location.reload()} className="btn-primary w-full">Force Re-sync</button>
                        <Link to="/login" className="block text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 hover:text-red-500 mt-6 pt-6 border-t border-brand-secondary/5">Return to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Permission Check
    if (!allowedRoles.includes(profile.role)) {
        console.warn(`[RoleGuard] Access denied for role: ${profile.role}`);
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-primary p-6">
                <div className="minimal-card max-w-md w-full p-10 text-center">
                    <div className="w-20 h-20 bg-brand-secondary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10 text-brand-secondary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
                    <p className="text-brand-secondary/50 mb-8 leading-relaxed">
                        Your operational credentials do not grant access to this sector.
                    </p>
                    <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft size={18} />
                        Back to Command
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
