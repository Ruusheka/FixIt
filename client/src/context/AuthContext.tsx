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
        let isMounted = true;
        setLoading(true);

        // Listen for auth changes and handle initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Event: ${event}`, session ? `User: ${session.user.email}` : 'No Session');

            if (!isMounted) return;

            if (session?.user) {
                setUser(session.user);
                // Important: Ensure profile is loaded (if not already match)
                // before finishing loading wait, to prevent redirect loop.
                const profileData = await fetchProfile(session.user.id);
                if (isMounted) {
                    setProfile(profileData);
                    setLoading(false);
                }
            } else {
                setUser(null);
                setProfile(null);
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
