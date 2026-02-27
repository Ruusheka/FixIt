import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, AlertCircle, CheckCircle2, RotateCcw, Star, User, Calendar } from 'lucide-react';
import { ResolutionProof } from '../../types/reports';
import { supabase } from '../../services/supabase';


interface VerificationModalProps {
    reportId: string;
    proof: ResolutionProof;
    onSuccess: () => void;
    onClose: () => void;
}

export const ProofVerificationModal: React.FC<VerificationModalProps> = ({ reportId, proof, onSuccess, onClose }) => {
    const [action, setAction] = useState<'approved' | 'rejected' | 'reassign' | null>(null);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!action) return;
        if ((action === 'rejected' || action === 'reassign') && !comment.trim()) {
            setError('Instructions are mandatory for rejection / reassignment.');
            return;
        }
        if (action === 'approved' && rating === 0) {
            setError('Please assign a performance rating before closing.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (action === 'reassign') {
                // Close current assignment and set status to reopened
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/${reportId}/verify`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                        },
                        body: JSON.stringify({ action: 'rejected', comment: `[REASSIGN] ${comment}`, rating: 0 })
                    }
                );
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Reassign failed');
                }
                // Deactivate the existing assignment so admin can assign new worker
                await (supabase.from('report_assignments') as any)
                    .update({ is_active: false })
                    .eq('report_id', reportId)
                    .eq('is_active', true);

                // Send notification to current worker
                if (proof.worker_id) {
                    await (supabase.from('notifications') as any).insert({
                        user_id: proof.worker_id,
                        title: 'Task Reassigned',
                        message: `Your assignment for this report has been reassigned. Reason: ${comment}`,
                        type: 'assignment',
                        link: `/worker/works/${reportId}`,
                    });
                }
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/${reportId}/verify`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                        },
                        body: JSON.stringify({ action, comment, rating })
                    }
                );

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Verification failed');
                }

                // If approved — notify citizen
                if (action === 'approved') {
                    const { data: issueData } = await (supabase.from('issues') as any)
                        .select('user_id, title')
                        .eq('id', reportId)
                        .single();

                    if ((issueData as any)?.user_id) {
                        await (supabase.from('notifications') as any).insert({
                            user_id: (issueData as any).user_id,
                            title: '✔ Issue Resolved',
                            message: `Your report "${(issueData as any).title}" has been verified and resolved!`,
                            type: 'resolution',
                            link: `/citizen/reports/${reportId}`,
                        });
                    }

                    // Notify worker
                    if (proof.worker_id) {
                        await (supabase.from('notifications') as any).insert({
                            user_id: proof.worker_id,
                            title: 'Work Approved!',
                            message: `Your work on report has been approved. Rating: ${rating}/5 stars.`,
                            type: 'assignment',
                        });
                    }
                } else if (action === 'rejected') {
                    // Notify worker of rework
                    if (proof.worker_id) {
                        await (supabase.from('notifications') as any).insert({
                            user_id: proof.worker_id,
                            title: '⚠ Rework Required',
                            message: `Admin requested rework: ${comment}`,
                            type: 'assignment',
                            link: `/worker/works/${reportId}`,
                        });
                    }
                }
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 pointer-events-none">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-xl pointer-events-auto"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
            >
                {/* Left: Proof Image + Worker Info */}
                <div className="flex-1 bg-brand-primary/5 p-4 border-r border-brand-secondary/5 relative min-h-[300px] flex flex-col">
                    <div className="flex-1 relative rounded-[32px] overflow-hidden bg-black/5">
                        <img
                            src={proof.after_image_url || proof.before_image_url}
                            alt="Resolution Proof"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    {/* Worker & timestamp card */}
                    <div className="mt-4 p-5 bg-white rounded-3xl border border-brand-secondary/5 shadow-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-secondary/10 flex items-center justify-center font-black text-brand-secondary/50 text-sm shrink-0">
                                {proof.worker?.full_name?.[0] || 'W'}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-brand-secondary">
                                    {proof.worker?.full_name || 'Field Operative'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-brand-secondary/30">
                                    <Calendar size={10} />
                                    <p className="text-[9px] font-bold uppercase">{new Date(proof.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        {proof.admin_notes && (
                            <p className="text-xs font-medium text-brand-secondary/60 italic leading-relaxed border-t border-brand-secondary/5 pt-3">
                                "{proof.admin_notes}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Verification Form */}
                <div className="w-full md:w-[420px] flex flex-col">
                    <div className="p-8 border-b border-brand-secondary/5 flex justify-between items-center bg-white">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-brand-secondary">Proof Review</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 mt-1">Verify or Request Changes</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-brand-secondary/5 rounded-full transition-all">
                            <X size={20} className="text-brand-secondary" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] block">Your Decision</label>
                            <div className="grid grid-cols-1 gap-3">
                                {/* Approve */}
                                <button
                                    type="button"
                                    onClick={() => setAction('approved')}
                                    className={`h-16 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${action === 'approved'
                                        ? 'bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/20'
                                        : 'bg-white border-brand-secondary/5 text-brand-secondary/40 hover:border-green-500/30 hover:text-green-600'
                                        }`}
                                >
                                    <CheckCircle2 size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Approve Work</span>
                                </button>

                                {/* Rework Same Worker */}
                                <button
                                    type="button"
                                    onClick={() => setAction('rejected')}
                                    className={`h-16 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${action === 'rejected'
                                        ? 'bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-white border-brand-secondary/5 text-brand-secondary/40 hover:border-red-500/30 hover:text-red-600'
                                        }`}
                                >
                                    <RotateCcw size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Rework Same Worker</span>
                                </button>

                                {/* Reassign New Worker */}
                                <button
                                    type="button"
                                    onClick={() => setAction('reassign')}
                                    className={`h-16 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${action === 'reassign'
                                        ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/20'
                                        : 'bg-white border-brand-secondary/5 text-brand-secondary/40 hover:border-amber-500/30 hover:text-amber-600'
                                        }`}
                                >
                                    <User size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Reassign New Worker</span>
                                </button>
                            </div>
                        </div>

                        {/* Rating (only for approve) */}
                        <AnimatePresence>
                            {action === 'approved' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden"
                                >
                                    <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] block">
                                        Worker Rating <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex justify-center gap-2 p-5 bg-brand-primary/5 rounded-2xl border border-brand-secondary/5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-all hover:scale-110 p-1"
                                            >
                                                <Star
                                                    size={28}
                                                    fill={rating >= star ? '#FBBF24' : 'none'}
                                                    className={rating >= star ? 'text-yellow-400' : 'text-brand-secondary/20 hover:text-yellow-400/50'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Comment */}
                        {action && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] block">
                                    {action === 'rejected' ? 'Rework Instructions' : action === 'reassign' ? 'Reassignment Reason' : 'Verification Notes'}
                                    {(action === 'rejected' || action === 'reassign') && <span className="text-red-500"> *</span>}
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={
                                        action === 'rejected' ? 'e.g. Road not fully repaired — please redo...' :
                                            action === 'reassign' ? 'Reason for reassigning to another worker...' :
                                                'Optional verification notes...'
                                    }
                                    className="w-full p-5 bg-brand-primary/5 border border-brand-secondary/5 rounded-2xl text-xs font-bold text-brand-secondary focus:ring-2 focus:ring-brand-secondary/10 outline-none min-h-[100px] resize-none placeholder:text-brand-secondary/30 placeholder:font-medium placeholder:normal-case placeholder:tracking-normal"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                <AlertCircle size={18} className="text-red-500 shrink-0" />
                                <p className="text-[10px] font-bold uppercase text-red-600 tracking-tight">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!action || loading}
                            className={`w-full h-14 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3 ${!action
                                ? 'bg-brand-primary text-brand-secondary/20 cursor-not-allowed shadow-none'
                                : action === 'approved'
                                    ? 'bg-green-500 text-white shadow-green-500/20 hover:-translate-y-0.5'
                                    : action === 'reassign'
                                        ? 'bg-amber-500 text-white shadow-amber-500/20 hover:-translate-y-0.5'
                                        : 'bg-red-600 text-white shadow-red-600/20 hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    {action === 'approved' ? 'Approve & Close' : action === 'reassign' ? 'Reassign Worker' : 'Request Rework'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
