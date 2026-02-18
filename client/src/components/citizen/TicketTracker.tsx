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
            className="glass-card p-4 space-y-4"
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-civic-card">
                    {ticket.image_url ? (
                        <img src={ticket.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-civic-orange/20 to-civic-blue/20" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-civic-orange font-mono text-xs font-bold">{ticket.ticket_id}</span>
                        <span className="text-civic-muted text-xs">{getTimeAgo(ticket.created_at)}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-white capitalize mt-0.5">{ticket.category}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-civic-muted">
                        {ticket.assigned_worker && (
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {ticket.assigned_worker}
                            </span>
                        )}
                        {sla && (
                            <span className={`flex items-center gap-1 ${sla === 'Overdue' ? 'text-red-400' : 'text-civic-muted'}`}>
                                <Clock className="w-3 h-3" />
                                {sla}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Stepper */}
            <div className="flex items-center gap-1">
                {steps.map((step, i) => {
                    const isComplete = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                        <React.Fragment key={step}>
                            {/* Step dot */}
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.2 : 1,
                                        backgroundColor: isComplete ? '#f97316' : '#1e293b',
                                    }}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${isComplete ? 'border-civic-orange' : 'border-civic-border'
                                        }`}
                                >
                                    {isComplete && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </motion.div>
                                <span className={`text-[9px] mt-1 text-center leading-tight ${isComplete ? 'text-civic-orange' : 'text-civic-muted/50'
                                    }`}>
                                    {stepLabels[i]}
                                </span>
                            </div>

                            {/* Connector line */}
                            {i < steps.length - 1 && (
                                <div className="flex-1 h-0.5 rounded-full mb-4">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            width: i < currentStep ? '100%' : '0%',
                                        }}
                                        transition={{ duration: 0.5 }}
                                        className="h-full bg-civic-orange rounded-full"
                                        style={{ width: i < currentStep ? '100%' : '0%' }}
                                    />
                                    <div className="h-full bg-civic-border rounded-full -mt-0.5" />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </motion.div>
    );
};
