import React from 'react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Shield, ShieldAlert, FileText, Settings, Key, Camera } from 'lucide-react';

export const WorkerProfile: React.FC = () => {
    const { profile } = useAuth();

    return (
        <WorkerLayout title="Operative Profile">
            <div className="max-w-4xl mx-auto py-8">
                <div className="bg-brand-secondary rounded-[40px] p-8 md:p-12 mb-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 text-white">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="w-32 h-32 rounded-[24px] bg-brand-primary flex flex-col items-center justify-center text-brand-secondary font-black shadow-lg border-4 border-white/10 shrink-0 overflow-hidden relative group">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                            <span className="text-4xl">{profile?.full_name?.[0] || 'O'}</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera size={24} className="text-white" />
                        </div>
                    </div>

                    <div className="text-center md:text-left z-10">
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{profile?.full_name || 'Operative'}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert size={12} /> OP Clearance: LEVEL 2
                            </span>
                            <span className="px-4 py-1.5 bg-white/10 rounded-full font-black text-[10px] uppercase tracking-widest">
                                UNIT: FIELD OPS
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ID & Comm Data */}
                    <div className="bg-white rounded-[32px] p-8 border border-brand-secondary/5 shadow-soft">
                        <h3 className="font-black text-brand-secondary uppercase tracking-tight border-b-2 border-brand-secondary/10 pb-4 mb-6">Operative Identification</h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Full Legal Name</p>
                                    <p className="font-bold text-brand-secondary">{profile?.full_name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Registered Comm Link</p>
                                    <p className="font-bold text-brand-secondary">{profile?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WorkerLayout>
    );
};


