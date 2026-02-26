import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, ShieldAlert, Send } from 'lucide-react';
import { Worker, Escalation } from '../../types/reports';

interface ReassignModalProps {
    isOpen: boolean;
    onClose: () => void;
    escalation: Escalation | null;
    workers: Worker[];
    onReassign: (workerId: string) => Promise<void>;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
    isOpen,
    onClose,
    escalation,
    workers,
    onReassign
}) => {
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const [loading, setLoading] = useState(false);

    if (!escalation) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onReassign(selectedWorkerId);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-brand-secondary/5"
                    >
                        <div className="p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase">Tactical Reassignment</h3>
                                    <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Escalation ID: {escalation.id.slice(0, 8)}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-brand-secondary/5 rounded-xl transition-colors">
                                    <X size={20} className="text-brand-secondary/40" />
                                </button>
                            </div>

                            <div className="p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100 space-y-2">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Incident Alert</span>
                                </div>
                                <p className="text-sm font-black tracking-tight">{escalation.report?.title}</p>
                                <p className="text-[10px] opacity-70 leading-relaxed">{escalation.reason}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Select Replacement Personnel</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {workers.filter(w => w.status === 'available').map(worker => (
                                            <button
                                                key={worker.id}
                                                type="button"
                                                onClick={() => setSelectedWorkerId(worker.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedWorkerId === worker.id
                                                        ? 'bg-brand-secondary text-white border-brand-secondary shadow-lg'
                                                        : 'bg-white text-brand-secondary border-brand-secondary/5 hover:border-brand-secondary/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${selectedWorkerId === worker.id ? 'bg-white/10' : 'bg-brand-secondary/5'
                                                        }`}>
                                                        {worker.profile?.full_name?.[0] || 'W'}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-black">{worker.profile?.full_name || 'Personnel'}</p>
                                                        <p className={`text-[8px] font-bold uppercase tracking-widest ${selectedWorkerId === worker.id ? 'text-white/40' : 'text-brand-secondary/30'
                                                            }`}>
                                                            {worker.department?.name || 'FIELD OPS'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedWorkerId === worker.id && <UserPlus size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!selectedWorkerId || loading}
                                    className="w-full py-5 bg-brand-secondary text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? 'REASSIGNING...' : <><Send size={18} /> Execute Shift Command</>}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
