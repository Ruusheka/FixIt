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
        color: 'from-orange-500 to-red-500',
        glow: 'shadow-orange-500/20',
    },
    {
        icon: <Brain className="w-6 h-6" />,
        title: 'AI Categorizes',
        description: 'Our AI identifies the issue type and severity instantly.',
        color: 'from-purple-500 to-pink-500',
        glow: 'shadow-purple-500/20',
    },
    {
        icon: <ClipboardCheck className="w-6 h-6" />,
        title: 'Admin Reviews',
        description: 'City admins verify and prioritize the report.',
        color: 'from-blue-500 to-cyan-500',
        glow: 'shadow-blue-500/20',
    },
    {
        icon: <Wrench className="w-6 h-6" />,
        title: 'Worker Assigned',
        description: 'A field worker is dispatched to fix the issue.',
        color: 'from-emerald-500 to-green-500',
        glow: 'shadow-emerald-500/20',
    },
    {
        icon: <CheckCircle className="w-6 h-6" />,
        title: 'Issue Fixed',
        description: 'The worker resolves the problem on-site.',
        color: 'from-green-500 to-lime-500',
        glow: 'shadow-green-500/20',
    },
    {
        icon: <ShieldCheck className="w-6 h-6" />,
        title: 'You Verify',
        description: 'Confirm the fix and earn civic points!',
        color: 'from-yellow-500 to-orange-500',
        glow: 'shadow-yellow-500/20',
    },
];

export const ProcessTimeline: React.FC = () => (
    <section className="px-6 md:px-12 lg:px-20 py-16">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
        >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">What Happens After You Report?</h2>
            <p className="text-civic-muted text-sm max-w-xl mx-auto">
                A transparent, closed-loop system ensuring every report leads to real action.
            </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {processSteps.map((step, i) => (
                <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.03 }}
                    className="glass-card p-5 text-center relative group"
                >
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-civic-dark border border-civic-border flex items-center justify-center text-[10px] font-bold text-civic-orange">
                        {i + 1}
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg ${step.glow}`}>
                        {step.icon}
                    </div>

                    <h4 className="font-semibold text-white text-sm mb-1">{step.title}</h4>
                    <p className="text-[11px] text-civic-muted leading-relaxed">{step.description}</p>

                    {/* Connector arrow (hidden on last) */}
                    {i < processSteps.length - 1 && (
                        <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-civic-border z-10">
                            →
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    </section>
);
