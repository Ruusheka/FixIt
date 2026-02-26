import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Upload, CheckCircle2, ArrowLeft,
    X, ShieldAlert, Sparkles, MapPin, Zap
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export const ReportIssue: React.FC = () => {
    const { user } = useAuth();
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('5');
    const [description, setDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleImageChange = async (file: File) => {
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setAiError(null);
            setIsAnalyzing(true);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/validate`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    setAiError(data.message || 'Image verification failed.');
                    setImage(null);
                    setPreview(null);
                } else {
                    setCategory(data.verified_category);
                    setSeverity(data.severity.toString());
                    setDescription(data.description);
                }
            } catch (err) {
                console.error('AI Verification Error:', err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageChange(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageChange(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!image) return;

            const formData = new FormData();
            formData.append('image', image);
            formData.append('category', category);
            formData.append('severity', severity);
            formData.append('description', description);
            formData.append('title', category.charAt(0).toUpperCase() + category.slice(1) + ' Incident');

            // Get location
            navigator.geolocation.getCurrentPosition(async (position) => {
                formData.append('latitude', position.coords.latitude.toString());
                formData.append('longitude', position.coords.longitude.toString());
                formData.append('address', 'Localized Tactical Origin');

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) setSubmitted(true);
                setLoading(false);
            }, async () => {
                // Fallback location
                formData.append('latitude', '28.6139');
                formData.append('longitude', '77.2090');
                formData.append('address', 'Fixed Tactical Origin');

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) setSubmitted(true);
                setLoading(false);
            });

        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const clearImage = () => {
        setImage(null);
        setPreview(null);
        setAiError(null);
        setIsAnalyzing(false);
    };

    if (submitted) {
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
                    <h2 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter mb-4">Report Logged</h2>
                    <p className="text-brand-secondary/40 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                        Data packet received and currently being processed by the AI Dispatcher.
                    </p>
                    <button
                        onClick={() => navigate('/citizen')}
                        className="mt-10 w-full btn-primary py-4 text-xs font-black uppercase tracking-widest"
                    >
                        Return to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-primary p-6 md:p-12 lg:p-20">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Go Back
                </motion.button>

                <div className="text-right">
                    <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-1">Tactical Ingress</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Issue Data Submission Node</p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left: Metadata & Guide */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="minimal-card p-8 bg-brand-secondary text-brand-primary shadow-2xl shadow-brand-secondary/20">
                        <ShieldAlert className="w-8 h-8 mb-6 opacity-40 text-brand-primary" />
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Submission Protocol</h3>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed mb-8">
                            Ensure all imagery is high-contrast and clear. Position the camera at a 45° angle to the incident for optimal AI depth analysis.
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Clear photographic evidence',
                                'Active GPS lock enabled',
                                'Precise incident description'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="minimal-card p-8 border-dashed border-brand-secondary/10 flex items-center gap-4">
                        <Sparkles className="w-5 h-5 text-brand-secondary/20 shrink-0" />
                        <p className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest leading-relaxed">
                            AI-Engine will automatically categorize your submission.
                        </p>
                    </div>
                </div>

                {/* Right: Capture form */}
                <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Dropzone / Preview */}
                        <motion.div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => !preview && !isAnalyzing && fileInputRef.current?.click()}
                            className={`relative minimal-card aspect-video flex flex-col items-center justify-center p-2 overflow-hidden transition-all duration-300 ${dragActive ? 'border-brand-secondary bg-brand-secondary/5 scale-[0.99]' : 'border-brand-secondary/10'
                                } ${!preview && !isAnalyzing && 'cursor-pointer hover:border-brand-secondary/30'}`}
                        >
                            <AnimatePresence mode="wait">
                                {isAnalyzing ? (
                                    <motion.div
                                        key="analyzing"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center gap-4"
                                    >
                                        <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary animate-pulse">Verifying Intelligence...</div>
                                    </motion.div>
                                ) : preview ? (
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative w-full h-full rounded-xl overflow-hidden"
                                    >
                                        <img src={preview} alt="Capture" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-brand-secondary/10" />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-4 right-4 p-2 bg-brand-primary/80 backdrop-blur-md rounded-full text-brand-secondary hover:bg-brand-primary transition-all shadow-xl"
                                        >
                                            <X size={20} />
                                        </button>
                                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-brand-primary/80 backdrop-blur-md rounded-lg border border-brand-secondary/5">
                                            <Sparkles size={12} className="text-brand-secondary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">AI Validated</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="upload"
                                        className="text-center p-8"
                                    >
                                        <div className="w-16 h-16 rounded-3xl bg-brand-secondary/5 border border-brand-secondary/5 flex items-center justify-center mx-auto mb-6">
                                            <Camera className="w-8 h-8 text-brand-secondary opacity-40" />
                                        </div>
                                        <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest mb-2">Initialize Capture</h4>
                                        <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Tap for camera or drag image here</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                        </motion.div>

                        {/* AI Error Message */}
                        <AnimatePresence>
                            {aiError && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
                                >
                                    <ShieldAlert className="text-red-500 shrink-0 mt-1" size={18} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Intelligence Denial</div>
                                        <div className="text-[10px] font-bold text-red-500/60 uppercase tracking-tight leading-relaxed">{aiError}</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Text Fields */}
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="ISSUE DESIGNATOR (E.G. POTHOLE)"
                                className="input-field py-4 bg-transparent border-brand-secondary/10 text-[10px] font-black uppercase tracking-widest"
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="CONTEXTUAL DATA POINTS..."
                                className="input-field py-4 bg-transparent border-brand-secondary/10 min-h-[120px] resize-none text-[10px] font-black uppercase tracking-widest"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!image || loading || isAnalyzing}
                            className="w-full btn-primary py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-brand-secondary/20 flex items-center justify-center gap-4 group"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Zap size={18} />
                                    {isAnalyzing ? 'Processing Intelligence...' : 'Transmit Data Packet'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};
