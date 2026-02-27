import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    UserPlus,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    ChevronDown,
    Users
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Report, Profile, ReportPriority } from '../../types/reports';

interface AdminAssignmentPanelProps {
    report: Report;
    onUpdate: () => void;
}

type DeadlineOption = '24h' | '48h' | 'custom';

const PRIORITY_OPTIONS: { label: string; value: string; color: string }[] = [
    { label: 'Low', value: 'Low', color: 'text-green-600' },
    { label: 'Medium', value: 'Medium', color: 'text-amber-500' },
    { label: 'High', value: 'High', color: 'text-orange-500' },
    { label: 'Critical', value: 'Critical', color: 'text-red-600' },
];

export const AdminAssignmentPanel: React.FC<AdminAssignmentPanelProps> = ({ report, onUpdate }) => {
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [workerWorkloads, setWorkerWorkloads] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [selectedPriority, setSelectedPriority] = useState<string>(report.priority || 'Medium');
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
    const [deadlineOption, setDeadlineOption] = useState<DeadlineOption>('48h');
    const [customDeadline, setCustomDeadline] = useState<string>('');

    // Current assignment display
    const currentAssignment = report.assignments?.[0];

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'worker');

        if (profiles) {
            setWorkers(profiles);
            const { data: assignments } = await supabase
                .from('report_assignments')
                .select('worker_id')
                .eq('is_active', true);

            const counts: Record<string, number> = {};
            assignments?.forEach((a: any) => {
                counts[a.worker_id] = (counts[a.worker_id] || 0) + 1;
            });
            setWorkerWorkloads(counts);
        }
    };

    const computeDeadline = (): string => {
        const now = new Date();
        if (deadlineOption === '24h') {
            now.setHours(now.getHours() + 24);
            return now.toISOString();
        } else if (deadlineOption === '48h') {
            now.setHours(now.getHours() + 48);
            return now.toISOString();
        } else {
            return customDeadline ? new Date(customDeadline).toISOString() : now.toISOString();
        }
    };

    const [error, setError] = useState<string | null>(null);

    const handleAssign = async () => {
        if (!selectedWorkerId) return;
        setLoading(true);
        setSuccess(false);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const deadline = computeDeadline();

            // 1. Deactivate any existing active assignments
            const { error: deactivateError } = await (supabase
                .from('report_assignments') as any)
                .update({ is_active: false })
                .eq('report_id', report.id)
                .eq('is_active', true);

            if (deactivateError) throw deactivateError;

            // 2. Create new assignment
            const { error: assignError } = await (supabase
                .from('report_assignments') as any)
                .upsert({
                    report_id: report.id,
                    worker_id: selectedWorkerId,
                    assigned_by: user?.id,
                    is_active: true,
                    deadline,
                    priority: selectedPriority,
                }, { onConflict: 'report_id,worker_id' });

            if (assignError) throw assignError;

            // 3. Update issue: status + priority + assigned_worker
            const { error: issueError } = await (supabase.from('issues') as any).update({
                assigned_worker: selectedWorkerId,
                priority: selectedPriority,
                status: report.status === 'reported' ? 'assigned' : report.status,
            }).eq('id', report.id);

            if (issueError) throw issueError;

            // 4. Log activity
            const { error: activityError } = await (supabase.from('report_activity_logs') as any).insert({
                report_id: report.id,
                actor_id: user?.id,
                action: 'worker_assigned',
                details: {
                    message: `Worker assigned with ${selectedPriority} priority`,
                    status_after: report.status === 'reported' ? 'assigned' : report.status,
                    deadline,
                }
            });

            if (activityError) console.error("Activity Log Error (Non-blocking):", activityError);

            // 5. Send notification to worker
            await (supabase.from('notifications') as any).insert({
                user_id: selectedWorkerId,
                title: 'New Task Assigned',
                message: `You have been assigned to: ${report.title}`,
                type: 'assignment',
                link: `/worker/works/${report.id}`,
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            onUpdate();
        } catch (err: any) {
            console.error("Assignment Error:", err);
            setError(err.message || "Failed to assign worker. Ensure migration is run.");
        } finally {
            setLoading(false);
        }
    };

    const selectedWorker = workers.find(w => w.id === selectedWorkerId);

    return (
        <div className="space-y-6">
            {/* Currently Assigned Worker */}
            {currentAssignment && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center font-black text-green-700 text-sm shrink-0">
                        {currentAssignment.worker.full_name?.[0] || 'W'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Currently Assigned</p>
                        <p className="text-sm font-black text-green-800 truncate">{currentAssignment.worker.full_name || 'Worker'}</p>
                    </div>
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                </div>
            )}

            {['resolved', 'RESOLVED', 'closed', 'CLOSED'].includes(report.status) ? (
                <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-secondary/5 text-center">
                    <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest leading-relaxed">
                        Report Resolved.<br />Assignment locked.
                    </p>
                </div>
            ) : (
                <>
                    {/* Priority Level */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/50 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <AlertTriangle size={11} /> Priority Level
                        </label>
                        <div className="relative">
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                disabled={loading}
                                className="w-full bg-brand-primary/5 border border-brand-secondary/10 text-brand-secondary text-sm px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-secondary/10 font-bold appearance-none transition-all hover:bg-brand-primary/10 cursor-pointer"
                            >
                                {PRIORITY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-secondary/30" />
                        </div>
                    </div>

                    {/* Worker Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/50 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Users size={11} /> Assign Worker
                        </label>
                        <div className="relative">
                            <select
                                value={selectedWorkerId}
                                onChange={(e) => setSelectedWorkerId(e.target.value)}
                                disabled={loading}
                                className="w-full bg-brand-primary/5 border border-brand-secondary/10 text-brand-secondary text-sm px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-secondary/10 font-bold appearance-none transition-all hover:bg-brand-primary/10 cursor-pointer"
                            >
                                <option value="">Select a worker...</option>
                                {workers.map(worker => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.full_name || worker.email} — {workerWorkloads[worker.id] || 0} Active {workerWorkloads[worker.id] === 1 ? 'Task' : 'Tasks'}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-secondary/30" />
                        </div>

                        {/* Worker Cards Preview */}
                        {workers.length > 0 && (
                            <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                                {workers.map(worker => {
                                    const load = workerWorkloads[worker.id] || 0;
                                    const isSelected = selectedWorkerId === worker.id;
                                    return (
                                        <button
                                            key={worker.id}
                                            type="button"
                                            onClick={() => setSelectedWorkerId(worker.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${isSelected
                                                ? 'bg-brand-secondary text-white border-brand-secondary shadow-lg shadow-brand-secondary/20'
                                                : 'bg-brand-primary/5 border-brand-secondary/5 hover:border-brand-secondary/20 hover:bg-brand-primary/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-brand-secondary/10 text-brand-secondary/60'}`}>
                                                    {worker.full_name?.[0] || 'W'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-brand-secondary'}`}>
                                                        {worker.full_name || worker.email}
                                                    </p>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-brand-secondary/30'}`}>
                                                        {load === 0 ? '✓ Available' : `${load} Active ${load === 1 ? 'Task' : 'Tasks'}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${load === 0 ? 'bg-green-400' : load >= 3 ? 'bg-red-400' : 'bg-amber-400'}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Deadline Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/50 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Clock size={11} /> Completion Deadline
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { value: '24h', label: 'Within\n24 Hours' },
                                { value: '48h', label: 'Within\n48 Hours' },
                                { value: 'custom', label: 'Custom\nDate' },
                            ] as { value: DeadlineOption; label: string }[]).map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setDeadlineOption(opt.value)}
                                    className={`p-3 rounded-2xl border-2 text-center transition-all text-[9px] font-black uppercase tracking-wider leading-tight ${deadlineOption === opt.value
                                        ? 'bg-brand-secondary text-white border-brand-secondary shadow-lg shadow-brand-secondary/20'
                                        : 'bg-brand-primary/5 border-brand-secondary/5 text-brand-secondary/60 hover:border-brand-secondary/20'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {deadlineOption === 'custom' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="relative mt-2">
                                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                                    <input
                                        type="datetime-local"
                                        value={customDeadline}
                                        onChange={(e) => setCustomDeadline(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-brand-primary/5 border border-brand-secondary/10 text-brand-secondary text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-secondary/10 font-bold"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase tracking-widest leading-tight">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Error: {error}</span>
                        </div>
                    )}

                    {/* Assign Button */}
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedWorkerId || (deadlineOption === 'custom' && !customDeadline)}
                        className={`w-full py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${success
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : error
                                ? 'bg-red-600 text-white shadow-red-500/20'
                                : 'bg-brand-secondary text-white shadow-brand-secondary/20 hover:shadow-brand-secondary/30 hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : success ? (
                            <><CheckCircle2 size={16} /> Worker Assigned!</>
                        ) : (
                            <><UserPlus size={16} /> {error ? 'Try Again' : 'Assign Worker'}</>
                        )}
                    </button>
                </>
            )}
        </div>
    );
};
