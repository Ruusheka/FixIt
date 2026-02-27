import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Users, User, ShieldAlert, Building2,
    Settings, Megaphone, ScrollText, Plus,
    LayoutDashboard, ClipboardCheck, Radio,
    Shield, Briefcase, AlertTriangle, CheckCircle2,
    Clock, TrendingUp, ChevronRight, UserPlus, ShieldCheck,
    MapPin, BarChart3
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { useOperations } from '../hooks/useOperations';
import { supabase } from '../services/supabase';
import { WorkerOnboardModal } from '../components/admin/WorkerOnboardModal';
import { WorkerDetailModal } from '../components/admin/WorkerDetailModal';
import { ReassignModal } from '../components/admin/ReassignModal';
import { Profile, Worker, Escalation } from '../types/reports';

const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/admin/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin/operations', icon: Shield },
    { label: 'Workers', path: '/admin/workers', icon: Users },
    { label: 'Broadcast', path: '/admin/broadcast', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminOperations: React.FC = () => {
    const { workers, departments, escalations, slaRules, announcements, activityLogs, loading, updateSLA, logActivity, logReportActivity, fetchData, postAnnouncement, getReportLogs, metrics } = useOperations();
    const [activeSection, setActiveSection] = useState<'overview' | 'escalations' | 'departments' | 'sla' | 'announcements' | 'logs'>('overview');
    const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
    const [isWorkerDetailOpen, setIsWorkerDetailOpen] = useState(false);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);

    const handleOnboardWorker = async (email: string, deptId: string) => {
        // Use a list query instead of .single() to avoid 404/406 errors when not found
        const { data: profiles, error } = await (supabase.from('profiles').select('id').ilike('email', email) as any);

        if (error || !profiles || profiles.length === 0) {
            alert(`INTELLIGENCE ERROR: Personnel with email "${email}" not found in registries. They must register an account first.`);
            return;
        }

        const profile = profiles[0];

        if (profile) {
            await (supabase.from('workers') as any).insert({
                id: profile.id,
                department_id: deptId,
                status: 'available'
            });
            await (supabase.from('profiles') as any).update({ role: 'worker' }).eq('id', profile.id);
            logActivity(`Onboarded worker ${email}`, 'WORKFORCE', profile.id);
            fetchData();
            setIsWorkerModalOpen(false);
        }
    };

    const updateWorkerStatus = async (workerId: string, status: string) => {
        await (supabase.from('workers') as any).update({ status }).eq('id', workerId);
        logActivity(`Updated worker status to ${status}`, 'WORKFORCE', workerId);
        fetchData();
    };

    const reassignWorkerDept = async (workerId: string, deptId: string) => {
        await (supabase.from('workers') as any).update({ department_id: deptId }).eq('id', workerId);
        logActivity(`Reassigned worker to new department`, 'WORKFORCE', workerId);
        fetchData();
    };

    const resolveEscalation = async (escId: string) => {
        const escalation = escalations.find(e => e.id === escId);
        await (supabase.from('escalations') as any).update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', escId);

        if (escalation?.report_id) {
            await logReportActivity(escalation.report_id, 'escalation_resolved', { note: 'Admin resolved tactical escalation.' });
            // Also update the issue status to resolved if it's not already
            await (supabase.from('issues') as any).update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', escalation.report_id);
        }

        logActivity(`Resolved escalation`, 'ESCALATION', escId);
        fetchData();
    };

    const handleReassign = async (workerId: string) => {
        if (!selectedEscalation) return;

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Deactivate current assignments for the report
        await (supabase.from('report_assignments') as any).update({ is_active: false }).eq('report_id', selectedEscalation.report_id);

        // 2. Create new assignment
        await (supabase.from('report_assignments') as any).insert({
            report_id: selectedEscalation.report_id,
            worker_id: workerId,
            assigned_by: user?.id,
            is_active: true
        });

        // 3. Update issue status and assignment
        await (supabase.from('issues') as any).update({
            assigned_worker: workerId,
            status: 'assigned'
        }).eq('id', selectedEscalation.report_id);

        // 4. Update worker cooldown and status
        await (supabase.from('workers') as any).update({
            status: 'busy',
            last_assigned_at: new Date().toISOString()
        }).eq('id', workerId);

        logActivity(`Reassigned escalation and set worker cooldown`, 'ESCALATION', selectedEscalation.id);
        await logReportActivity(selectedEscalation.report_id, 'personnel_reassigned', {
            note: `Tactical reassignment executed. Operations handed to Worker ID: ${workerId.slice(0, 8)}...`,
            worker_id: workerId
        });
        setIsReassignModalOpen(false);
        fetchData();
    };

    const handleCreateDepartment = async (name: string, description: string) => {
        await (supabase.from('departments') as any).insert({ name, description });
        logActivity(`Created department: ${name}`, 'DEPARTMENT');
        fetchData();
    };

    const sections = [
        { id: 'overview', label: 'Operational Overview', icon: Activity },
        { id: 'escalations', label: 'Escalations Center', icon: ShieldAlert },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'sla', label: 'SLA & Priority Control', icon: Settings },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'logs', label: 'Activity Logs', icon: ScrollText },
    ];

    return (
        <MinimalLayout navItems={navItems} title="Operations Command">
            <div className="max-w-7xl mx-auto px-8 py-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-secondary rounded-xl">
                                <Shield className="w-6 h-6 text-brand-primary" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter text-brand-secondary uppercase">
                                Operations Command
                            </h1>
                        </div>
                        <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12">
                            Workforce, SLA & Tactical Oversight
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            <Plus size={16} /> New Operation
                        </button>
                    </div>
                </div>

                {/* Tactical Navigation */}
                <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-brand-secondary/5">
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === s.id
                                ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/20 scale-[1.05]'
                                : 'bg-white text-brand-secondary/40 border border-brand-secondary/5 hover:bg-brand-secondary/5'
                                }`}
                        >
                            <s.icon size={14} />
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="min-h-[600px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {loading ? (
                                <div className="h-64 flex items-center justify-center text-brand-secondary/20 font-black tracking-[0.2em] animate-pulse">
                                    SYNCING OPERATIONAL DATA...
                                </div>
                            ) : (
                                <SectionRenderer
                                    section={activeSection}
                                    data={{ workers, departments, escalations, slaRules, announcements, activityLogs, metrics }}
                                    handlers={{
                                        updateSLA,
                                        updateWorkerStatus,
                                        reassignWorkerDept,
                                        onboardWorker: () => setIsWorkerModalOpen(true),
                                        viewWorker: (w: Worker) => { setSelectedWorker(w); setIsWorkerDetailOpen(true); },
                                        openReassign: (e: Escalation) => { setSelectedEscalation(e); setIsReassignModalOpen(true); },
                                        resolveEscalation,
                                        postAnnouncement,
                                        handleCreateDepartment,
                                        getReportLogs,
                                        metrics,
                                        supabase
                                    }}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Modals */}
                <WorkerOnboardModal
                    isOpen={isWorkerModalOpen}
                    onClose={() => setIsWorkerModalOpen(false)}
                    onOnboard={handleOnboardWorker}
                    departments={departments}
                />
                <WorkerDetailModal
                    isOpen={isWorkerDetailOpen}
                    onClose={() => setIsWorkerDetailOpen(false)}
                    worker={selectedWorker}
                />
                <ReassignModal
                    isOpen={isReassignModalOpen}
                    onClose={() => setIsReassignModalOpen(false)}
                    escalation={selectedEscalation}
                    workers={workers}
                    onReassign={handleReassign}
                />
            </div>
        </MinimalLayout>
    );
};

const SectionRenderer: React.FC<{ section: string; data: any; handlers: any }> = ({ section, data, handlers }) => {
    switch (section) {
        case 'overview': return (
            <div className="space-y-12">
                <OverviewSection data={data} />
                <WorkforceSection data={data} handlers={handlers} />
            </div>
        );
        case 'escalations': return <EscalationsSection data={data} handlers={handlers} />;
        case 'departments': return <DepartmentsSection data={data} onCreate={handlers.handleCreateDepartment} />;
        case 'sla': return <SLASection data={data} updateSLA={handlers.updateSLA} />;
        case 'announcements': return <AnnouncementsSection data={data} onPost={handlers.postAnnouncement} />;
        case 'logs': return <LogsSection data={data} />;
        default: return <div className="p-10 text-center text-brand-secondary/20 font-black">MODULE UNDER DEVELOPMENT</div>;
    }
};

/* --- Sub-sections --- */

const OverviewSection: React.FC<{ data: any }> = ({ data }) => {
    const stats = [
        { label: 'System Load', value: 'Nominal', icon: TrendingUp, color: 'text-green-600' },
        { label: 'Active Personnel', value: data.metrics?.activePersonnel || 0, icon: Users, color: 'text-brand-secondary' },
        { label: 'Critical Escalations', value: data.escalations?.filter((e: any) => !['closed', 'resolved'].includes(e.report?.status)).length || 0, icon: AlertTriangle, color: 'text-red-600' },
        { label: 'Avg Resolution', value: data.metrics?.avgResolutionTime || '0h', icon: Clock, color: 'text-brand-secondary' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="minimal-card p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-brand-secondary/5 rounded-xl">
                            <stat.icon size={20} className="text-brand-secondary" />
                        </div>
                        <span className="text-[9px] font-black text-brand-secondary/20 uppercase tracking-[0.2em]">Operational</span>
                    </div>
                    <h4 className="text-3xl font-black text-brand-secondary tracking-tighter mb-1">{stat.value}</h4>
                    <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">{stat.label}</p>
                </div>
            ))}
        </div>
    );
};

const WorkforceSection: React.FC<{ data: any; handlers: any }> = ({ data, handlers }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">Active Personnel</h3>
                <button
                    onClick={handlers.onboardWorker}
                    className="flex items-center gap-2 px-4 py-2 border border-brand-secondary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:bg-brand-secondary hover:text-white transition-all"
                >
                    <UserPlus size={14} /> Onboard Worker
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] text-left">
                            <th className="px-6 py-3">Personnel</th>
                            <th className="px-6 py-3">Department</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Load</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.workers.map((worker: any) => (
                            <tr key={worker.id} className="bg-white border border-brand-secondary/5 rounded-2xl shadow-soft hover:shadow-md transition-all group">
                                <td className="px-6 py-4 rounded-l-2xl border-l border-t border-b border-brand-secondary/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-secondary/5 flex items-center justify-center font-black text-brand-secondary">
                                            {worker.profile?.full_name?.[0] || worker.profile?.email?.[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-brand-secondary tracking-tight">{worker.profile?.full_name || 'Anonymous Worker'}</p>
                                            <p className="text-[10px] font-bold text-brand-secondary/40">{worker.profile?.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-t border-b border-brand-secondary/5">
                                    <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest opacity-60">
                                        {worker.department?.name || 'Unassigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-t border-b border-brand-secondary/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${worker.status === 'available' ? 'bg-green-500' : worker.status === 'busy' ? 'bg-orange-500' : 'bg-red-500'
                                            } animate-pulse`} />
                                        <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                                            {worker.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-t border-b border-brand-secondary/5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-brand-secondary/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-secondary/40 transition-all duration-500"
                                                    style={{ width: `${Math.min((worker.metrics?.[0]?.total_assigned || 0) * 20, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-brand-secondary/40">
                                                {worker.metrics?.[0]?.total_assigned || 0} Active
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-green-600/50 uppercase tracking-tighter">
                                            <CheckCircle2 size={10} /> {worker.metrics?.[0]?.total_resolved || 0} Completed
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 rounded-r-2xl border-r border-t border-b border-brand-secondary/5 text-right">
                                    <button
                                        onClick={() => handlers.viewWorker(worker)}
                                        className="p-2 hover:bg-brand-secondary/5 rounded-lg text-brand-secondary/40 hover:text-brand-secondary transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const EscalationsSection: React.FC<{ data: any; handlers: any }> = ({ data, handlers }) => {
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [logs, setLogs] = useState<{ [key: string]: any[] }>({});

    const toggleExpand = async (esc: any) => {
        const id = esc.id;
        if (expandedIds.includes(id)) {
            setExpandedIds(prev => prev.filter(i => i !== id));
        } else {
            setExpandedIds(prev => [...prev, id]);
            if (!logs[esc.report_id]) {
                const reportLogs = await handlers.getReportLogs(esc.report_id);
                setLogs(prev => ({ ...prev, [esc.report_id]: reportLogs }));
            }
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">Active Escalations</h3>
            <div className="grid grid-cols-1 gap-4">
                {data.escalations.filter((e: any) => !['closed', 'resolved'].includes(e.report?.status)).map((esc: any) => (
                    <div key={esc.id} className={`minimal-card overflow-hidden border-l-4 ${esc.severity === 'critical' ? 'border-red-600' : 'border-orange-500'
                        }`}>
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1 cursor-pointer" onClick={() => toggleExpand(esc)}>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${esc.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500/10 text-orange-600'
                                            }`}>
                                            {esc.severity}
                                        </span>
                                        <span className="text-[10px] font-bold text-brand-secondary/40 tracking-widest uppercase">
                                            ESCALATED {new Date(esc.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest ml-2">
                                            Click to view tactical timeline
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-black text-brand-secondary tracking-tight">{esc.report?.title}</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest flex items-center gap-1.5">
                                            <User size={12} className="text-brand-secondary/20" />
                                            {esc.report?.reporter?.full_name || 'Anonymous Citizen'}
                                        </p>
                                        <div className="h-1 w-1 rounded-full bg-brand-secondary/10" />
                                        <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest flex items-center gap-1.5">
                                            <Briefcase size={12} className="text-brand-secondary/20" />
                                            {esc.report?.assigned_worker_profile?.full_name || 'PENDING ASSIGNMENT'}
                                        </p>
                                        <div className="h-1 w-1 rounded-full bg-brand-secondary/10" />
                                        <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest flex items-center gap-1.5">
                                            <MapPin size={12} className="text-brand-secondary/20" />
                                            {esc.report?.address?.split(',')[0] || 'Tactical Sector'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-brand-secondary/60 max-w-2xl mt-2">{esc.reason}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handlers.openReassign(esc)}
                                        className="px-4 py-2 bg-brand-secondary/5 text-brand-secondary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-secondary hover:text-white transition-all"
                                    >
                                        Reassign
                                    </button>
                                    <button
                                        onClick={() => handlers.resolveEscalation(esc.id)}
                                        className="px-4 py-2 bg-brand-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
                                    >
                                        Resolve
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Activity Log */}
                        <AnimatePresence>
                            {expandedIds.includes(esc.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-brand-secondary/5 bg-brand-primary/5"
                                >
                                    <div className="p-6 space-y-4">
                                        <h5 className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <ScrollText size={14} /> Tactical Timeline
                                        </h5>
                                        <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-brand-secondary/5">
                                            {(logs[esc.report_id] || []).map((log, idx) => (
                                                <div key={log.id} className="pl-8 relative flex flex-col gap-1">
                                                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white border border-brand-secondary/10 flex items-center justify-center z-10">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary/20" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-brand-secondary leading-none">
                                                            {log.actor?.full_name || 'SYSTEM'}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-brand-secondary/20 uppercase tracking-widest">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-brand-secondary/60 font-medium italic">
                                                        {log.action_type.replace('_', ' ').toUpperCase()}: {log.details?.note || 'Operational update logged.'}
                                                    </p>
                                                </div>
                                            ))}
                                            {(!logs[esc.report_id] || logs[esc.report_id].length === 0) && (
                                                <p className="pl-8 text-[10px] font-black text-brand-secondary/20 uppercase italic">Awaiting tactical entry...</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
            {data.escalations.filter((e: any) => !['closed', 'resolved'].includes(e.report?.status)).length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-brand-primary/5 rounded-[40px] border border-dashed border-brand-secondary/10">
                    <ShieldCheck size={48} className="text-brand-secondary/10" />
                    <p className="text-xs font-black text-brand-secondary/30 uppercase tracking-widest">No active escalations detected</p>
                </div>
            )}
        </div>
    );
};

const AnnouncementsSection: React.FC<{ data: any; onPost: (t: string, c: string, p: string) => Promise<void> }> = ({ data, onPost }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('normal');

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        await onPost(title, content, priority);
        setTitle(''); setContent('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">Active Directives</h3>
                <div className="space-y-4">
                    {data.announcements.map((ann: any) => (
                        <div key={ann.id} className="minimal-card p-6 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${ann.priority === 'emergency' ? 'bg-red-600 text-white' : 'bg-brand-secondary/10 text-brand-secondary'
                                        }`}>
                                        {ann.priority}
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-secondary/20 uppercase tracking-widest">
                                        SENT {new Date(ann.created_at).toLocaleDateString()} BY {ann.author?.full_name || 'SYSTEM'}
                                    </span>
                                </div>
                            </div>
                            <h4 className="text-lg font-black text-brand-secondary tracking-tight mb-2">{ann.title}</h4>
                            <p className="text-sm text-brand-secondary/60 leading-relaxed">{ann.content}</p>
                        </div>
                    ))}
                    {data.announcements.length === 0 && (
                        <div className="py-20 text-center text-brand-secondary/20 font-black uppercase tracking-widest border border-dashed border-brand-secondary/10 rounded-3xl">
                            No broadcasts in mission queue
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">New Directive</h3>
                <form onSubmit={handlePost} className="minimal-card p-8 bg-brand-secondary text-white space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mission Title</label>
                        <input
                            value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Brief directive subject..."
                            className="w-full bg-white/10 border border-white/10 text-white text-xs px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20 font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mission Priority</label>
                        <select
                            value={priority} onChange={e => setPriority(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 text-white text-xs px-4 py-3 rounded-xl focus:outline-none font-bold appearance-none"
                        >
                            <option value="normal" className="bg-brand-secondary">REGULAR UPDATE</option>
                            <option value="important" className="bg-brand-secondary">PRIORITY INTEL</option>
                            <option value="emergency" className="bg-brand-secondary">EMERGENCY BROADCAST</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Detailed Payload</label>
                        <textarea
                            value={content} onChange={e => setContent(e.target.value)}
                            placeholder="Instructions for field personnel..."
                            rows={4}
                            className="w-full bg-white/10 border border-white/10 text-white text-xs px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20 resize-none font-medium leading-relaxed"
                        />
                    </div>
                    <button className="w-full py-4 bg-white text-brand-secondary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all">
                        Execute Broadcast
                    </button>
                </form>
            </div>
        </div>
    );
};

const SLASection: React.FC<{ data: any; updateSLA: any }> = ({ data, updateSLA }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
                <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">SLA Configuration</h3>
                <div className="space-y-4">
                    {data.slaRules.map((rule: any) => (
                        <div key={rule.id} className="minimal-card p-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest">{rule.priority} Priority</h4>
                                <p className="text-[10px] font-bold text-brand-secondary/40 uppercase">Max Resolution window</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        defaultValue={rule.max_hours}
                                        onBlur={(e) => updateSLA(rule.priority, parseInt(e.target.value))}
                                        className="w-20 text-center text-2xl font-black text-brand-secondary bg-transparent focus:ring-0 border-b-2 border-brand-secondary/10"
                                    />
                                    <span className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest">HOURS</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-8 bg-brand-secondary rounded-3xl text-white space-y-6">
                <Shield className="w-12 h-12 text-brand-primary" />
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic">SLA Compliance Hub</h3>
                <p className="text-sm font-medium text-white/60 leading-relaxed">
                    Adjusting resolution windows will retroactively update dashboard alerts and escalation thresholds. Use with caution during high-ingress periods.
                </p>
                <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Compliance</span>
                        <span className="text-2xl font-black italic">98.4%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary w-[98.4%]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const DepartmentsSection: React.FC<{ data: any; onCreate: (n: string, d: string) => Promise<void> }> = ({ data, onCreate }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const handleCreate = async () => {
        if (!name) return;
        await onCreate(name, desc);
        setIsCreating(false);
        setName(''); setDesc('');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.departments.map((dept: any) => (
                <div key={dept.id} className="minimal-card p-6 group hover:bg-brand-secondary transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-brand-secondary/5 group-hover:bg-white/10 rounded-xl text-brand-secondary group-hover:text-white transition-colors">
                            <Building2 size={20} />
                        </div>
                        <ChevronRight size={16} className="text-brand-secondary/20 group-hover:text-white/20" />
                    </div>
                    <h4 className="text-lg font-black text-brand-secondary group-hover:text-white tracking-tight leading-tight mb-2">
                        {dept.name}
                    </h4>
                    <p className="text-[10px] font-bold text-brand-secondary/40 group-hover:text-white/40 uppercase truncate">
                        {dept.description || 'Civic infrastructure maintenance'}
                    </p>
                    <div className="mt-6 pt-6 border-t border-brand-secondary/5 group-hover:border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-brand-secondary/20 group-hover:text-white/20 uppercase tracking-widest">Personnel</span>
                            <span className="text-xs font-black text-brand-secondary group-hover:text-white transition-colors">12 Active</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[8px] font-black text-brand-secondary/20 group-hover:text-white/20 uppercase tracking-widest">Reports</span>
                            <span className="text-xs font-black text-brand-secondary group-hover:text-white transition-colors">45 Total</span>
                        </div>
                    </div>
                </div>
            ))}

            {isCreating ? (
                <div className="minimal-card p-6 bg-brand-secondary text-white space-y-4">
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Dept Name"
                        className="w-full bg-white/10 border-none text-xs px-3 py-2 rounded-lg text-white font-bold"
                    />
                    <input
                        value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full bg-white/10 border-none text-xs px-3 py-2 rounded-lg text-white font-bold"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleCreate} className="flex-1 py-2 bg-brand-primary text-brand-secondary rounded-lg font-black text-[9px] uppercase tracking-widest">Confirm</button>
                        <button onClick={() => setIsCreating(false)} className="px-3 py-2 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest font-black">Cancel</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="minimal-card p-6 border-dashed border-2 border-brand-secondary/10 flex flex-col items-center justify-center gap-3 hover:bg-brand-secondary/5 transition-all text-brand-secondary/30"
                >
                    <Plus size={32} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Dept</span>
                </button>
            )}
        </div>
    );
};

const LogsSection: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="bg-white rounded-3xl border border-brand-secondary/5 shadow-soft overflow-hidden">
            <div className="p-6 border-b border-brand-secondary/5 flex items-center justify-between">
                <h3 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                    <ScrollText size={16} className="text-brand-secondary/40" />
                    Audit Logs
                </h3>
                <span className="text-[9px] font-black text-brand-secondary/20 uppercase tracking-widest">Real-time Tactical Record</span>
            </div>
            <div className="divide-y divide-brand-secondary/5">
                {data.activityLogs.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-brand-primary/5 transition-colors flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="text-[9px] font-black text-brand-secondary/20 uppercase w-16">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-brand-secondary leading-none mb-1">
                                    <span className="font-black italic">{log.admin?.full_name || 'System Admin'}</span>
                                    <span className="mx-2 text-brand-secondary/40 tracking-wider">→</span>
                                    {log.action}
                                </p>
                                <span className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest">
                                    TARGET: {log.target_type} | ID: {log.target_id?.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                        <Shield size={14} className="text-brand-secondary/5" />
                    </div>
                ))}
            </div>
        </div>
    );
};
