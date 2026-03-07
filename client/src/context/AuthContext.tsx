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
    // 1. Consolidated State for Atomic Updates (Prevents Flickering)
    const [state, setState] = useState<{
        user: User | null;
        profile: Profile | null;
        isLoading: boolean;
        isInitialAuthDone: boolean;
        isProfileSyncing: boolean;
    }>({
        user: null,
        profile: null,
        isLoading: true,
        isInitialAuthDone: false,
        isProfileSyncing: false
    });

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[Auth Service] Critical Profile Read Failure:', error);
                return null;
            }
            return data as Profile;
        } catch (e) {
            console.error('[Auth Service] Unexpected Fetch Error:', e);
            return null;
        }
    };

    const refreshProfile = async () => {
        if (!state.user) return;
        setState(prev => ({ ...prev, isProfileSyncing: true }));
        const profileData = await fetchProfile(state.user.id);
        setState(prev => ({
            ...prev,
            profile: profileData,
            isProfileSyncing: false
        }));
    };

    // 2. Synchronized Initialization Routine
    useEffect(() => {
        let isMounted = true;

        const initializeAuthSystem = async () => {
            try {
                // 1. Recover Session from Storage
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (session?.user) {
                    // 2. Fetch Profile before resolving 'loading'
                    const profileData = await fetchProfile(session.user.id);
                    if (isMounted) {
                        setState({
                            user: session.user,
                            profile: profileData,
                            isLoading: false,
                            isInitialAuthDone: true,
                            isProfileSyncing: false
                        });
                    }
                } else {
                    // 3. No session, resolve immediately
                    setState({
                        user: null,
                        profile: null,
                        isLoading: false,
                        isInitialAuthDone: true,
                        isProfileSyncing: false
                    });
                }
            } catch (err) {
                console.error('[Auth System] Critical boot failure:', err);
                if (isMounted) {
                    setState(prev => ({ ...prev, isLoading: false, isInitialAuthDone: true }));
                }
            }
        };

        initializeAuthSystem();

        // 3. Subscription Management
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[🔐 Security Event] ${event}`);
            if (!isMounted) return;

            if (event === 'SIGNED_OUT') {
                setState({
                    user: null,
                    profile: null,
                    isLoading: false,
                    isInitialAuthDone: true,
                    isProfileSyncing: false
                });
            } else if (session?.user) {
                // Prevent duplicate syncing if we already have the profile for this user
                setState(prev => {
                    if (prev.user?.id === session.user.id && prev.profile) {
                        return { ...prev, user: session.user, isLoading: false, isInitialAuthDone: true };
                    }
                    return { ...prev, isProfileSyncing: true, user: session.user };
                });

                // Fetch if needed
                const currentProfile = await fetchProfile(session.user.id);
                if (isMounted) {
                    setState({
                        user: session.user,
                        profile: currentProfile,
                        isLoading: false,
                        isInitialAuthDone: true,
                        isProfileSyncing: false
                    });
                }
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
        if (!state.user) return;
        const updateData: any = {};
        if (data.full_name !== undefined) updateData.full_name = data.full_name;
        if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.ward !== undefined) updateData.ward = data.ward;

        const { error } = await (supabase.from('profiles') as any)
            .update(updateData)
            .eq('id', state.user.id);
        if (error) throw error;
        await refreshProfile();
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    const value = {
        user: state.user,
        profile: state.profile,
        loading: (!state.isInitialAuthDone || state.isLoading || state.isProfileSyncing),
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
