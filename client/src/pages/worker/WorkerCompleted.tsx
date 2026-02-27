import React, { useEffect, useState } from 'react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { CheckCircle, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

export const WorkerCompleted: React.FC = () => {
    const { profile } = useAuth();
    const [completedWorks, setCompletedWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.id) return;
        fetchCompletedWorks();
    }, [profile?.id]);

    const fetchCompletedWorks = async () => {
        setLoading(true);
        // Fetch issues assigned to me that are 'resolved'
        const { data, error } = await supabase
            .from('issues')
            .select(`
                *,
                report_assignments!inner(worker_id),
                worker_ratings(rating, remark, rated_at, rated_by)
            `)
            .eq('report_assignments.worker_id', profile?.id || '')
            .eq('status', 'resolved')
            .order('resolved_at', { ascending: false, nullsFirst: false });

        if (data) setCompletedWorks(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <WorkerLayout title="Archive Access">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    return (
        <WorkerLayout title="Completed Operations">
            <div className="max-w-5xl mx-auto py-8">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-2">Historical Service Record</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40">Verified and Rated Completed Directives</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {completedWorks.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-[40px] border border-brand-secondary/5 shadow-soft">
                            <CheckCircle className="w-16 h-16 text-brand-secondary/20 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase mb-2">No Records Found</h3>
                            <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-widest">Complete missions to build your service record.</p>
                        </div>
                    ) : (
                        completedWorks.map((work, i) => {
                            // Find rating associated with this worker and this report
                            const myRating = (work.worker_ratings as any[] | null)?.find((r: any) => true); // In genuine system, filter by worker_id ideally

                            return (
                                <motion.div
                                    key={work.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-[40px] p-8 border border-brand-secondary/5 shadow-soft hover:shadow-xl transition-all flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-brand-secondary/50 uppercase tracking-widest">Op Concluded</p>
                                                <h3 className="font-black text-brand-secondary text-xl uppercase tracking-tighter truncate max-w-[200px]">{work.title || 'Classified'}</h3>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest leading-none mb-1">Clearance Date</p>
                                            <p className="text-xs font-bold text-brand-secondary">{work.resolved_at ? new Date(work.resolved_at).toLocaleDateString() : 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* Rating Block */}
                                    <div className="mt-auto pt-6 border-t border-brand-secondary/10">
                                        {myRating ? (
                                            <div className="bg-brand-secondary/5 rounded-2xl p-5 border border-brand-secondary/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">HQ Rating</span>
                                                    <div className="flex gap-1 text-yellow-400">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} size={14} fill={myRating.rating >= star ? "currentColor" : "none"} className={myRating.rating >= star ? "" : "text-brand-secondary/20"} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {myRating.remark && (
                                                    <div className="flex gap-2">
                                                        <MessageSquare size={12} className="text-brand-secondary/40 shrink-0 mt-0.5" />
                                                        <p className="text-xs font-medium text-brand-secondary/80 italic line-clamp-2">"{myRating.remark}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-amber-500/5 rounded-2xl p-5 border border-amber-500/20 flex flex-col items-center justify-center text-center">
                                                <AlertTriangle size={20} className="text-amber-500 mb-2" />
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending HQ Performance Review</p>
                                            </div>
                                        )}
                                    </div>

                                    <a href={`/worker/works/${work.id}`} className="mt-6 block w-full text-center py-3 border border-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                        Review OP Details
                                    </a>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </WorkerLayout>
    );
};
