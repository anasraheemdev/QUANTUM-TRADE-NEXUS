"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Session refreshed');
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          router.push('/');
        }

        // Handle sign up - create user profile if it doesn't exist
        if (String(event) === 'SIGNED_UP' && session?.user) {
          try {
            const response = await fetch('/api/user/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
              }),
            });

            if (!response.ok) {
              const result = await response.json();
              console.error('Error creating user profile on signup:', result.error);
            } else {
              console.log('User profile created on signup');
            }
          } catch (error) {
            console.error('Error creating user profile:', error);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign-in error:', error.message);
        return { error };
      }

      console.log('Sign-in successful, session:', data.session ? 'exists' : 'missing');
      console.log('User:', data.user?.email);

      // Wait for session to be set
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('Session set successfully');
        // Don't redirect here - let the signin page handle it
      } else {
        console.warn('No session returned from sign-in');
        return { error: { message: 'No session returned. Please check if email confirmation is required.' } };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign-in exception:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      console.log('Auth signup successful, user:', data.user?.id);

      // If user is created, the database trigger should automatically create the profile
      // We'll verify it was created, and use API route as fallback if needed
      if (data.user) {
        console.log('User created:', data.user.id);
        console.log('Database trigger should create profile automatically');
        
        // Wait a moment for trigger to execute, then verify
        setTimeout(async () => {
          try {
            // Check if profile was created by trigger
            if (!data.user) {
              console.log('No user in data, skipping profile check');
              return;
            }
            
            const { data: profile, error: checkError } = await supabase
              .from('users')
              .select('id')
              .eq('id', data.user.id)
              .single();

            if (profile) {
              console.log('✅ User profile created by database trigger');
            } else if (checkError) {
              console.log('Profile not found, trying API route as fallback...');
              
              // Fallback: Use API route if trigger didn't work
              const response = await fetch('/api/user/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: data.user.id,
                  email: data.user.email,
                  name: name,
                }),
              });

              const result = await response.json();
              
              if (!response.ok) {
                console.warn('API route also failed:', result.error);
                console.warn('Profile will be created on first login');
              } else {
                console.log('✅ User profile created via API route');
              }
            }
          } catch (error) {
            console.error('Error checking/creating profile:', error);
          }
        }, 1000); // Wait 1 second for trigger

        // Set session and user if available
        if (data.session) {
          console.log('Session available, setting user and redirecting');
          setSession(data.session);
          setUser(data.user);
          router.push("/dashboard");
          router.refresh();
        } else {
          // If email confirmation is required
          console.log('No session - email confirmation may be required');
          // Still redirect to signin with message
          router.push("/signin?message=Please check your email to confirm your account");
        }
      } else {
        console.log('No user returned from signup');
        return { error: { message: 'User creation failed' } };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup exception:', error);
      return { error: error.message || 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      setSession(null);
      setUser(null);
      router.push("/");
      router.refresh(); // Refresh to update middleware
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

