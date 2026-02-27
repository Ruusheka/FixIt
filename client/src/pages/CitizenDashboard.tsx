import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    FileText,
    Globe,
    Shield,
    ArrowRight,
    LayoutDashboard as PlanetIcon,
    Bell as BellIcon,
    Target as TargetIcon,
    Award as AwardIcon
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';

// New Landing Page Components
import { DashboardStats } from '../components/citizen/DashboardStats';
import { CityHeatmap } from '../components/citizen/CityHeatmap';
import { RecentIssues } from '../components/citizen/RecentIssues';
import { TestimonialSection } from '../components/citizen/TestimonialSection';
import { ContactAdmin } from '../components/citizen/ContactAdmin';
import { HowItWorks } from '../components/citizen/HowItWorks';
import { DashboardFooter } from '../components/citizen/DashboardFooter';

const navItems = [
    { label: 'Dashboard', path: '/citizen', icon: PlanetIcon },
    { label: 'Reports Hub', path: '/reports', icon: Globe },
    { label: 'My Report', path: '/citizen/reports', icon: FileText },
    { label: 'Announcement', path: '/citizen/announcements', icon: BellIcon },
    { label: 'Micro Task', path: '/citizen/micro-tasks', icon: TargetIcon },
    { label: 'Rewards', path: '/citizen/profile#rewards', icon: AwardIcon },
];

export const CitizenDashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <MinimalLayout
            navItems={navItems}
            title="Operational Command"
        >
            <div className="space-y-32">
                {/* 1. HERO SECTION */}
                <section className="relative rounded-[40px] overflow-hidden min-h-[600px] flex items-center shadow-3xl shadow-brand-secondary/10">
                    {/* Background with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=2000"
                            alt="City Infrastructure"
                            className="w-full h-full object-cover grayscale opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary via-brand-primary/95 to-transparent shadow-inset" />
                    </div>

                    <div className="relative z-10 px-12 lg:px-20 max-w-4xl space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-secondary/40">FixIt Systems Architecture</span>
                            <h1 className="text-5xl lg:text-6xl font-black text-brand-secondary tracking-tighter uppercase leading-[0.9]">
                                See it.<br />Report it.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-secondary/40">FixIt.</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-brand-secondary/60 font-medium max-w-xl leading-relaxed uppercase tracking-tight"
                        >
                            A smart civic reporting platform that allows citizens to report public issues, track progress, and help improve the city with AI-assisted prioritization.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap gap-4"
                        >
                            <button
                                onClick={() => navigate('/citizen/report')}
                                className="px-10 py-5 bg-brand-secondary text-brand-primary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                            >
                                <Plus size={18} /> Report New Issue
                            </button>
                            <button
                                onClick={() => navigate('/citizen/reports')}
                                className="px-10 py-5 bg-white border border-brand-secondary/10 text-brand-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-secondary/5 transition-all flex items-center gap-3"
                            >
                                <FileText size={18} /> My Reports
                            </button>
                            <button
                                onClick={() => navigate('/reports')}
                                className="px-10 py-5 bg-white border border-brand-secondary/10 text-brand-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-secondary/5 transition-all flex items-center gap-3"
                            >
                                <Globe size={18} /> View Issue Map
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* 2. ABOUT PLATFORM SECTION */}
                <section className="px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-secondary/5 rounded-full">
                                <Shield size={16} className="text-brand-secondary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Platform Intelligence</span>
                            </div>
                            <h2 className="text-5xl font-black text-brand-secondary uppercase tracking-tighter leading-none">
                                What is FixIt Systems?
                            </h2>
                            <p className="text-lg text-brand-secondary/60 leading-relaxed font-medium">
                                FixIt Systems empowers citizens to report civic issues such as potholes, garbage dumps, damaged infrastructure, and safety hazards.
                                <br /><br />
                                Using AI-powered risk detection, the platform helps administrators prioritize urgent problems and deploy workers efficiently.
                                Every report is tracked from submission to resolution, ensuring transparency and accountability.
                            </p>
                            <div className="pt-8 flex gap-8 border-t border-brand-secondary/5">
                                <div>
                                    <p className="text-2xl font-black text-brand-secondary tracking-tighter uppercase">Predictive</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">Risk Analysis</p>
                                </div>
                                <div className="w-px h-12 bg-brand-secondary/5" />
                                <div>
                                    <p className="text-2xl font-black text-brand-secondary tracking-tighter uppercase">Distributed</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">Worker Fleet</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="aspect-square bg-brand-secondary/[0.02] rounded-[60px] border border-brand-secondary/5 relative overflow-hidden shadow-2xl shadow-brand-secondary/10">
                                <CityHeatmap />
                            </div>

                            {/* Floating HUD Element */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-4 -left-4 px-4 py-2 bg-white border border-brand-secondary/5 shadow-xl rounded-2xl z-20"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary">Live Network Intel</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 3. IMPACT STATS SECTION */}
                <section className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter">Real-time Impact Metrics</h2>
                        <div className="h-1 w-20 bg-brand-secondary mx-auto rounded-full" />
                    </div>
                    <DashboardStats />
                </section>

                {/* 4. TOP 3 RECENTLY REPORTED ISSUES */}
                <section className="space-y-12">
                    <div className="flex items-center justify-between border-b border-brand-secondary/5 pb-12">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter leading-none">Tactical Feed</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Latest operational anomalies detected in the sectors</p>
                        </div>
                        <button onClick={() => navigate('/reports')} className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary hover:translate-x-1 transition-all">
                            Browse All Reports <ArrowRight size={14} />
                        </button>
                    </div>
                    <RecentIssues />
                </section>

                {/* 5. HOW FIXIT WORKS SECTION */}
                <section className="py-24 bg-brand-secondary/[0.02] rounded-[60px] border border-brand-secondary/5 px-8 md:px-20 space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-5xl font-black text-brand-secondary uppercase tracking-tighter leading-none">How FixIt Works</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">End-to-end mission lifecycle and resolution protocol</p>
                    </div>
                    <HowItWorks />
                </section>

                {/* 6. TESTIMONIALS SECTION */}
                <section className="space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter">Civic Validation</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Testimonials from the Citizen Intelligence Network</p>
                    </div>
                    <TestimonialSection />
                </section>

                {/* 7. CONTACT ADMIN SECTION */}
                <section id="contact-admin">
                    <ContactAdmin />
                </section>

                {/* 8. FOOTER SECTION */}
                <DashboardFooter />
            </div>
        </MinimalLayout>
    );
};
