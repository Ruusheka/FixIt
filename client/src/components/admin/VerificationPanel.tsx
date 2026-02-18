import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, ImageIcon } from 'lucide-react';

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
    <section className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Field Work Verification</h2>
            <p className="text-civic-muted text-sm">Review worker submissions before closing tickets</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoVerifications.map((item, i) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card overflow-hidden"
                >
                    {/* Before / After */}
                    <div className="grid grid-cols-2 h-28">
                        <div className="bg-civic-card flex flex-col items-center justify-center border-r border-white/5 relative">
                            <ImageIcon className="w-5 h-5 text-civic-muted/30" />
                            <span className="absolute bottom-1 text-[9px] text-civic-muted">BEFORE</span>
                        </div>
                        <div className="bg-civic-card flex flex-col items-center justify-center relative">
                            <ImageIcon className="w-5 h-5 text-green-400/30" />
                            <span className="absolute bottom-1 text-[9px] text-civic-muted">AFTER</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-civic-orange text-xs font-mono font-bold">{item.ticket_id}</span>
                            <span className="text-[10px] text-civic-muted">{new Date(item.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white capitalize">{item.category}</h4>
                        <p className="text-xs text-civic-muted">Worker: {item.worker}</p>
                        <p className="text-xs text-civic-muted italic">"{item.notes}"</p>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            <button
                                onClick={() => onApprove(item.id)}
                                className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-green-400 glass-card hover:bg-green-500/10 transition-colors"
                            >
                                <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                                onClick={() => onReject(item.id)}
                                className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-red-400 glass-card hover:bg-red-500/10 transition-colors"
                            >
                                <XCircle className="w-3 h-3" /> Reject
                            </button>
                            <button
                                onClick={() => onRework(item.id)}
                                className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-orange-400 glass-card hover:bg-orange-500/10 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Rework
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);
