"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient, Session, User } from "@supabase/auth-helpers-nextjs";
import type { AuthError } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';

interface SignInResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email_param: string, password_param: string) => Promise<SignInResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email_param: string, password_param: string): Promise<SignInResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email_param,
      password: password_param,
    });
    return { data: { user: data.user, session: data.session }, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
    }
    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
