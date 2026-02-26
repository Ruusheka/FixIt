import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, MessageSquare, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    id: string;
    comment_text: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string;
        role: string;
    };
}

interface CommentSectionProps {
    reportId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ reportId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('report_comments')
            .select('*, profiles(full_name, role)')
            .eq('report_id', reportId)
            .order('created_at', { ascending: true });

        if (data) setComments(data as any);
    };

    useEffect(() => {
        fetchComments();

        // Realtime subscription for comments
        const channel = supabase
            .channel(`comments-${reportId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'report_comments',
                filter: `report_id=eq.${reportId}`
            }, () => {
                fetchComments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [reportId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user || submitting) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('report_comments')
                .insert({
                    report_id: reportId,
                    user_id: user.id,
                    comment_text: newComment.trim()
                } as any);

            if (error) throw error;
            setNewComment('');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-brand-secondary/5 text-brand-secondary">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tighter">Tactical Comms</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">L-Link discussion and coordination channel</p>
                </div>
            </div>

            {/* Comment List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {comments.map((comment, i) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4 group"
                        >
                            <div className="shrink-0 w-10 h-10 rounded-2xl bg-brand-secondary/5 flex items-center justify-center border border-brand-secondary/5">
                                {comment.profiles.role === 'citizen' ? (
                                    <UserCircle size={20} className="text-brand-secondary/40" />
                                ) : (
                                    <ShieldCheck size={20} className="text-brand-secondary" />
                                )}
                            </div>
                            <div className="flex-1 minimal-card p-5 border-brand-secondary/5 group-hover:border-brand-secondary/10 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">
                                            {comment.profiles.full_name}
                                        </span>
                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${comment.profiles.role === 'citizen' ? 'bg-brand-secondary/5 text-brand-secondary/40' : 'bg-brand-secondary text-brand-primary'
                                            }`}>
                                            {comment.profiles.role}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">
                                        {formatDistanceToNow(new Date(comment.created_at))} ago
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-brand-secondary/60 uppercase tracking-tight leading-relaxed">
                                    {comment.comment_text}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="relative mt-10">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Broadcast intelligence update..."
                    className="input-field pr-16 py-5 w-full bg-white border-brand-secondary/10 shadow-xl shadow-brand-secondary/5 focus:shadow-2xl transition-all"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-brand-secondary text-brand-primary rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
