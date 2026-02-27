import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Brain, ClipboardCheck, UserPlus, CheckCircle } from 'lucide-react';

const Step = ({ icon: Icon, title, description, step, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="relative flex flex-col items-center text-center space-y-4"
    >
        <div className="w-16 h-16 rounded-2xl bg-brand-secondary/5 flex items-center justify-center text-brand-secondary relative z-10 border border-brand-secondary/5 shadow-xl">
            <Icon size={28} />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-secondary text-brand-primary text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg">
                {step}
            </div>
        </div>
        <div>
            <h4 className="text-sm font-black text-brand-secondary uppercase tracking-tighter mb-1">{title}</h4>
            <p className="text-[10px] text-brand-secondary/40 font-medium uppercase tracking-widest max-w-[150px] leading-relaxed">
                {description}
            </p>
        </div>
    </motion.div>
);

export const HowItWorks: React.FC = () => {
    return (
        <div className="relative py-12">
            {/* Connection Line */}
            <div className="absolute top-20 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-brand-secondary/5 to-transparent hidden lg:block" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 relative z-10">
                <Step
                    step="1"
                    icon={Camera}
                    title="Capture"
                    description="Upload a high-fidelity image of the civic issue"
                    delay={0}
                />
                <Step
                    step="2"
                    icon={Brain}
                    title="Intelligence"
                    description="AI infrastructure analyzes risk and priority"
                    delay={0.1}
                />
                <Step
                    step="3"
                    icon={ClipboardCheck}
                    title="Validation"
                    description="City administrators verify and confirm intel"
                    delay={0.2}
                />
                <Step
                    step="4"
                    icon={UserPlus}
                    title="Deployment"
                    description="Tactical units are assigned to resolve mission"
                    delay={0.3}
                />
                <Step
                    step="5"
                    icon={CheckCircle}
                    title="Resolution"
                    description="Citizen confirms successful mission closure"
                    delay={0.4}
                />
            </div>
        </div>
    );
};
