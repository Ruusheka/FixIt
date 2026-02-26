import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { MapPin, Navigation, CheckCircle, ListChecks, History, Map, Clock, AlertCircle, Bell } from 'lucide-react';
import { socket } from '../services/socket';
import { MinimalLayout } from '../components/MinimalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ProofUploadModal } from '../components/worker/ProofUploadModal';
import { AnnouncementPanel } from '../components/citizen/AnnouncementPanel';

const navItems = [
    { label: 'My Tasks', path: '/worker', icon: ListChecks },
    { label: 'Reports Hub', path: '/reports', icon: History },
    { label: 'Map View', path: '/worker#map', icon: Map },
    { label: 'Alerts', path: '/worker#announcements', icon: Bell },
];

export const FieldWorker: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    useEffect(() => {
        fetchIssues();

        socket.on('new_issue', (issue: any) => {
            if (issue.status === 'in_progress') {
                setTasks(prev => [issue, ...prev]);
            }
        });

        socket.on('issue_updated', (updatedIssue: any) => {
            if (updatedIssue.status === 'in_progress') {
                setTasks(prev => {
                    const exists = prev.find(t => t.id === updatedIssue.id);
                    if (exists) return prev.map(t => t.id === updatedIssue.id ? updatedIssue : t);
                    return [updatedIssue, ...prev];
                });
            } else {
                setTasks(prev => prev.filter(t => t.id !== updatedIssue.id));
            }
        });

        return () => {
            socket.off('new_issue');
            socket.off('issue_updated');
        };
    }, []);

    const fetchIssues = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('issues')
            .select(`
                *,
                report_assignments!inner(worker_id)
            `)
            .eq('report_assignments.worker_id', user.id)
            .in('status', ['in_progress', 'reopened']);

        if (data) setTasks(data);
    };

    return (
        <MinimalLayout navItems={navItems} title="Field Operations Hub">
            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-1">Active Assignments</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Current Operational Responsibility</p>
                    </div>
                    <div className="bg-brand-secondary text-white px-6 py-2 rounded-full shadow-lg shadow-brand-secondary/20">
                        <span className="text-[10px] font-black uppercase tracking-widest">{tasks.length} Vectors Pending</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tasks.length === 0 ? (
                        <div className="col-span-full minimal-card p-24 text-center border-dashed border-4 border-brand-secondary/5 bg-transparent rounded-[60px]">
                            <div className="w-20 h-20 bg-brand-secondary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-brand-secondary/20" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tight mb-2">Zero Conflict Zone</h3>
                            <p className="text-brand-secondary/40 font-bold uppercase tracking-[0.2em] text-[10px]">All assignments completed. Intelligence standby engaged.</p>
                        </div>
                    ) : (
                        tasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group minimal-card p-8 flex flex-col h-full bg-white hover:shadow-2xl hover:shadow-brand-secondary/10 transition-all duration-500 rounded-[48px] border-brand-secondary/5"
                            >
                                <div className="flex justify-between items-start mb-6 gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${task.status === 'reopened' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-brand-secondary/5 text-brand-secondary border border-brand-secondary/10'}`}>
                                                {task.status === 'reopened' ? 'REWORK REQUIRED' : 'ACTIVE OPS'}
                                            </span>
                                            <span className="px-3 py-1 bg-brand-secondary text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                                SEVERITY {task.severity}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-2xl uppercase tracking-tighter text-brand-secondary line-clamp-1">{task.title || task.category}</h4>
                                    </div>
                                    {task.image_url && (
                                        <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-white shadow-soft shrink-0">
                                            <img src={task.image_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-brand-secondary/60 text-xs font-medium leading-relaxed mb-8 line-clamp-3">
                                    {task.description || 'No contextual intel provided for this mission packet.'}
                                </p>

                                <div className="mt-auto space-y-6">
                                    <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-secondary/5 space-y-3">
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-brand-secondary uppercase tracking-widest">
                                            <MapPin size={14} className="text-brand-secondary/40" />
                                            <span className="truncate">{task.address || 'Geo-Location Encrypted'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-brand-secondary/60 uppercase tracking-widest">
                                            <Clock size={14} className="text-brand-secondary/40" />
                                            <span>Received {new Date(task.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <a
                                            href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-14 bg-brand-primary text-brand-secondary rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all"
                                        >
                                            <Navigation size={18} />
                                            NAVIGATE
                                        </a>
                                        <button
                                            onClick={() => setSelectedTaskId(task.id)}
                                            className="h-14 bg-brand-secondary text-white rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-brand-secondary/20 transition-all shadow-lg"
                                        >
                                            <CheckCircle size={18} />
                                            WORK COMPLETED
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Announcements & Alerts Section */}
                <section id="announcements" className="pt-24 border-t border-brand-secondary/5">
                    <div className="mb-12">
                        <h3 className="text-4xl font-black tracking-tighter text-brand-secondary uppercase">Announcements & Alerts</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-2">Operational broadcasts and safety alerts</p>
                    </div>
                    <AnnouncementPanel role="Worker" />
                </section>
            </div>

            <AnimatePresence>
                {selectedTaskId && (
                    <ProofUploadModal
                        reportId={selectedTaskId}
                        onSuccess={() => {
                            setSelectedTaskId(null);
                            fetchIssues();
                        }}
                        onClose={() => setSelectedTaskId(null)}
                    />
                )}
            </AnimatePresence>
        </MinimalLayout>
    );
};
