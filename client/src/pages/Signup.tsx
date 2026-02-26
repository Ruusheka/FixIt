import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signUp(email, password, fullName);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-primary p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full minimal-card p-12 text-center"
                >
                    <div className="w-20 h-20 bg-brand-secondary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-brand-secondary" />
                    </div>
                    <h2 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter mb-4">Registration Complete</h2>
                    <p className="text-brand-secondary/40 font-bold uppercase tracking-widest text-[10px]">Your tactical ingress node is being provisioned...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-brand-primary overflow-hidden">
            {/* Left Side: Branded Background (Matches Login) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-brand-primary flex-col items-center justify-center p-12 overflow-hidden border-r border-brand-secondary/5">
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
                            rotate: [0, -5, 0],
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
                                Global Resource Grid
                            </p>
                            <div className="h-px w-12 bg-brand-secondary/20" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-brand-primary/50 backdrop-blur-sm lg:bg-transparent">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-md w-full"
                >
                    <div className="minimal-card p-10 bg-white">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter mb-2">Create Identity</h2>
                            <p className="text-brand-secondary/40 text-[10px] font-black uppercase tracking-widest">Register on the Civic Intelligence Network</p>
                        </div>

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
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 ml-1">
                                    Operator Name
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        placeholder="Full Name"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 ml-1">
                                    Secure Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="operator@fixit.sys"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 ml-1">
                                    Access Credential
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-secondary/20 hover:shadow-2xl transition-all disabled:opacity-50"
                            >
                                {loading ? 'Provisioning...' : 'Initialize Account'}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-brand-secondary/40 text-[10px] font-bold uppercase tracking-widest">
                                Already Registered?{' '}
                                <Link to="/login" className="text-brand-secondary hover:underline font-black outline-none">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
