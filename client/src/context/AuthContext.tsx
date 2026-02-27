import React, { createContext, useContext, useEffect, useState } from 'react';
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
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthProvider mounted, initializing Supabase auth...');
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.log('Supabase Error Object:', error); // DEBUG LOG
            if (error.code === 'PGRST116' || error.message?.includes('profiles" does not exist')) {
                console.warn('Profiles table not found. Please check Supabase Table Editor.');
            } else {
                console.error('Error fetching profile:', error);
            }
            return null;
        }
        return data as Profile;
    };

    const refreshProfile = async () => {
        if (!user) return;
        const profileData = await fetchProfile(user.id);
        setProfile(profileData);
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).then(setProfile);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const profileData = await fetchProfile(session.user.id);
                setProfile(profileData);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
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
        const { error } = await (supabase.from('profiles') as any)
            .update({
                full_name: data.full_name,
                avatar_url: data.avatar_url,
                phone: data.phone,
                ward: data.ward
            })
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
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
