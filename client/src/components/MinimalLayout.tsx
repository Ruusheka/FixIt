import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    MessageSquare,
    UserCircle
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        } finally {
            window.location.href = '/login';
        }
    };

    // Close sidebar on mobile when navigating
    const handleNavigate = (path: string) => {
        navigate(path);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-brand-primary text-brand-secondary">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && window.innerWidth < 1024 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-brand-secondary/40 backdrop-blur-sm z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 280 : (window.innerWidth < 1024 ? 0 : 80),
                    x: isSidebarOpen || window.innerWidth >= 1024 ? 0 : -280
                }}
                className={`fixed lg:sticky top-0 h-screen bg-brand-secondary/5 border-r border-brand-secondary/10 flex flex-col z-40 shrink-0 overflow-hidden bg-brand-primary lg:bg-transparent`}
            >
                <div className={`p-6 flex items-center justify-between ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'}`}>
                    <AnimatePresence mode="wait">
                        {(isSidebarOpen || window.innerWidth < 1024) && (
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
                        className="p-1.5 rounded-lg hover:bg-brand-secondary/10 transition-colors lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className={`flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'}`}>
                    {navItems.map((item) => {
                        const isActive = (location.pathname + location.hash) === item.path ||
                            (location.pathname === item.path && !location.hash);
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group ${isActive
                                    ? 'bg-brand-secondary text-brand-primary shadow-soft'
                                    : 'text-brand-secondary/60 hover:bg-brand-secondary/5 hover:text-brand-secondary'
                                    }`}
                            >
                                <item.icon size={22} className="flex-shrink-0" />
                                <span className={`font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0 w-0 overflow-hidden'}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className={`p-4 border-t border-brand-secondary/10 ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'}`}>
                    <div className={`flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/50 border border-brand-secondary/5 mb-4`}>
                        <div className="w-10 h-10 rounded-full bg-brand-secondary text-brand-primary flex items-center justify-center font-bold shrink-0 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.[0] || 'U'
                            )}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            <p className="font-black text-xs uppercase tracking-tight truncate">{profile?.full_name || 'User'}</p>
                            <p className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest">{profile?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-brand-secondary/60 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer relative z-50 group`}
                    >
                        <LogOut size={22} className="shrink-0 group-hover:scale-110 transition-transform" />
                        {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest truncate">Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                <header className="px-4 md:px-8 py-4 md:py-6 border-b border-brand-secondary/5 flex items-center justify-between bg-brand-primary/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg hover:bg-brand-secondary/5 transition-colors lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="h-8 md:h-10 w-1 bg-brand-secondary rounded-full opacity-20 hidden sm:block" />
                        <div>
                            <h2 className="text-xl md:text-3xl font-black tracking-tighter text-brand-secondary uppercase line-clamp-1">{title}</h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-brand-secondary/40 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-0.5 line-clamp-1">FixIt Intelligent Node</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden lg:block text-right">
                            <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] leading-none mb-1">Authenticated {profile?.role}</p>
                            <p className="text-sm font-black text-brand-secondary uppercase tracking-tighter">Hello, {profile?.full_name?.split(' ')[0] || 'User'}</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                const role = profile?.role;
                                if (role === 'worker') navigate('/worker/profile');
                                else if (role === 'admin') navigate('/admin/profile');
                                else navigate('/citizen/profile');
                            }}
                            className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-2 border-brand-secondary/10 shadow-soft"
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-brand-secondary text-brand-primary flex items-center justify-center font-black text-lg md:text-xl">
                                    {profile?.full_name?.[0] || 'U'}
                                </div>
                            )}
                        </motion.button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
