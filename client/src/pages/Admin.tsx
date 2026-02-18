import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';
import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Users, BarChart3, Shield, ClipboardCheck, Radio, DollarSign } from 'lucide-react';

// Admin components
import { CommandHero } from '../components/admin/CommandHero';
import { ReportAnalytics } from '../components/admin/ReportAnalytics';
import { SLATracker } from '../components/admin/SLATracker';
import { LiveIssuePanel } from '../components/admin/LiveIssuePanel';
import { WorkerAssignModal } from '../components/admin/WorkerAssignModal';
import { VerificationPanel } from '../components/admin/VerificationPanel';
import { HeatmapSection } from '../components/admin/HeatmapSection';
import { AIDispatchPanel } from '../components/admin/AIDispatchPanel';
import { ResourceLoad } from '../components/admin/ResourceLoad';
import { BroadcastCenter } from '../components/admin/BroadcastCenter';
import { BudgetPanel } from '../components/admin/BudgetPanel';

/* ── Demo data fallback ── */
const demoIssues = [
    { id: '1', category: 'pothole', severity: 9, risk_score: 0.9, status: 'reported', address: 'MG Road, Sector 12', latitude: 28.6139, longitude: 77.2090, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', category: 'streetlight', severity: 5, risk_score: 0.5, status: 'in_progress', address: 'Ring Road Junction', latitude: 28.6200, longitude: 77.2150, created_at: new Date(Date.now() - 7200000).toISOString(), assigned_worker: 'Rajesh K.' },
    { id: '3', category: 'garbage', severity: 6, risk_score: 0.6, status: 'assigned', address: 'Park Avenue, Block C', latitude: 28.6100, longitude: 77.2000, created_at: new Date(Date.now() - 14400000).toISOString(), assigned_worker: 'Priya M.' },
    { id: '4', category: 'pothole', severity: 8, risk_score: 0.85, status: 'reported', address: 'NH-48 Toll Plaza', latitude: 28.6050, longitude: 77.1950, created_at: new Date(Date.now() - 28800000).toISOString() },
    { id: '5', category: 'water leak', severity: 7, risk_score: 0.7, status: 'in_progress', address: 'Gandhi Nagar', latitude: 28.6180, longitude: 77.2200, created_at: new Date(Date.now() - 36000000).toISOString(), assigned_worker: 'Amit S.' },
    { id: '6', category: 'road crack', severity: 4, risk_score: 0.4, status: 'resolved', address: 'Connaught Place', latitude: 28.6300, longitude: 77.2190, created_at: new Date(Date.now() - 43200000).toISOString() },
    { id: '7', category: 'garbage', severity: 3, risk_score: 0.3, status: 'verified', address: 'Sarojini Market', latitude: 28.5700, longitude: 77.2100, created_at: new Date(Date.now() - 50400000).toISOString() },
    { id: '8', category: 'streetlight', severity: 6, risk_score: 0.6, status: 'assigned', address: 'Dwarka Sector 21', latitude: 28.5500, longitude: 77.0600, created_at: new Date(Date.now() - 57600000).toISOString(), assigned_worker: 'Neha R.' },
    { id: '9', category: 'pothole', severity: 8, risk_score: 0.82, status: 'reported', address: 'Lajpat Nagar', latitude: 28.5690, longitude: 77.2400, created_at: new Date().toISOString() },
    { id: '10', category: 'water leak', severity: 9, risk_score: 0.92, status: 'reported', address: 'Hauz Khas Village', latitude: 28.5494, longitude: 77.2001, created_at: new Date().toISOString() },
];

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'citizen' | 'worker' | 'admin';
    created_at: string;
}

/* ── Sidebar nav items ── */
const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'operations', label: 'Operations', icon: <Shield className="w-4 h-4" /> },
    { id: 'verification', label: 'Verification', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'broadcast', label: 'Broadcast', icon: <Radio className="w-4 h-4" /> },
    { id: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
];

