import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface ProofModalProps {
    reportId: string;
    onSuccess: () => void;
    onClose: () => void;
}

export const ProofUploadModal: React.FC<ProofModalProps> = ({ reportId, onSuccess, onClose }) => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return;

        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const formData = new FormData();
            formData.append('image', image);
            formData.append('description', description);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/${reportId}/proof`, {
                method: 'POST',
                headers: {
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit proof');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 pointer-events-none">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-md pointer-events-auto"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto"
            >
                <div className="p-8 border-b border-brand-secondary/5 flex justify-between items-center bg-brand-primary/5">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-brand-secondary">Submit Resolution Proof</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 mt-1">Official Verification Protocol</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-secondary/5 rounded-full transition-all">
                        <X size={20} className="text-brand-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Image Preview / Upload */}
                    <div
                        onClick={() => !preview && fileInputRef.current?.click()}
                        className={`aspect-video rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all relative ${preview ? 'border-transparent' : 'border-brand-secondary/10 hover:border-brand-secondary/30 cursor-pointer'
                            }`}
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Proof" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-brand-secondary/20" />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }}
                                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-brand-secondary shadow-lg"
                                >
                                    <X size={16} />
                                </button>
                                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-lg">
                                    <CheckCircle2 size={12} className="text-brand-secondary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Intelligence Captured</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-brand-secondary/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand-secondary/10">
                                    <Camera size={24} className="text-brand-secondary/40" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">Capture Visual Evidence</p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-secondary/30 mt-1">Tap to Open Camera</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div className="space-y-4">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="COMPLETION NOTES (OPTIONAL)..."
                            className="w-full p-6 bg-brand-primary/5 border border-brand-secondary/5 rounded-3xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand-secondary/10 outline-none min-h-[100px] resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                            <p className="text-[10px] font-bold uppercase text-red-600 tracking-tight">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!image || loading}
                        className="w-full btn-primary py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-brand-secondary/20 flex items-center justify-center gap-4 group disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                        ) : (
                            <>
                                <Upload size={18} />
                                TRANSMIT PROOF & LOCK
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
