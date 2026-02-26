import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { MapPin, Navigation, CheckCircle, ListChecks, History, Map } from 'lucide-react';
import { socket } from '../services/socket';
import { MinimalLayout } from '../components/MinimalLayout';
import { motion } from 'framer-motion';

const navItems = [
    { label: 'My Tasks', path: '/worker', icon: ListChecks },
    { label: 'Reports Hub', path: '/reports', icon: History },
    { label: 'Map View', path: '/worker#map', icon: Map },
];

export const FieldWorker: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);

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
        const { data } = await supabase
            .from('issues')
            .select('*')
            .eq('status', 'in_progress');

        if (data) setTasks(data);
    };

    const markResolved = async (id: string) => {
        await supabase.from('issues').update({ status: 'resolved' }).eq('id', id);
        fetchIssues();
    };

    return (
        <MinimalLayout navItems={navItems} title="Worker Panel">
            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold tracking-tight">Active Assignments</h3>
                    <div className="bg-brand-secondary/5 px-4 py-1.5 rounded-full border border-brand-secondary/10">
                        <span className="text-sm font-bold">{tasks.length} Pending</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.length === 0 ? (
                        <div className="col-span-full minimal-card p-20 text-center border-dashed border-2 bg-transparent">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-brand-secondary/10" />
                            <p className="text-brand-secondary/50 font-medium text-lg">All caught up! No active tasks.</p>
                        </div>
                    ) : (
                        tasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="minimal-card p-6 flex flex-col h-full bg-white overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col gap-2">
                                        <span className={`badge-tonal w-fit ${task.severity > 7 ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-brand-secondary/5 text-brand-secondary'
                                            }`}>
                                            Priority {task.severity}/10
                                        </span>
                                        <h4 className="font-bold text-xl capitalize">{task.category}</h4>
                                    </div>
                                    {task.image_url && (
                                        <img
                                            src={task.image_url}
                                            alt="Issue"
                                            className="w-20 h-20 rounded-2xl object-cover border border-brand-secondary/5"
                                        />
                                    )}
                                </div>

                                <p className="text-brand-secondary/60 text-sm mb-6 line-clamp-3">
                                    {task.description || 'No description provided.'}
                                </p>

                                <div className="mt-auto space-y-6">
                                    <div className="flex items-center gap-2 text-sm font-medium text-brand-secondary/40">
                                        <MapPin size={16} />
                                        <span className="truncate">{task.address || 'Location Details'}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-secondary/5">
                                        <button className="btn-secondary h-12 flex items-center justify-center gap-2 text-sm">
                                            <Navigation size={18} />
                                            Route
                                        </button>
                                        <button
                                            onClick={() => markResolved(task.id)}
                                            className="btn-primary h-12 flex items-center justify-center gap-2 text-sm"
                                        >
                                            <CheckCircle size={18} />
                                            Complete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </MinimalLayout>
    );
};
