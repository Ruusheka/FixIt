import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AnnouncementPanel } from '../components/citizen/AnnouncementPanel';

export const AnnouncementsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-brand-primary p-6 md:p-12 lg:p-20">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/citizen')}
                    className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
                <div className="space-y-12">
                    <div>
                        <h3 className="text-4xl font-black tracking-tighter text-brand-secondary uppercase">Announcements & Alerts</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-2">Stay updated with civic notifications</p>
                    </div>
                    <AnnouncementPanel />
                </div>
            </div>
        </div>
    );
};
