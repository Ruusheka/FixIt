import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, CheckCircle2, ArrowLeft,
    X, ShieldAlert, Sparkles, Zap, Tag,
    AlertTriangle, Activity, MapPin, Edit3,
    CheckCheck, Info, Clock
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { analyzeImageWithGemini, AIAnalysisResult } from '../services/gemini';
import { LocationPickerMap } from '../components/citizen/LocationPickerMap';

// Use AIAnalysisResult from gemini service instead of local interface
type AIAnalysis = AIAnalysisResult;

const CATEGORIES = [
    'Pothole', 'Garbage Dump', 'Water Leakage', 'Broken Road',
    'Fallen Tree', 'Street Light Issue', 'Drainage Blockage', 'Construction Hazard', 'Other'
];

const getRiskColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50 border-red-200', badge: 'bg-red-500 text-white' };
    if (score >= 60) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50 border-orange-200', badge: 'bg-orange-500 text-white' };
    if (score >= 30) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-500 text-white' };
    return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50 border-green-200', badge: 'bg-green-500 text-white' };
};

export const ReportIssue: React.FC = () => {
    const { user } = useAuth();
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // AI analysis result state
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [aiConfirmed, setAiConfirmed] = useState(false);

    // Editable AI fields
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [editingCategory, setEditingCategory] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [editingTags, setEditingTags] = useState(false);

    // Location state
    const [latitude, setLatitude] = useState<number>(12.9716); // Default to Bangalore
    const [longitude, setLongitude] = useState<number>(77.5946);
    const [locationCaptured, setLocationCaptured] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleImageChange = async (file: File) => {
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setAiError(null);
            setAiAnalysis(null);
            setAiConfirmed(false);
            setIsAnalyzing(true);
            setLocationCaptured(false);

            // Fetch initial GPS
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setLatitude(pos.coords.latitude);
                        setLongitude(pos.coords.longitude);
                        setLocationCaptured(true);
                    },
                    (err) => console.warn("Initial GPS failed:", err),
                    { timeout: 5000 }
                );
            }

            try {
                // 🚀 Calls Gemini DIRECTLY from the browser — no backend round trip!
                const result = await analyzeImageWithGemini(file);

                if (result.ai_failed) {
                    // Client-side failed → try backend as fallback
                    const formData = new FormData();
                    formData.append('image', file);
                    const resp = await fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues/validate`,
                        { method: 'POST', body: formData }
                    );
                    const backendData = await resp.json();
                    setAiAnalysis(backendData);
                    setCategory(backendData.category || 'Other');
                    setDescription(backendData.description || '');
                    const locTags = backendData.location_detected?.confidence > 0
                        ? [backendData.location_detected.landmark, backendData.location_detected.street].filter(Boolean) as string[]
                        : [];
                    setTags([...locTags, ...(backendData.tags || [])]);
                    if (backendData.ai_failed) {
                        setAiError('AI analysis failed. Please enter details manually.');
                    }
                } else {
                    setAiAnalysis(result);
                    setCategory(result.category);
                    setDescription(result.description);
                    const locTags = result.location_detected?.confidence > 0
                        ? [result.location_detected.landmark, result.location_detected.street].filter(Boolean) as string[]
                        : [];
                    setTags([...locTags, ...result.tags]);
                }
            } catch (err) {
                console.error('Analysis Error:', err);
                setAiError('AI analysis failed. You can still submit manually.');
                setCategory('Other');
                setAiAnalysis({
                    is_valid_civic_issue: true, category: 'Other', tags: [],
                    description: '', risk_score: 0, severity: 'Pending Review',
                    urgency: 'Normal', impact: 'Low', ai_confidence: 0, ai_failed: true,
                    location_detected: { street: '', landmark: '', city: '', confidence: 0 }
                });
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) handleImageChange(e.target.files[0]);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageChange(e.dataTransfer.files[0]);
    };

    const addTag = (t: string) => {
        const trimmed = t.trim();
        if (trimmed && !tags.includes(trimmed) && tags.length < 6) {
            setTags(prev => [...prev, trimmed]);
        }
        setTagInput('');
    };

    const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !aiConfirmed) return;
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const formData = new FormData();
            formData.append('image', image);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('title', `${category} Report`);

            // AI enrichment fields
            if (aiAnalysis) {
                formData.append('ai_category', category);
                formData.append('ai_tags', JSON.stringify(tags));
                formData.append('ai_description', description);
                formData.append('ai_risk_score', aiAnalysis.risk_score.toString());
                formData.append('ai_severity', aiAnalysis.severity);
                formData.append('ai_urgency', aiAnalysis.urgency);
                formData.append('ai_impact', aiAnalysis.impact);
                formData.append('ai_confidence', aiAnalysis.ai_confidence.toString());
                formData.append('ai_generated', aiAnalysis.ai_failed ? 'false' : 'true');
            }

            const submitReport = async (lat: string, lng: string, gpsAddr: string) => {
                let finalAddr = gpsAddr;
                if (aiAnalysis && aiAnalysis.location_detected.confidence > 0) {
                    const { street, landmark, city } = aiAnalysis.location_detected;
                    const parts = [street, landmark, city].filter(Boolean);
                    if (parts.length > 0) {
                        finalAddr = `${parts.join(', ')} (via AI)`;
                    }
                }

                formData.append('latitude', lat);
                formData.append('longitude', lng);
                formData.append('address', finalAddr);

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/issues`, {
                    method: 'POST',
                    headers: {
                        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                    },
                    body: formData
                });

                if (response.ok) {
                    setSubmitted(true);
                } else {
                    const errData = await response.json();
                    setAiError(`Submission failed: ${errData.error || 'Check server logs'}`);
                }
                setLoading(false);
            };

            // Use the pinpointed coordinates from state
            await submitReport(latitude.toString(), longitude.toString(), locationCaptured ? 'GPS Verified' : 'Manual Pinpoint');
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const clearImage = () => {
        setImage(null); setPreview(null); setAiError(null);
        setIsAnalyzing(false); setAiAnalysis(null); setAiConfirmed(false);
        setCategory(''); setDescription(''); setTags([]);
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-primary p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full minimal-card p-12 text-center">
                    <div className="w-20 h-20 bg-brand-secondary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-brand-secondary" />
                    </div>
                    <h2 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter mb-4">Report Logged</h2>
                    <p className="text-brand-secondary/40 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                        Data packet received and currently being processed by the AI Dispatcher.
                    </p>
                    {aiAnalysis && aiAnalysis.risk_score >= 80 && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                            <Zap size={14} className="text-red-600 shrink-0" />
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Auto-Escalated to Critical Response</span>
                        </div>
                    )}
                    <button onClick={() => navigate('/citizen')} className="mt-10 w-full btn-primary py-4 text-xs font-black uppercase tracking-widest">
                        Return to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    const riskColors = aiAnalysis ? getRiskColor(aiAnalysis.risk_score) : null;
    const canSubmit = image && !isAnalyzing && aiConfirmed;

    return (
        <div className="min-h-screen bg-brand-primary p-6 md:p-12 lg:p-20">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Go Back
                </motion.button>
                <div className="text-right">
                    <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-1">Tactical Ingress</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Issue Data Submission Node</p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left: Protocol info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="minimal-card p-8 bg-brand-secondary text-brand-primary shadow-2xl shadow-brand-secondary/20">
                        <ShieldAlert className="w-8 h-8 mb-6 opacity-40 text-brand-primary" />
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Submission Protocol</h3>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed mb-8">
                            Ensure all imagery is high-contrast and clear. Position the camera at a 45° angle to the incident for optimal AI depth analysis.
                        </p>
                        <ul className="space-y-4">
                            {['Clear photographic evidence', 'Active GPS lock enabled', 'Precise incident description'].map((item, i) => (
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
                            Gemini Vision AI will automatically categorize, score, and tag your submission.
                        </p>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Dropzone */}
                        <motion.div
                            onDragEnter={handleDrag} onDragLeave={handleDrag}
                            onDragOver={handleDrag} onDrop={handleDrop}
                            onClick={() => !preview && !isAnalyzing && fileInputRef.current?.click()}
                            className={`relative minimal-card aspect-video flex flex-col items-center justify-center p-2 overflow-hidden transition-all duration-300 
                                ${dragActive ? 'border-brand-secondary bg-brand-secondary/5 scale-[0.99]' : 'border-brand-secondary/10'}
                                ${!preview && !isAnalyzing && 'cursor-pointer hover:border-brand-secondary/30'}`}
                        >
                            <AnimatePresence mode="wait">
                                {isAnalyzing ? (
                                    <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary animate-pulse">
                                            Analyzing image using AI…
                                        </div>
                                        <div className="text-[9px] text-brand-secondary/30 uppercase tracking-widest font-bold">
                                            Gemini Vision • Risk Scoring • Tag Detection
                                        </div>
                                    </motion.div>
                                ) : preview ? (
                                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full rounded-xl overflow-hidden">
                                        <img src={preview} alt="Capture" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-brand-secondary/10" />
                                        <button type="button" onClick={clearImage}
                                            className="absolute top-4 right-4 p-2 bg-brand-primary/80 backdrop-blur-md rounded-full text-brand-secondary hover:bg-brand-primary transition-all shadow-xl">
                                            <X size={20} />
                                        </button>
                                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-brand-primary/80 backdrop-blur-md rounded-lg border border-brand-secondary/5">
                                            <Sparkles size={12} className="text-brand-secondary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">AI Analyzed</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="upload" className="text-center p-8">
                                        <div className="w-16 h-16 rounded-3xl bg-brand-secondary/5 border border-brand-secondary/5 flex items-center justify-center mx-auto mb-6">
                                            <Camera className="w-8 h-8 text-brand-secondary opacity-40" />
                                        </div>
                                        <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest mb-2">Initialize Capture</h4>
                                        <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Tap for camera or drag image here</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
                        </motion.div>

                        {/* AI Error */}
                        <AnimatePresence>
                            {aiError && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-4">
                                    <ShieldAlert className="text-orange-500 shrink-0 mt-1" size={18} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">AI Analysis Failed</div>
                                        <div className="text-[10px] font-bold text-orange-500/60 uppercase tracking-tight leading-relaxed">{aiError}</div>
                                        <div className="text-[9px] font-black text-orange-400/60 uppercase tracking-widest mt-1">You can still submit manually using the fields below.</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* AI VERIFICATION CARD */}
                        <AnimatePresence>
                            {aiAnalysis && !isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    className={`minimal-card border p-0 overflow-hidden ${riskColors?.light || 'border-brand-secondary/10'}`}
                                >
                                    {/* Card Header */}
                                    <div className={`px-8 py-5 flex items-center justify-between ${riskColors?.bg || 'bg-brand-secondary'} text-white`}>
                                        <div className="flex items-center gap-3">
                                            <Activity size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gemini Intelligence Report</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Confidence</span>
                                            <span className="text-sm font-black">{aiAnalysis.ai_confidence}%</span>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        {/* Risk Score Bar */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-[0.2em]">Risk Score</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-black ${riskColors?.text}`}>{aiAnalysis.risk_score}</span>
                                                    <span className="text-[9px] font-black text-brand-secondary/20">/100</span>
                                                    <span className={`ml-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${riskColors?.badge}`}>
                                                        {aiAnalysis.severity}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-brand-secondary/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${aiAnalysis.risk_score}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                                    className={`h-full rounded-full ${riskColors?.bg}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Meta badges */}
                                        <div className="flex flex-wrap gap-3">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-brand-secondary/5 rounded-xl border border-brand-secondary/5">
                                                <Clock size={12} className="text-brand-secondary/40" />
                                                <span className="text-[9px] font-black text-brand-secondary/60 uppercase tracking-widest">{aiAnalysis.urgency}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-brand-secondary/5 rounded-xl border border-brand-secondary/5">
                                                <AlertTriangle size={12} className="text-brand-secondary/40" />
                                                <span className="text-[9px] font-black text-brand-secondary/60 uppercase tracking-widest">Impact: {aiAnalysis.impact}</span>
                                            </div>
                                            {aiAnalysis.risk_score >= 80 && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-red-500 rounded-xl">
                                                    <Zap size={12} className="text-white" />
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Auto-Escalate</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Editable Category */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Detected Issue</span>
                                                <button type="button" onClick={() => setEditingCategory(!editingCategory)} className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest hover:text-brand-secondary flex items-center gap-1 transition-colors">
                                                    <Edit3 size={10} /> Edit
                                                </button>
                                            </div>
                                            {editingCategory ? (
                                                <select value={category} onChange={e => { setCategory(e.target.value); setEditingCategory(false); }}
                                                    className="w-full input-field py-3 bg-white text-[11px] font-black uppercase tracking-widest">
                                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            ) : (
                                                <div className="flex items-center gap-3 px-4 py-3 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/5">
                                                    <MapPin size={16} className="text-brand-secondary/20" />
                                                    <span className="text-sm font-black text-brand-secondary uppercase tracking-tight">{category || 'Other'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Editable Description */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">AI Description</span>
                                                <button type="button" onClick={() => setEditingDescription(!editingDescription)} className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest hover:text-brand-secondary flex items-center gap-1 transition-colors">
                                                    <Edit3 size={10} /> Edit
                                                </button>
                                            </div>
                                            {editingDescription ? (
                                                <textarea value={description} onChange={e => setDescription(e.target.value)}
                                                    onBlur={() => setEditingDescription(false)}
                                                    rows={3} autoFocus
                                                    className="w-full input-field py-3 bg-white text-[11px] font-bold resize-none" />
                                            ) : (
                                                <p className="text-sm text-brand-secondary/60 leading-relaxed font-medium px-4 py-3 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/5">
                                                    {description || 'No description generated.'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Editable Tags */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Auto Tags</span>
                                                <button type="button" onClick={() => setEditingTags(!editingTags)} className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest hover:text-brand-secondary flex items-center gap-1 transition-colors">
                                                    <Tag size={10} /> {editingTags ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => (
                                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary text-brand-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        {tag}
                                                        {editingTags && (
                                                            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-60 transition-opacity">
                                                                <X size={10} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                            {editingTags && (
                                                <div className="flex gap-2 mt-3">
                                                    <input
                                                        value={tagInput}
                                                        onChange={e => setTagInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                                                        placeholder="Add tag..."
                                                        className="flex-1 input-field py-2 text-[10px] font-black uppercase tracking-widest bg-white"
                                                    />
                                                    <button type="button" onClick={() => addTag(tagInput)} className="px-4 py-2 bg-brand-secondary text-brand-primary rounded-xl text-[9px] font-black uppercase tracking-widest">Add</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Location detected */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Deployment Coordinates</span>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${locationCaptured ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40">
                                                        {locationCaptured ? 'GPS Active' : 'Manual Overide'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-48 w-full relative z-0">
                                                <LocationPickerMap
                                                    lat={latitude}
                                                    lng={longitude}
                                                    onChange={(newLat, newLng) => {
                                                        setLatitude(newLat);
                                                        setLongitude(newLng);
                                                        setLocationCaptured(false); // Flag as manual once moved
                                                    }}
                                                />
                                            </div>

                                            {aiAnalysis.location_detected.confidence > 0 && (
                                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                                                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Contextual Suggestion</p>
                                                        <p className="text-[10px] font-bold text-blue-500/80 uppercase tracking-wide">
                                                            {[aiAnalysis.location_detected.street, aiAnalysis.location_detected.landmark, aiAnalysis.location_detected.city].filter(Boolean).join(' · ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accept/Confirm Row */}
                                        <div className="pt-4 border-t border-brand-secondary/5">
                                            {!aiConfirmed ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setAiConfirmed(true)}
                                                    className="w-full py-4 bg-brand-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-95 transition-all shadow-xl shadow-brand-secondary/20"
                                                >
                                                    <CheckCheck size={16} />
                                                    Accept AI Analysis
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-200 rounded-2xl">
                                                    <CheckCircle2 size={18} className="text-green-500" />
                                                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Analysis Accepted — Ready to Submit</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Manual fallback fields (show only if AI failed or no analysis yet) */}
                        {(!aiAnalysis || aiAnalysis.ai_failed) && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    placeholder="ISSUE DESIGNATOR (E.G. POTHOLE)"
                                    className="input-field py-4 bg-transparent border-brand-secondary/10 text-[10px] font-black uppercase tracking-widest"
                                />
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="CONTEXTUAL DATA POINTS..."
                                    className="input-field py-4 bg-transparent border-brand-secondary/10 min-h-[120px] resize-none text-[10px] font-black uppercase tracking-widest"
                                />
                                {!aiAnalysis && (
                                    <button type="button" onClick={() => setAiConfirmed(true)}
                                        className="w-full py-3 border border-brand-secondary/20 text-brand-secondary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/5 transition-all">
                                        Submit Without AI Analysis
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!canSubmit || loading}
                            className={`w-full btn-primary py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-brand-secondary/20 flex items-center justify-center gap-4 group transition-all
                                ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Zap size={18} />
                                    {!image ? 'Upload Image First' : !aiAnalysis ? 'Analyzing...' : !aiConfirmed ? 'Confirm AI Analysis First' : 'Transmit Data Packet'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};