/* ── Main Dashboard ── */
export const AdminDashboard: React.FC = () => {
    const { signOut, profile: adminProfile } = useAuth();
    const [issues, setIssues] = useState<any[]>(demoIssues);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeSection, setActiveSection] = useState('overview');
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

    /* Fetch from Supabase */
    useEffect(() => {
        fetchIssues();
        fetchProfiles();

        socket.on('new_issue', (issue: any) => setIssues(prev => [issue, ...prev]));
        socket.on('issue_updated', (updated: any) =>
            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i))
        );

        const channel = supabase
            .channel('admin-issues')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => fetchIssues())
            .subscribe();

        return () => {
            socket.off('new_issue');
            socket.off('issue_updated');
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchIssues = async () => {
        const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) setIssues(data);
    };

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setProfiles(data);
    };

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('issues').update({ status }).eq('id', id);
        fetchIssues();
    };

    const updateUserRole = async (userId: string, newRole: 'citizen' | 'worker') => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) fetchProfiles();
    };

    const handleAssign = (issue: any) => {
        setSelectedIssue(issue);
        setAssignModalOpen(true);
    };

    const handleAssignSubmit = async (issueId: string, data: any) => {
        await supabase.from('issues').update({
            status: 'assigned',
            assigned_worker: data.worker,
        }).eq('id', issueId);
        fetchIssues();
    };

    /* Compute stats */
    const today = new Date().toDateString();
    const statsData = {
        totalActive: issues.filter(i => !['resolved', 'verified', 'rejected'].includes(i.status)).length,
        reportedToday: issues.filter(i => new Date(i.created_at).toDateString() === today).length,
        resolvedToday: issues.filter(i => i.status === 'resolved' && new Date(i.created_at).toDateString() === today).length,
        avgResolutionHrs: 18.5,
        criticalZones: issues.filter(i => (i.risk_score || 0) > 0.7 || (i.severity || 0) >= 8).length,
    };

    return (
        <div className="min-h-screen bg-civic-dark flex">
            {/* Sidebar */}
            <aside className="w-16 md:w-56 bg-civic-darker border-r border-white/5 flex flex-col py-5 flex-shrink-0 sticky top-0 h-screen">
                <div className="px-4 mb-8 hidden md:block">
                    <h2 className="text-lg font-bold text-gradient-civic">FixIt</h2>
                    <p className="text-[10px] text-civic-muted">Admin Console</p>
                </div>

                <nav className="flex-1 space-y-1 px-2">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === item.id
                                ? 'bg-civic-orange/10 text-civic-orange font-semibold'
                                : 'text-civic-muted hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item.icon}
                            <span className="hidden md:inline">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="px-2 space-y-2">
                    {adminProfile && (
                        <div className="px-3 py-2 hidden md:block">
                            <div className="text-xs text-white font-medium truncate">{adminProfile.full_name || 'Admin'}</div>
                            <div className="text-[10px] text-civic-muted truncate">{adminProfile.email}</div>
                        </div>
                    )}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {/* OVERVIEW TAB */}
                {activeSection === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <CommandHero stats={statsData} />
                        <ReportAnalytics />
                        <SLATracker issues={issues} />
                        <HeatmapSection issues={issues} />
                        <AIDispatchPanel />
                        <ResourceLoad />
                    </motion.div>
                )}

                {/* OPERATIONS TAB */}
                {activeSection === 'operations' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-white">Operations Center</h1>
                            <p className="text-civic-muted text-sm">Issue management & worker dispatch</p>
                        </div>
                        <LiveIssuePanel issues={issues} onAssign={handleAssign} onUpdateStatus={updateStatus} />
                    </motion.div>
                )}

                {/* VERIFICATION TAB */}
                {activeSection === 'verification' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-white">Field Work Verification</h1>
                            <p className="text-civic-muted text-sm">Review worker submissions before closing tickets</p>
                        </div>
                        <VerificationPanel
                            onApprove={(id) => updateStatus(id, 'verified')}
                            onReject={(id) => updateStatus(id, 'rejected')}
                            onRework={(id) => updateStatus(id, 'in_progress')}
                        />
                    </motion.div>
                )}

                {/* BROADCAST TAB */}
                {activeSection === 'broadcast' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-white">Mass Broadcast Center</h1>
                            <p className="text-civic-muted text-sm">Push alerts & announcements to citizen dashboards</p>
                        </div>
                        <BroadcastCenter />
                    </motion.div>
                )}

                {/* BUDGET TAB */}
                {activeSection === 'budget' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-white">Budget Transparency</h1>
                            <p className="text-civic-muted text-sm">Repair cost publishing for civic trust</p>
                        </div>
                        <BudgetPanel />
                    </motion.div>
                )}

                {/* USERS TAB */}
                {activeSection === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-white">User Management</h1>
                            <p className="text-civic-muted text-sm">{profiles.length} registered users</p>
                        </div>

                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Email</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Joined</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {profiles.map(p => (
                                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 text-sm text-white font-medium">{p.full_name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-xs text-civic-muted">{p.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${p.role === 'admin' ? 'badge-verified' :
                                                        p.role === 'worker' ? 'badge-assigned' : 'badge-reported'
                                                        }`}>{p.role}</span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-civic-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    {p.role !== 'admin' && (
                                                        <div className="flex gap-2">
                                                            {p.role === 'citizen' && (
                                                                <button onClick={() => updateUserRole(p.id, 'worker')}
                                                                    className="px-2 py-1 text-[10px] font-semibold text-civic-blue glass-card hover:bg-civic-blue/10 transition-colors">
                                                                    Promote to Worker
                                                                </button>
                                                            )}
                                                            {p.role === 'worker' && (
                                                                <button onClick={() => updateUserRole(p.id, 'citizen')}
                                                                    className="px-2 py-1 text-[10px] font-semibold text-orange-400 glass-card hover:bg-orange-500/10 transition-colors">
                                                                    Demote to Citizen
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {p.role === 'admin' && <span className="text-[10px] text-civic-muted">System Admin</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Worker Assignment Modal */}
            <WorkerAssignModal
                isOpen={assignModalOpen}
                issue={selectedIssue}
                onClose={() => setAssignModalOpen(false)}
                onAssign={handleAssignSubmit}
            />
        </div>
    );
};
