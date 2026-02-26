import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, ImageIcon, User } from 'lucide-react';

interface VerificationItem {
    id: string;
    ticket_id: string;
    category: string;
    worker: string;
    before_image?: string;
    after_image?: string;
    notes: string;
    submitted_at: string;
}

interface VerificationPanelProps {
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onRework: (id: string) => void;
}

const demoVerifications: VerificationItem[] = [
    { id: '1', ticket_id: 'FX-1025', category: 'pothole', worker: 'Rajesh K.', notes: 'Filled with asphalt and leveled.', submitted_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', ticket_id: 'FX-1019', category: 'streetlight', worker: 'Amit S.', notes: 'Replaced LED bulb and wiring.', submitted_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', ticket_id: 'FX-1015', category: 'garbage', worker: 'Priya M.', notes: 'Area cleaned and bins replaced.', submitted_at: new Date(Date.now() - 14400000).toISOString() },
];

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ onApprove, onReject, onRework }) => (
    <section className="mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-secondary rounded-xl">
                    <CheckCircle className="w-6 h-6 text-brand-primary" />
                </div>
                <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Field Validation</h2>
            </div>
            <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12 mt-1">Operational protocol audit & worker submission review</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoVerifications.map((item, i) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="minimal-card overflow-hidden bg-white shadow-soft group hover:border-brand-secondary/10 transition-all"
                >
                    {/* Before / After */}
                    <div className="grid grid-cols-2 h-32 bg-brand-secondary/5 relative">
                        <div className="flex flex-col items-center justify-center border-r border-brand-secondary/5 relative group/img cursor-zoom-in">
                            <ImageIcon className="w-6 h-6 text-brand-secondary/10 group-hover/img:text-brand-secondary/30 transition-colors" />
                            <span className="absolute bottom-2 text-[8px] font-black text-brand-secondary/20 uppercase tracking-[0.2em]">Initial State</span>
                        </div>
                        <div className="flex flex-col items-center justify-center relative group/img cursor-zoom-in">
                            <ImageIcon className="w-6 h-6 text-brand-secondary/10 group-hover/img:text-brand-secondary/30 transition-colors" />
                            <span className="absolute bottom-2 text-[8px] font-black text-brand-secondary/20 uppercase tracking-[0.2em]">Resolved Node</span>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-brand-secondary/5 flex items-center justify-center z-10 shadow-sm">
                            <RotateCcw className="w-3.5 h-3.5 text-brand-secondary/20" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-brand-secondary font-black text-[10px] uppercase tracking-widest">{item.ticket_id}</span>
                            <span className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">{new Date(item.submitted_at).toLocaleDateString()}</span>
                        </div>

                        <div>
                            <h4 className="text-lg font-black text-brand-secondary capitalize tracking-tight leading-tight">{item.category}</h4>
                            <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                                <User className="w-3.5 h-3.5" />
                                <span>Worker: {item.worker}</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-brand-secondary/[0.02] border border-brand-secondary/5">
                            <p className="text-[11px] text-brand-secondary/60 leading-relaxed font-medium">"{item.notes}"</p>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <button
                                onClick={() => onApprove(item.id)}
                                title="Approve Task"
                                className="flex items-center justify-center p-3 text-brand-secondary hover:bg-brand-secondary hover:text-white bg-brand-secondary/5 rounded-xl transition-all"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onRework(item.id)}
                                title="Request Rework"
                                className="flex items-center justify-center p-3 text-brand-secondary/40 hover:bg-brand-secondary hover:text-white bg-brand-secondary/5 rounded-xl transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onReject(item.id)}
                                title="Reject Submission"
                                className="flex items-center justify-center p-3 text-brand-secondary/40 hover:bg-brand-secondary hover:text-white bg-brand-secondary/5 rounded-xl transition-all"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);
