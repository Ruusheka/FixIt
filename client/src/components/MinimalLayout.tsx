import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    UserCircle,
    LogOut,
    Menu,
    X,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

interface MinimalLayoutProps {
    children: React.ReactNode;
    navItems: NavItem[];
    title: string;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children, navItems, title }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-brand-primary text-brand-secondary">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="h-screen sticky top-0 bg-brand-secondary/5 border-r border-brand-secondary/10 flex flex-col z-20 shrink-0"
            >
                <div className="p-6 flex items-center justify-between">
                    <AnimatePresence mode="wait">
                        {isSidebarOpen && (
                            <motion.h1
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-2xl font-black tracking-tighter text-brand-secondary uppercase"
                            >
                                FixIt
                                <span className="text-[10px] block font-bold tracking-[0.3em] opacity-30 -mt-1 ml-0.5">Systems</span>
                            </motion.h1>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-brand-secondary/10 transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = (location.pathname + location.hash) === item.path ||
                            (location.pathname === item.path && !location.hash);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group ${isActive
                                    ? 'bg-brand-secondary text-brand-primary shadow-soft'
                                    : 'text-brand-secondary/60 hover:bg-brand-secondary/5 hover:text-brand-secondary'
                                    }`}
                            >
                                <item.icon size={22} className="flex-shrink-0" />
                                <AnimatePresence>
                                    {isSidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="font-bold text-xs uppercase tracking-widest whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && isSidebarOpen && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-brand-secondary/10">
                    <div className={`flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/50 border border-brand-secondary/5 mb-4 ${!isSidebarOpen && 'justify-center p-2'}`}>
                        <div className="w-10 h-10 rounded-full bg-brand-secondary text-brand-primary flex items-center justify-center font-bold shrink-0">
                            {profile?.full_name?.[0] || 'U'}
                        </div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="font-black text-xs uppercase tracking-tight truncate">{profile?.full_name || 'User'}</p>
                                <p className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest">{profile?.role}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSignOut}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-brand-secondary/60 hover:bg-brand-secondary/5 hover:text-brand-secondary transition-all ${!isSidebarOpen && 'justify-center'
                            }`}
                    >
                        <LogOut size={22} />
                        {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 min-h-screen">
                <header className="px-8 py-6 border-b border-brand-secondary/5 flex items-center justify-between bg-brand-primary/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-1 bg-brand-secondary rounded-full opacity-20" />
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-brand-secondary uppercase">{title}</h2>
                            <p className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-[0.3em] mt-0.5">FixIt Command & Intelligence Node</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-secondary text-brand-primary rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <UserCircle size={16} />
                        {isSidebarOpen && <span>Profile</span>}
                    </motion.button>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
