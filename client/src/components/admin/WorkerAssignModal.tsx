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

const departments = ['Roads', 'Water', 'Electricity', 'Sanitation', 'General'];
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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="glass-card w-full max-w-lg p-6 glow-orange"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Assign Worker</h3>
                                <p className="text-xs text-civic-muted mt-0.5">
                                    {issue?.category && <span className="capitalize">{issue.category}</span>}
                                    {issue?.address && <> — {issue.address}</>}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-1 text-civic-muted hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Worker */}
                            <div>
                                <label className="flex items-center gap-1 text-xs text-civic-muted mb-1.5 font-medium">
                                    <User className="w-3 h-3" /> Select Worker
                                </label>
                                <select
                                    value={worker} onChange={e => setWorker(e.target.value)} required
                                    className="w-full glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-civic-orange/50"
                                >
                                    <option value="" className="bg-civic-dark">Choose worker...</option>
                                    {demoWorkers.map(w => <option key={w} value={w} className="bg-civic-dark">{w}</option>)}
                                </select>
                            </div>

                            {/* Department + Priority */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1 text-xs text-civic-muted mb-1.5 font-medium">
                                        <Briefcase className="w-3 h-3" /> Department
                                    </label>
                                    <select
                                        value={department} onChange={e => setDepartment(e.target.value)}
                                        className="w-full glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none"
                                    >
                                        <option value="" className="bg-civic-dark">Select dept...</option>
                                        {departments.map(d => <option key={d} value={d} className="bg-civic-dark">{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-xs text-civic-muted mb-1.5 font-medium">
                                        <AlertTriangle className="w-3 h-3" /> Priority
                                    </label>
                                    <select
                                        value={priority} onChange={e => setPriority(e.target.value)}
                                        className="w-full glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none"
                                    >
                                        {priorities.map(p => <option key={p} value={p} className="bg-civic-dark">{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="flex items-center gap-1 text-xs text-civic-muted mb-1.5 font-medium">
                                    <Clock className="w-3 h-3" /> Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deadline} onChange={e => setDeadline(e.target.value)}
                                    className="w-full glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-civic-orange/50"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs text-civic-muted mb-1.5 font-medium block">Notes</label>
                                <textarea
                                    value={notes} onChange={e => setNotes(e.target.value)}
                                    rows={2} placeholder="Additional instructions..."
                                    className="w-full glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-civic-orange/50 placeholder:text-civic-muted/50 resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-civic-orange to-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-civic-orange/25"
                            >
                                <Send className="w-4 h-4" /> Dispatch Worker
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
