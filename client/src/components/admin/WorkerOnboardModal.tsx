import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Building2, ShieldCheck } from 'lucide-react';
import { Department } from '../../types/reports';

interface WorkerOnboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOnboard: (email: string, deptId: string) => Promise<void>;
    departments: Department[];
}

export const WorkerOnboardModal: React.FC<WorkerOnboardModalProps> = ({
    isOpen,
    onClose,
    onOnboard,
    departments
}) => {
    const [email, setEmail] = useState('');
    const [deptId, setDeptId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onOnboard(email, deptId);
            onClose();
            setEmail('');
            setDeptId('');
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
                        className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-brand-secondary/5"
                    >
                        <div className="p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase">Onboard Personnel</h3>
                                    <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Recruit new field operations worker</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-brand-secondary/5 rounded-xl transition-colors">
                                    <X size={20} className="text-brand-secondary/40" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/20" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="worker@fixit.com"
                                            className="w-full pl-12 pr-6 py-4 bg-brand-primary/5 border border-brand-secondary/5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-secondary/10 transition-all outline-none text-brand-secondary"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/20" size={18} />
                                        <select
                                            required
                                            value={deptId}
                                            onChange={(e) => setDeptId(e.target.value)}
                                            className="w-full pl-12 pr-6 py-4 bg-brand-primary/5 border border-brand-secondary/5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-secondary/10 transition-all outline-none text-brand-secondary appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-brand-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'DEPLOYING...' : <><ShieldCheck size={18} /> Authorize Access</>}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
