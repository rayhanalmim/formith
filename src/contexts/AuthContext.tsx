import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { socketClient } from '@/lib/socket';

// Custom user type for Node.js auth
interface AppUser {
  id: string;
  email: string | null;
  roles?: string[];
}

interface AppProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  display_name_ar?: string | null;
  bio?: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  is_verified: boolean;
  is_banned: boolean;
  is_email_verified: boolean;
  ban_reason?: string | null;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

interface AuthContextType {
  user: AppUser | null;
  profile: AppProfile | null;
  loading: boolean;
  isBanned: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, redirectUrl?: string, language?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresMFA?: boolean; mfaFactorId?: string }>;
  completeMFASignIn: (factorId: string, code: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const { toast } = useToast();

  const handleBanDetected = useCallback(async (banReason?: string | null) => {
    setIsBanned(true);
    toast({
      variant: 'destructive',
      title: 'Account Banned',
      description: banReason || 'Your account has been banned. You will be logged out.',
      duration: 5000,
    });
    // Force logout after short delay to show the message
    setTimeout(async () => {
      api.signOut();
      setUser(null);
      setProfile(null);
    }, 1500);
  }, [toast]);

  // Check ban status and subscribe to realtime updates
  useEffect(() => {
    if (!user || !profile) {
      setIsBanned(false);
      return;
    }

    // Initial check for ban status from profile
    if (profile.is_banned) {
      handleBanDetected(profile.ban_reason);
    }

    // Subscribe to user status changes via Socket.io for ban detection
    const unsubscribeStatus = socketClient.onUserStatusChange((event) => {
      if (event.userId === user.id && event.status === 'banned') {
        // Refresh profile to get ban reason
        api.getProfile(user.id).then((response) => {
          const profileData = response.data as unknown as AppProfile | null;
          if (profileData?.is_banned) {
            handleBanDetected(profileData.ban_reason);
          }
        });
      }
    });

    // Subscribe to direct ban event from admin
    const handleBan = (event: { userId: string; banReason: string }) => {
      console.log('[AuthContext] Received user:banned event:', event);
      if (event.userId === user.id) {
        console.log('[AuthContext] User ID matches, triggering ban detection');
        handleBanDetected(event.banReason);
      } else {
        console.log('[AuthContext] User ID does not match current user');
      }
    };
    console.log('[AuthContext] Subscribing to user:banned event for user:', user.id);
    socketClient.on<{ userId: string; banReason: string }>('user:banned', handleBan);

    return () => {
      unsubscribeStatus();
      socketClient.off<{ userId: string; banReason: string }>('user:banned', handleBan);
    };
  }, [user, profile, handleBanDetected]);

  // Refresh profile from API
  const refreshProfile = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const response = await api.getMe();
      if (response.success && response.user && response.profile) {
        setUser(response.user);
        setProfile(response.profile as AppProfile);
      } else {
        // Token might be invalid
        api.signOut();
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      api.signOut();
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      if (api.isAuthenticated()) {
        try {
          const response = await api.getMe();
          if (response.success && response.user && response.profile) {
            setUser(response.user);
            setProfile(response.profile as AppProfile);
          } else {
            // Token invalid, clear it
            api.signOut();
          }
        } catch (error) {
          console.error('Auth init error:', error);
          api.signOut();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, redirectUrl?: string, language?: string) => {
    const verifyUrl = redirectUrl || `${window.location.origin}/verify-email`;
    
    try {
      const response = await api.signUp(email, password, verifyUrl, language || 'en');
      
      if (!response.success) {
        return { error: new Error(response.message) };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called, using Node.js API');
    try {
      const response = await api.signIn(email, password);
      console.log('[AuthContext] API response:', response);

      if (!response.success) {
        return { error: new Error(response.message) };
      }

      // Check if MFA is required
      if (response.requiresMFA) {
        return {
          error: null,
          requiresMFA: true,
          mfaFactorId: response.mfaFactorId
        };
      }

      // Set user and profile from response
      if (response.user) {
        setUser(response.user);
      }
      if (response.profile) {
        setProfile(response.profile as AppProfile);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const completeMFASignIn = async (factorId: string, code: string) => {
    try {
      const response = await api.challengeMFA(factorId, code);

      if (!response.success) {
        return { error: new Error(response.message) };
      }

      // Set user and profile from response
      if (response.user) {
        setUser(response.user);
      }
      if (response.profile) {
        setProfile(response.profile as AppProfile);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    api.signOut();
    setUser(null);
    setProfile(null);
    setIsBanned(false);
  };

  const isAuthenticated = !!user && !!api.getToken();

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isBanned,
      isAuthenticated,
      signUp,
      signIn,
      completeMFASignIn,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
