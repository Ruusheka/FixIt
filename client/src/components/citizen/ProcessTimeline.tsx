import React from 'react';
import { motion } from 'framer-motion';
import {
    Camera, Brain, ClipboardCheck, Wrench, CheckCircle, ShieldCheck
} from 'lucide-react';

const processSteps = [
    {
        icon: <Camera className="w-6 h-6" />,
        title: 'You Report',
        description: 'Snap a photo, share GPS — done in seconds.',
        color: 'from-brand-secondary/40 to-brand-secondary/60',
        glow: 'shadow-brand-secondary/10',
    },
    {
        icon: <Brain className="w-6 h-6" />,
        title: 'AI Categorizes',
        description: 'Our AI identifies the issue type and severity instantly.',
        color: 'from-brand-secondary/50 to-brand-secondary/70',
        glow: 'shadow-brand-secondary/10',
    },
    {
        icon: <ClipboardCheck className="w-6 h-6" />,
        title: 'Admin Reviews',
        description: 'City admins verify and prioritize the report.',
        color: 'from-brand-secondary/60 to-brand-secondary/80',
        glow: 'shadow-brand-secondary/10',
    },
    {
        icon: <Wrench className="w-6 h-6" />,
        title: 'Worker Assigned',
        description: 'A field worker is dispatched to fix the issue.',
        color: 'from-brand-secondary/70 to-brand-secondary/90',
        glow: 'shadow-brand-secondary/10',
    },
    {
        icon: <CheckCircle className="w-6 h-6" />,
        title: 'Issue Fixed',
        description: 'The worker resolves the problem on-site.',
        color: 'from-brand-secondary/80 to-brand-secondary/100',
        glow: 'shadow-brand-secondary/10',
    },
    {
        icon: <ShieldCheck className="w-6 h-6" />,
        title: 'You Verify',
        description: 'Confirm the fix and earn civic points!',
        color: 'from-brand-secondary/90 to-brand-secondary/100',
        glow: 'shadow-brand-secondary/20',
    },
];

export const ProcessTimeline: React.FC = () => (
    <section className="px-6 md:px-12 lg:px-20 py-24 border-t border-brand-secondary/5">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
        >
            <h2 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-4">Operational Lifecycle</h2>
            <p className="text-brand-secondary/40 text-[10px] font-black uppercase tracking-[0.3em] max-w-xl mx-auto">
                A transparent, closed-loop system ensuring every report leads to real action.
            </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {processSteps.map((step, i) => (
                <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5 }}
                    className="minimal-card p-6 text-center relative group"
                >
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-primary border border-brand-secondary/10 flex items-center justify-center text-[10px] font-black text-brand-secondary shadow-lg">
                        0{i + 1}
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-brand-primary shadow-xl ${step.glow}`}>
                        {step.icon}
                    </div>

                    <h4 className="font-black text-brand-secondary text-xs uppercase tracking-widest mb-2">{step.title}</h4>
                    <p className="text-[10px] font-bold text-brand-secondary/40 leading-relaxed uppercase tracking-tight">{step.description}</p>
                </motion.div>
            ))}
        </div>
    </section>
);
