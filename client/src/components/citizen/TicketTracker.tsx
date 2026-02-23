import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, CheckCircle2 } from 'lucide-react';

interface Ticket {
    id: string;
    ticket_id: string;
    image_url?: string;
    category: string;
    status: string;
    created_at: string;
    assigned_worker?: string;
    sla_deadline?: string;
}

interface TicketTrackerProps {
    ticket: Ticket;
}

const steps = ['reported', 'assigned', 'in_progress', 'fixed', 'verified'];
const stepLabels = ['Reported', 'Assigned', 'In Progress', 'Fixed', 'Verified'];

const getStepIndex = (status: string): number => {
    const idx = steps.indexOf(status);
    return idx >= 0 ? idx : 0;
};

const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const getSLARemaining = (deadline?: string): string | null => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return 'Overdue';
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h remaining`;
    return `${Math.floor(hrs / 24)}d remaining`;
};

export const TicketTracker: React.FC<TicketTrackerProps> = ({ ticket }) => {
    const currentStep = getStepIndex(ticket.status);
    const sla = getSLARemaining(ticket.sla_deadline);

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="minimal-card p-6 space-y-6 bg-white"
        >
            {/* Header */}
            <div className="flex items-start gap-5">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-brand-secondary/5 border border-brand-secondary/5">
                    {ticket.image_url ? (
                        <img src={ticket.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            <Clock className="w-8 h-8 text-brand-secondary" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-brand-secondary/40 font-black text-[10px] uppercase tracking-widest">{ticket.ticket_id}</span>
                        <span className="text-brand-secondary/40 text-[10px] font-bold uppercase tracking-widest">{getTimeAgo(ticket.created_at)}</span>
                    </div>
                    <h4 className="font-bold text-xl text-brand-secondary capitalize mt-1 leading-tight">{ticket.category}</h4>
                    <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-brand-secondary/40">
                        {ticket.assigned_worker && (
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                {ticket.assigned_worker}
                            </span>
                        )}
                        {sla && (
                            <span className={`flex items-center gap-1.5 ${sla === 'Overdue' ? 'text-red-500' : ''}`}>
                                <Clock className="w-3.5 h-3.5" />
                                {sla}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Stepper */}
            <div className="pt-4 flex items-center justify-between gap-1">
                {steps.map((step, i) => {
                    const isComplete = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-2">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.1 : 1,
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isComplete
                                            ? 'bg-brand-secondary border-brand-secondary'
                                            : 'bg-white border-brand-secondary/10'
                                        }`}
                                >
                                    {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />}
                                </motion.div>
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${isComplete ? 'text-brand-secondary' : 'text-brand-secondary/20'
                                    }`}>
                                    {stepLabels[i]}
                                </span>
                            </div>

                            {i < steps.length - 1 && (
                                <div className="flex-1 h-0.5 max-w-[40px] rounded-full -mt-5">
                                    <div className="w-full h-full bg-brand-secondary/5 rounded-full relative overflow-hidden">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                width: i < currentStep ? '100%' : '0%',
                                            }}
                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                            className="h-full bg-brand-secondary"
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </motion.div>
    );
};
