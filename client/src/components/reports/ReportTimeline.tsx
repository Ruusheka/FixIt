import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, User, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineUpdate {
    id: string;
    created_at: string;
    update_text: string;
    status_after_update: string;
    updated_by_profile?: { full_name: string };
}

interface ReportTimelineProps {
    updates: TimelineUpdate[];
}

export const ReportTimeline: React.FC<ReportTimelineProps> = ({ updates }) => {
    return (
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-secondary/5 before:via-brand-secondary/20 before:to-transparent">
            {updates.map((update, i) => (
                <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                >
                    {/* Icon Container */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-brand-secondary/20 bg-brand-primary z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl shadow-brand-secondary/5">
                        {update.status_after_update === 'resolved' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <Circle className="w-4 h-4 text-brand-secondary/40 fill-brand-secondary/5" />
                        )}
                    </div>

                    {/* Content Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] minimal-card p-6 border-brand-secondary/5 group-hover:border-brand-secondary/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/5 flex items-center justify-center">
                                    <User size={12} className="text-brand-secondary/40" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">
                                    {update.updated_by_profile?.full_name || 'System Operator'}
                                </span>
                            </div>
                            <time className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">
                                {format(new Date(update.created_at), 'MMM dd, HH:mm')}
                            </time>
                        </div>
                        <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-tight leading-relaxed">
                            {update.update_text}
                        </p>
                        {update.status_after_update && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/5 border border-brand-secondary/5 text-[8px] font-black uppercase tracking-[0.2em] text-brand-secondary/60">
                                <Clock size={10} />
                                Status: {update.status_after_update.replace('_', ' ')}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
