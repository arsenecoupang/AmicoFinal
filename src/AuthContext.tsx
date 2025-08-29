import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "./db";

export type User = {
  username: string;
  email?: string;
};

interface AuthContextType {
  user: User | null;
  login: (user: User) => void; // manual setter used by some components
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Initialize session from Supabase and subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = (sessionData as any)?.session;
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', session.user.id)
            .single();
          if (mounted) setUser({ username: profile?.username || '', email: profile?.email || session.user.email || '' });
        }
      } catch (e) {
        // ignore
      }
    }

    init();

    const { data: { subscription } = { data: { subscription: null } } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', session.user.id)
            .single();
          if (mounted) setUser({ username: profile?.username || '', email: profile?.email || session.user.email || '' });
        } else {
          if (mounted) setUser(null);
        }
      } catch (e) { if (mounted) setUser(null); }
    });

    return () => { mounted = false; try { subscription?.unsubscribe?.(); } catch (e) {} };
  }, []);

  const login = (u: User) => setUser(u);
  const logout = async () => {
    try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

