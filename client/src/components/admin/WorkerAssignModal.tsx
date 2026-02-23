import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, AlertTriangle, Clock, Send } from 'lucide-react';

interface WorkerAssignModalProps {
    isOpen: boolean;
    issue: any | null;
    onClose: () => void;
    onAssign: (issueId: string, data: AssignmentData) => void;
}

interface AssignmentData {
    worker: string;
    department: string;
    priority: string;
    deadline: string;
    notes: string;
}

const departments = ['Roads', 'Water', 'Sanitation', 'Infrastructure', 'Logistics'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const demoWorkers = [
    'Rajesh Kumar', 'Priya Mehta', 'Amit Singh', 'Neha Rani',
    'Vikram Patel', 'Sunita Devi', 'Rohit Sharma', 'Kavita Joshi',
];

export const WorkerAssignModal: React.FC<WorkerAssignModalProps> = ({ isOpen, issue, onClose, onAssign }) => {
    const [worker, setWorker] = useState('');
    const [department, setDepartment] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!issue || !worker) return;
        onAssign(issue.id, { worker, department, priority, deadline, notes });
        onClose();
        setWorker(''); setDepartment(''); setNotes('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={e => e.stopPropagation()}
                        className="minimal-card w-full max-w-lg p-8 bg-white border-brand-secondary/10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 border-b border-brand-secondary/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase">Operational Dispatch</h3>
                                <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest mt-1">
                                    {issue?.category && <span className="text-brand-secondary/60">{issue.category}</span>}
                                    {issue?.ticket_id && <> // {issue.ticket_id}</>}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 text-brand-secondary/20 hover:text-brand-secondary transition-colors bg-brand-secondary/5 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Worker */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                    <User className="w-3.5 h-3.5" /> Personnel Selection
                                </label>
                                <select
                                    value={worker} onChange={e => setWorker(e.target.value)} required
                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 appearance-none font-bold"
                                >
                                    <option value="">Choose operative...</option>
                                    {demoWorkers.map(w => <option key={w} value={w}>{w.toUpperCase()}</option>)}
                                </select>
                            </div>

                            {/* Department + Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                        <Briefcase className="w-3.5 h-3.5" /> Sector
                                    </label>
                                    <select
                                        value={department} onChange={e => setDepartment(e.target.value)}
                                        className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-xl focus:outline-none font-bold appearance-none"
                                    >
                                        <option value="">Select sector...</option>
                                        {departments.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Priority
                                    </label>
                                    <select
                                        value={priority} onChange={e => setPriority(e.target.value)}
                                        className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-xl focus:outline-none font-bold appearance-none"
                                    >
                                        {priorities.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" /> Resolution SLA
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deadline} onChange={e => setDeadline(e.target.value)}
                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 font-bold"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest block">Tactical Instructions</label>
                                <textarea
                                    value={notes} onChange={e => setNotes(e.target.value)}
                                    rows={3} placeholder="Provide specific operational details..."
                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 placeholder:text-brand-secondary/20 resize-none font-medium"
                                />
                            </div>

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full flex items-center justify-center gap-3 py-4 bg-brand-secondary text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-brand-secondary/10 hover:opacity-90 transition-all"
                            >
                                <Send className="w-4 h-4" /> Finalize Dispatch
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
