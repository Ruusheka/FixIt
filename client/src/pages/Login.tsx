import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RoleSelector } from '../components/RoleSelector';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<'citizen' | 'worker' | 'admin'>('citizen');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, profile } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            // Profile is fetched in AuthProvider after session update
            // We'll need a way to check it here or let App.tsx handle it with a redirect
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    // Handle role routing and verification
    React.useEffect(() => {
        if (profile) {
            if (profile.role !== selectedRole) {
                setError(`Unauthorized: Your account does not have ${selectedRole} privileges.`);
                setLoading(false);
            } else {
                // Route based on role
                const routes = {
                    citizen: '/citizen',
                    worker: '/worker',
                    admin: '/admin'
                };
                navigate(routes[profile.role]);
            }
        }
    }, [profile, selectedRole, navigate]);

    return (
        <div className="min-h-screen flex bg-brand-primary overflow-hidden">
            {/* Left Side: Image Background */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-brand-primary flex-col items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/src/assets/image.png"
                        alt="Civic Background"
                        className="w-full h-full object-cover opacity-40 mix-blend-multiply grayscale"
                    />
                    <div className="absolute inset-0 bg-brand-primary/60 backdrop-blur-[2px]" />
                </div>

                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0],
                        }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="w-[200%] h-[200%] -top-1/2 -left-1/2"
                        style={{ background: 'radial-gradient(circle at center, #540023 0%, transparent 60%)' }}
                    />
                </div>

                <div className="relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1 className="text-[10rem] font-black text-brand-secondary mb-2 tracking-[-0.08em] leading-none uppercase">
                            FixIt
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-brand-secondary/20" />
                            <p className="text-sm text-brand-secondary font-black uppercase tracking-[0.5em] opacity-40">
                                Tactical Ingress Node
                            </p>
                            <div className="h-px w-12 bg-brand-secondary/20" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Login Card */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white/30 backdrop-blur-sm lg:bg-transparent">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-md w-full"
                >
                    <div className="minimal-card p-10 bg-white shadow-2xl">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-brand-secondary mb-2">Sign In</h2>
                            <p className="text-brand-secondary/40 text-sm">Access your workspace</p>
                        </div>

                        <RoleSelector
                            selectedRole={selectedRole}
                            onRoleSelect={setSelectedRole}
                        />

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-brand-secondary/5 border border-brand-secondary/10 p-4 rounded-xl flex items-start gap-3 mb-6"
                            >
                                <AlertCircle className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                                <p className="text-sm text-brand-secondary font-medium">{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-brand-secondary/40 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-brand-secondary/40 ml-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden btn-primary py-4 text-lg shadow-lg shadow-brand-secondary/20 hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                <span className="relative z-10">
                                    {loading ? 'Authenticating...' : 'Login'}
                                </span>
                                {loading && (
                                    <motion.div
                                        layoutId="buttonRipple"
                                        className="absolute inset-0 bg-white/10"
                                        animate={{ x: ['100%', '-100%'] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    />
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-brand-secondary/50 text-sm">
                                New to FixIt?{' '}
                                <Link to="/signup" className="text-brand-secondary font-bold hover:underline">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
