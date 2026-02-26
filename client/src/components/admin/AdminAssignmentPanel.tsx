import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    UserPlus,
    Trash2,
    ChevronRight,
    Activity,
    AlertTriangle,
    Briefcase
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Report, Profile, ReportStatus, ReportPriority } from '../../types/reports';

interface AdminAssignmentPanelProps {
    report: Report;
    onUpdate: () => void;
}

export const AdminAssignmentPanel: React.FC<AdminAssignmentPanelProps> = ({ report, onUpdate }) => {
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [workerWorkloads, setWorkerWorkloads] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

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
            // Fetch workloads
            const { data: assignments } = await supabase
                .from('report_assignments')
                .select('worker_id');

            const counts: Record<string, number> = {};
            assignments?.forEach((a: any) => {
                counts[a.worker_id] = (counts[a.worker_id] || 0) + 1;
            });
            setWorkerWorkloads(counts);
        }
    };

    const assignWorker = async (workerId: string) => {
        setLoading(true);
        const { error } = await (supabase
            .from('report_assignments') as any)
            .insert({ report_id: report.id, worker_id: workerId });

        if (!error) {
            // Log update
            await (supabase.from('report_updates') as any).insert({
                report_id: report.id,
                updated_by: (await supabase.auth.getUser()).data.user?.id,
                update_text: `Assigned new worker`,
            });
            // Update issues.assigned_worker if it's the first one
            if (!report.assigned_worker) {
                await (supabase.from('issues') as any).update({ assigned_worker: workerId }).eq('id', report.id);
            }
            onUpdate();
        }
        setLoading(false);
    };

    const removeWorker = async (workerId: string) => {
        setLoading(true);
        const { error } = await supabase
            .from('report_assignments')
            .delete()
            .eq('report_id', report.id)
            .eq('worker_id', workerId);

        if (!error) {
            // Log update
            await (supabase.from('report_updates') as any).insert({
                report_id: report.id,
                updated_by: (await supabase.auth.getUser()).data.user?.id,
                update_text: `Removed assigned worker`,
            });
            onUpdate();
        }
        setLoading(false);
    };

    const updateMetadata = async (field: 'status' | 'priority', value: string) => {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/${report.id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
            },
            body: JSON.stringify({ [field]: value })
        });

        if (response.ok) {
            await (supabase.from('report_updates') as any).insert({
                report_id: report.id,
                updated_by: (await supabase.auth.getUser()).data.user?.id,
                update_text: `Updated ${field} to ${value}`,
                status_after_update: field === 'status' ? value as ReportStatus : report.status
            });
            onUpdate();
        } else {
            const err = await response.json();
            alert(err.error || 'Update failed');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 h-full">
            {/* Configuration Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest block ml-1">Status Protocol</label>
                    <select
                        value={report.status}
                        disabled={loading}
                        onChange={(e) => updateMetadata('status', e.target.value)}
                        className="w-full bg-brand-primary/10 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-2xl focus:outline-none font-bold appearance-none transition-all hover:bg-brand-primary/20"
                    >
                        {['reported', 'assigned', 'in_progress', 'awaiting_verification', 'reopened', 'closed'].map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest block ml-1">Priority Level</label>
                    <select
                        value={report.priority}
                        disabled={loading}
                        onChange={(e) => updateMetadata('priority', e.target.value)}
                        className="w-full bg-brand-primary/10 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-2xl focus:outline-none font-bold appearance-none transition-all hover:bg-brand-primary/20"
                    >
                        {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                            <option key={p} value={p}>{p.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Force Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => updateMetadata('status', 'closed')}
                    className="flex-1 py-3 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    disabled={loading || report.status === 'closed'}
                >
                    Force Finalize
                </button>
                <button
                    onClick={() => updateMetadata('priority', 'Urgent')}
                    className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/10 hover:opacity-90 transition-all active:scale-95"
                >
                    Signal Urgency
                </button>
            </div>

            <div className="h-px bg-brand-secondary/5" />

            {/* Assignment List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Assigned Operatives</h4>
                    <span className="text-[10px] font-bold text-brand-secondary/20">{report.assignments?.length || 0} ACTIVE</span>
                </div>

                <div className="space-y-2">
                    {report.assignments?.map((a) => (
                        <motion.div
                            layout
                            key={a.worker.id}
                            className="flex items-center justify-between p-3 bg-white border border-brand-secondary/5 rounded-2xl shadow-soft group hover:border-brand-secondary/10 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center font-black text-brand-secondary/40 text-[10px]">
                                    {a.worker.full_name?.[0] || 'W'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-brand-secondary">{a.worker.full_name || a.worker.email}</p>
                                    <p className="text-[9px] font-bold text-brand-secondary/30 uppercase">Worker ID: {a.worker.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeWorker(a.worker.id)}
                                className="p-2 text-brand-secondary/20 hover:text-red-500 transition-colors"
                                title="Remove Worker"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}

                    {(!report.assignments || report.assignments.length === 0) && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-2 bg-brand-primary/5 rounded-2xl border border-dashed border-brand-secondary/10 opacity-60">
                            <UserPlus size={24} className="text-brand-secondary/20" />
                            <p className="text-[10px] font-black text-brand-secondary/30 uppercase">No active assignments</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add New Worker */}
            <div className="space-y-4 pt-4 border-t border-brand-secondary/5">
                <h4 className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={12} /> Available Personnel
                </h4>
                <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {workers
                        .filter(w => !report.assignments?.some(a => a.worker.id === w.id))
                        .map(worker => (
                            <button
                                key={worker.id}
                                onClick={() => assignWorker(worker.id)}
                                className="w-full flex items-center justify-between p-4 bg-brand-primary/5 hover:bg-brand-primary/10 border border-transparent hover:border-brand-secondary/10 rounded-2xl transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-brand-secondary/20 text-[10px]">
                                        {worker.full_name?.[0] || 'W'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-brand-secondary">{worker.full_name || worker.email}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-brand-secondary/30 uppercase">Load: {workerWorkloads[worker.id] || 0} Active</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-brand-secondary/20" />
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
};
