import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, MapPin, Calendar, Edit3, Lock, Camera,
    ShieldCheck, Phone, LayoutDashboard, ClipboardCheck,
    Shield, Radio, BarChart3, Target, Save, X, LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { MinimalLayout } from '../components/MinimalLayout';
import { adminNavItems } from '../constants/adminNav';

const navItems = adminNavItems;

export const AdminProfilePage: React.FC = () => {
    const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(profile?.full_name || '');
    const [editPhone, setEditPhone] = useState(profile?.phone || '');
    const [editWard, setEditWard] = useState(profile?.ward || '');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile) {
            setEditName(profile.full_name || '');
            setEditPhone(profile.phone || '');
            setEditWard(profile.ward || '');
        }
    }, [profile]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await updateProfile({ avatar_url: publicUrl });
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert('Error updating avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateProfile({
                full_name: editName,
                phone: editPhone,
                ward: editWard,
            });
            setEditing(false);
        } catch (error: any) {
            alert('Error saving profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        const newPassword = prompt("Enter new password (min 6 characters):");
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        try {
            await updatePassword(newPassword);
            alert("Password updated successfully.");
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const citizenId = `ADM-${user?.id?.slice(0, 8).toUpperCase() || 'XXXXXX'}`;

    return (
        <MinimalLayout navItems={navItems} title="Admin Profile">
            <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-10 py-8">
                {/* Identity Block */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="minimal-card p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-10 items-center md:items-start"
                >
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-36 h-36 rounded-[2.5rem] bg-brand-secondary flex items-center justify-center text-brand-primary text-5xl font-black shadow-2xl overflow-hidden border-4 border-white">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.[0] || 'A'
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-2 -right-2 p-3 bg-brand-primary text-brand-secondary rounded-2xl shadow-xl border border-brand-secondary/5 hover:scale-110 transition-transform disabled:opacity-50"
                        >
                            {uploading ? <div className="w-5 h-5 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin" /> : <Camera size={20} />}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-5 text-center md:text-left">
                        <div className="space-y-2">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                {editing ? (
                                    <input
                                        id="admin-edit-name"
                                        name="admin-edit-name"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="text-3xl font-black text-brand-secondary uppercase tracking-tight bg-brand-secondary/5 border border-brand-secondary/10 rounded-xl px-4 py-2 outline-none"
                                    />
                                ) : (
                                    <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tight leading-none">
                                        {profile?.full_name || 'Admin'}
                                    </h2>
                                )}
                                <ShieldCheck size={24} className="text-green-600" />
                            </div>
                            <p className="text-[12px] font-black text-brand-secondary/30 uppercase tracking-[0.4em]">
                                Admin ID: {citizenId}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                <Mail size={16} className="text-brand-secondary/30" /> {profile?.email}
                            </div>
                            {editing ? (
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <Phone size={16} className="text-brand-secondary/30" />
                                    <input id="admin-edit-phone" name="admin-edit-phone" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 ..." className="bg-transparent outline-none flex-1 font-bold text-brand-secondary" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <Phone size={16} className="text-brand-secondary/30" /> {profile?.phone || 'Not set'}
                                </div>
                            )}
                            {editing ? (
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <MapPin size={16} className="text-brand-secondary/30" />
                                    <input id="admin-edit-ward" name="admin-edit-ward" value={editWard} onChange={e => setEditWard(e.target.value)} placeholder="Ward/Zone" className="bg-transparent outline-none flex-1 font-bold text-brand-secondary" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <MapPin size={16} className="text-brand-secondary/30" /> {profile?.ward || 'Not set'}
                                </div>
                            )}
                            <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                <Calendar size={16} className="text-brand-secondary/30" /> Joined {format(new Date(profile?.created_at || Date.now()), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-green-600 bg-green-50 p-4 rounded-2xl border border-green-100">
                                <Shield size={16} /> System Administrator
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                            {editing ? (
                                <>
                                    <button onClick={handleSaveProfile} disabled={saving} className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest bg-brand-secondary text-brand-primary rounded-xl flex items-center gap-2 disabled:opacity-50">
                                        <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl flex items-center gap-2">
                                        <X size={14} /> Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditing(true)} className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest bg-brand-secondary text-brand-primary rounded-xl flex items-center gap-2">
                                        <Edit3 size={14} /> Edit Profile
                                    </button>
                                    <button onClick={handleChangePassword} className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl flex items-center gap-2">
                                        <Lock size={14} /> Change Password
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </MinimalLayout>
    );
};
