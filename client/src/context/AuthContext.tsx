import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'citizen' | 'worker' | 'admin';
    created_at: string;
    avatar_url?: string;
    phone?: string;
    ward?: string;
}

export interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (data: { full_name?: string; avatar_url?: string; phone?: string; ward?: string }) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data as Profile;
    };

    const refreshProfile = async () => {
        if (!user) return;
        const profileData = await fetchProfile(user.id);
        setProfile(profileData);
    };

    // 1. Initial hydration on mount
    useEffect(() => {
        let isMounted = true;
        const syncAuth = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    setUser(session.user);
                    setProfileLoading(true);
                    const profileData = await fetchProfile(session.user.id);
                    if (isMounted) setProfile(profileData);
                    setProfileLoading(false);
                }
            } catch (err) {
                console.error('[Auth Init] Recovery Failed:', err);
            } finally {
                if (isMounted) {
                    setIsInitialized(true);
                    setLoading(false);
                }
            }
        };
        syncAuth();
    }, []);

    // 2. Global state change monitoring
    useEffect(() => {
        let isMounted = true;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth Event] ${event}`);
            if (!isMounted) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setLoading(false);
                setProfileLoading(false);
            } else if (session?.user) {
                setUser(session.user);
                setProfileLoading(true);
                const profileData = await fetchProfile(session.user.id);
                if (isMounted) setProfile(profileData);
                setProfileLoading(false);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone || '',
                },
            },
        });
        if (error) throw error;
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const updateProfile = async (data: { full_name?: string; avatar_url?: string; phone?: string; ward?: string }) => {
        if (!user) return;
        const updateData: any = {};
        if (data.full_name !== undefined) updateData.full_name = data.full_name;
        if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.ward !== undefined) updateData.ward = data.ward;

        const { error } = await (supabase.from('profiles') as any)
            .update(updateData)
            .eq('id', user.id);
        if (error) throw error;
        await refreshProfile();
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    const value = {
        user,
        profile,
        loading: (!isInitialized || loading || profileLoading),
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
