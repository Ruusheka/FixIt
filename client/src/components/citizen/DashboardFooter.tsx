import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Globe, Clock, FileText, Bell, Target, Award, Github, Twitter, Linkedin } from 'lucide-react';

export const DashboardFooter: React.FC = () => {
    return (
        <footer className="pt-24 pb-12 mt-24 border-t border-brand-secondary/5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                {/* Branding */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">FixIt</h2>
                        <span className="text-[10px] block font-bold tracking-[0.3em] opacity-30 -mt-1 ml-0.5 uppercase text-brand-secondary">Systems</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/30 leading-relaxed max-w-xs">
                        Intelligent civic infrastructure optimization network. Empowing citizens to shape the future of urban safety.
                    </p>
                    <div className="flex gap-4">
                        <Github size={18} className="text-brand-secondary/20 hover:text-brand-secondary transition-colors cursor-pointer" />
                        <Twitter size={18} className="text-brand-secondary/20 hover:text-brand-secondary transition-colors cursor-pointer" />
                        <Linkedin size={18} className="text-brand-secondary/20 hover:text-brand-secondary transition-colors cursor-pointer" />
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary">Operations</h4>
                    <ul className="space-y-3">
                        {['Dashboard', 'Report Issue', 'My Reports', 'Announcements'].map(link => (
                            <li key={link}>
                                <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors transition-all hover:translate-x-1 block underline-offset-4 hover:underline decoration-brand-secondary/20">
                                    {link}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Intelligence */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary">Network Status</h4>
                    <ul className="space-y-3">
                        {['View Live Map', 'Network Rewards', 'Micro Tasks', 'Legal Protocol'].map(link => (
                            <li key={link}>
                                <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors transition-all hover:translate-x-1 block underline-offset-4 hover:underline decoration-brand-secondary/20">
                                    {link}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Support */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary">Command Support</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail size={14} className="text-brand-secondary/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">support@fixit.city</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe size={14} className="text-brand-secondary/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">Chennai Command Center</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-brand-secondary/5">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-brand-secondary uppercase tracking-tighter">See it. Report it. FixIt.</span>
                    <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full opacity-20" />
                    <span className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-[0.3em]">Operational Readiness</span>
                </div>
                <div className="flex gap-8">
                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/20 hover:text-brand-secondary transition-colors cursor-pointer">Privacy Policy</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/20 hover:text-brand-secondary transition-colors cursor-pointer">Terms of Service</p>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">© {new Date().getFullYear()} FixIt Systems. All Rights Reserved.</p>
            </div>
        </footer>
    );
};
