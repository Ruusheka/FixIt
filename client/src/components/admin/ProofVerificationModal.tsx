import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { WorkProof } from '../../types/reports';
import { supabase } from '../../services/supabase';

interface VerificationModalProps {
    reportId: string;
    proof: WorkProof;
    onSuccess: () => void;
    onClose: () => void;
}

export const ProofVerificationModal: React.FC<VerificationModalProps> = ({ reportId, proof, onSuccess, onClose }) => {
    const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!action) return;
        if (action === 'rejected' && !comment.trim()) {
            setError('Rework instructions are mandatory for rejection.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/${reportId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({ action, comment })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Verification failed');
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
                {/* Left: Proof Image */}
                <div className="flex-1 bg-brand-primary/5 p-4 border-r border-brand-secondary/5 relative min-h-[300px]">
                    <img
                        src={proof.image_url}
                        alt="Resolution Proof"
                        className="w-full h-full object-contain rounded-[32px] bg-black/5"
                    />
                    <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-brand-secondary/5 shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center font-black text-brand-secondary/40 text-[10px]">
                                {proof.worker?.full_name?.[0] || 'W'}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-brand-secondary">Submitted By: {proof.worker?.full_name || 'Field Operative'}</p>
                                <p className="text-[9px] font-bold uppercase text-brand-secondary/30">{new Date(proof.submitted_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-brand-secondary/60 italic leading-relaxed">
                            "{proof.description || 'No worker notes provided.'}"
                        </p>
                    </div>
                </div>

                {/* Right: Verification Form */}
                <div className="w-full md:w-[400px] flex flex-col">
                    <div className="p-8 border-b border-brand-secondary/5 flex justify-between items-center bg-white">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-brand-secondary">Audit Verification</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 mt-1">High-Responsibility Action</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-brand-secondary/5 rounded-full transition-all">
                            <X size={20} className="text-brand-secondary" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] block">Status Determination</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAction('approved')}
                                    className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${action === 'approved'
                                            ? 'bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/20'
                                            : 'bg-white border-brand-secondary/5 text-brand-secondary/40 hover:border-green-500/30'
                                        }`}
                                >
                                    <CheckCircle2 size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Approve & Close</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAction('rejected')}
                                    className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${action === 'rejected'
                                            ? 'bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/20'
                                            : 'bg-white border-brand-secondary/5 text-brand-secondary/40 hover:border-red-500/30'
                                        }`}
                                >
                                    <RotateCcw size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Reject & Rework</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] block">
                                Audit Comments {action === 'rejected' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={action === 'rejected' ? "DESCRIBE REWORK REQUIREMENTS..." : "VERIFICATION NOTES (OPTIONAL)..."}
                                className="w-full p-6 bg-brand-primary/5 border border-brand-secondary/5 rounded-3xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand-secondary/10 outline-none min-h-[140px] resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                <AlertCircle size={18} className="text-red-500 shrink-0" />
                                <p className="text-[10px] font-bold uppercase text-red-600 tracking-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={!action || loading}
                                className={`w-full h-16 rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl transition-all flex items-center justify-center gap-4 ${!action
                                        ? 'bg-brand-primary text-brand-secondary/20 cursor-not-allowed shadow-none'
                                        : action === 'approved'
                                            ? 'bg-brand-secondary text-white shadow-brand-secondary/20'
                                            : 'bg-red-600 text-white shadow-red-600/20'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        Finalize Decision
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
