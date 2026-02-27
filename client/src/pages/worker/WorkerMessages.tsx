import React, { useEffect, useState } from 'react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { MessageSquare, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const WorkerMessages: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.id) return;
        fetchGlobalMessages();
    }, [profile?.id]);

    const fetchGlobalMessages = async () => {
        setLoading(true);
        // We fetch the most recent messages sent to issues assigned to this worker
        // This query requires joining issues on assignments

        // As a shortcut, just fetch works they are assigned to, then fetch messages for those.
        const { data: assignments } = await supabase
            .from('report_assignments')
            .select('report_id')
            .eq('worker_id', profile?.id || '');

        if (assignments && assignments.length > 0) {
            const reportIds = (assignments as any[]).map(a => a.report_id);
            const { data: messages } = await supabase
                .from('worker_admin_messages')
                .select(`*, issues(title)`)
                .in('report_id', reportIds)
                .order('created_at', { ascending: false })
                .limit(20);

            if (messages) {
                // Deduplicate to show only the latest message per report thread
                const uniqueThreads = (messages as any[]).reduce<any[]>((acc, current: any) => {
                    const x = acc.find((item: any) => item.report_id === current.report_id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);
                setRecentMessages(uniqueThreads);
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <WorkerLayout title="Communications">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    return (
        <WorkerLayout title="Encrypted Comms">
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-2">Message Center</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40">Latest HQ transmissions per operation</p>
                </div>

                <div className="space-y-4">
                    {recentMessages.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[40px] border border-brand-secondary/5 shadow-soft">
                            <MessageSquare className="w-16 h-16 text-brand-secondary/20 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase mb-2">Comms Silence</h3>
                            <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-widest">No active communication threads.</p>
                        </div>
                    ) : (
                        recentMessages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => navigate(`/worker/works/${msg.report_id}`)}
                                className="bg-white rounded-[24px] p-6 border border-brand-secondary/5 shadow-sm hover:shadow-lg transition-all flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="w-12 h-12 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                        {msg.sender_role === 'admin' ? <Shield size={20} /> : <MessageSquare size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-brand-secondary/50 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            {msg.sender_role === 'admin' ? 'HQ Transmission' : 'Your Last Report'}
                                            <span className="opacity-50 inline-block w-1 h-1 rounded-full bg-current" />
                                            {new Date(msg.created_at).toLocaleString()}
                                        </p>
                                        <h3 className="font-black text-brand-secondary uppercase tracking-tight mb-2 truncate max-w-[300px]">
                                            OP: {msg.issues?.title || 'Classified'}
                                        </h3>
                                        <p className={`text-sm font-medium truncate max-w-[400px] ${msg.read_status === false && msg.sender_role === 'admin' ? 'text-brand-secondary font-bold' : 'text-brand-secondary/60'}`}>
                                            "{msg.message}"
                                        </p>
                                    </div>
                                </div>
                                <div className="text-brand-secondary/20 group-hover:text-brand-secondary group-hover:translate-x-1 transition-all">
                                    <ArrowRight size={24} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </WorkerLayout>
    );
};
