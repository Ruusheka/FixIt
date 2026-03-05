import React, { useRef, useState, useEffect } from 'react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import {
    User, Mail, Shield, ShieldAlert, Camera, Phone, MapPin,
    Calendar, Edit3, Lock, Save, X, LogOut
} from 'lucide-react';
import { format } from 'date-fns';

export const WorkerProfile: React.FC = () => {
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
            await updateProfile({ full_name: editName, phone: editPhone, ward: editWard });
            setEditing(false);
        } catch (error: any) {
            alert('Error: ' + error.message);
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

    return (
        <WorkerLayout title="Operative Profile">
            <div className="max-w-4xl mx-auto py-8">
                <div className="bg-brand-secondary rounded-[40px] p-8 md:p-12 mb-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 text-white">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    {/* Avatar with upload */}
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-[24px] bg-brand-primary flex flex-col items-center justify-center text-brand-secondary font-black shadow-lg border-4 border-white/10 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                                <span className="text-4xl">{profile?.full_name?.[0] || 'O'}</span>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-2 -right-2 p-2.5 bg-brand-primary text-brand-secondary rounded-xl shadow-xl border border-brand-secondary/5 hover:scale-110 transition-transform disabled:opacity-50"
                        >
                            {uploading ? <div className="w-4 h-4 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin" /> : <Camera size={18} />}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="text-center md:text-left z-10 flex-1">
                        {editing ? (
                            <input
                                id="worker-edit-name"
                                name="worker-edit-name"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="text-3xl font-black uppercase tracking-tighter mb-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2 outline-none text-white w-full"
                            />
                        ) : (
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{profile?.full_name || 'Operative'}</h2>
                        )}
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

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Full Legal Name</p>
                                    <p className="font-bold text-brand-secondary">{profile?.full_name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <Mail size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Registered Comm Link</p>
                                    <p className="font-bold text-brand-secondary">{profile?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <Phone size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Phone</p>
                                    {editing ? (
                                        <input id="worker-edit-phone" name="worker-edit-phone" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 ..." className="font-bold text-brand-secondary bg-brand-secondary/5 border border-brand-secondary/10 rounded-xl px-3 py-1 outline-none w-full" />
                                    ) : (
                                        <p className="font-bold text-brand-secondary">{profile?.phone || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Zone/Ward</p>
                                    {editing ? (
                                        <input id="worker-edit-ward" name="worker-edit-ward" value={editWard} onChange={e => setEditWard(e.target.value)} placeholder="Zone..." className="font-bold text-brand-secondary bg-brand-secondary/5 border border-brand-secondary/10 rounded-xl px-3 py-1 outline-none w-full" />
                                    ) : (
                                        <p className="font-bold text-brand-secondary">{profile?.ward || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0">
                                    <Calendar size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black tracking-widest text-brand-secondary/40 uppercase">Joined</p>
                                    <p className="font-bold text-brand-secondary">{format(new Date(profile?.created_at || Date.now()), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 pt-6 border-t border-brand-secondary/5 mt-6">
                            {editing ? (
                                <>
                                    <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-brand-secondary text-brand-primary rounded-xl flex items-center gap-2 disabled:opacity-50">
                                        <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl flex items-center gap-2">
                                        <X size={14} /> Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditing(true)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-brand-secondary text-brand-primary rounded-xl flex items-center gap-2">
                                        <Edit3 size={14} /> Edit Profile
                                    </button>
                                    <button onClick={handleChangePassword} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl flex items-center gap-2">
                                        <Lock size={14} /> Change Password
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </WorkerLayout>
    );
};
